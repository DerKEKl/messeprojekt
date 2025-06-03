"""
Hauptprogramm für den Raspberry Pi Sensor Server
"""
import asyncio
import os
import signal
import sys

import RPi.GPIO as GPIO

# Lokale Imports
from config import *
from controllers.fan_controller import FanController
from controllers.led_controller import LEDController
from sensors.image_processor import ImageProcessor
from sensors.temperature_sensor import TemperatureHumiditySensor
from servers.opcua_server import OPCUAServer
from servers.tcp_server import ColorSensorServer
from utils.logger import setup_logging


class SensorServer:
    """
    Hauptklasse für den Sensor Server
    """

    def __init__(self):

        self.logger = setup_logging()
        self.running = False

        # Komponenten
        self.led_controller = None
        self.temp_sensor = None
        self.image_processor = None
        self.fan_controller = None
        self.tcp_server = None
        self.opcua_server = None

        # Signal Handler für sauberes Beenden
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        """Handler für Beendigungs-Signale"""
        self.logger.info(f"Signal {signum} empfangen - beende Programm...")
        self.running = False

    def initialize_components(self):
        """Initialisiert alle Komponenten mit Fehlerbehandlung"""
        self.logger.info("Initialisierung der Komponenten gestartet...")

        script_dir = os.path.dirname(os.path.abspath(__file__))

        # Construct absolute paths for certificates and PKI structure
        # These absolute paths will be passed to OPCUAServer
        absolute_certificate_path = os.path.join(script_dir, CERTIFICATE_PATH)
        absolute_private_key_path = os.path.join(script_dir, PRIVATE_KEY_PATH)
        absolute_trusted_certs_dir = os.path.join(script_dir, TRUSTED_CERTS)
        absolute_rejected_certs_dir = os.path.join(script_dir, REJECTED_CERTS)
        absolute_issued_certs_dir = os.path.join(script_dir, ISSUED_CERTS)

        # Ensure all necessary directories exist
        os.makedirs(os.path.dirname(absolute_certificate_path), exist_ok=True)  # For server's own cert/key
        os.makedirs(absolute_trusted_certs_dir, exist_ok=True)
        os.makedirs(absolute_rejected_certs_dir, exist_ok=True)
        os.makedirs(absolute_issued_certs_dir, exist_ok=True)

        # Temperatursensor
        self.temp_sensor = self._safe_init(
            TemperatureHumiditySensor,
            "Temperatursensor",
            logger=self.logger
        )

        # Ledsteuerung
        self.led_controller = self._safe_init(
            lambda: LEDController(LED_PIN, logger=self.logger),
            "LED Controller",
        )

        # Bildverarbeitung
        self.image_processor = self._safe_init(
            ImageProcessor,
            "Bildverarbeitung",
            logger=self.logger
        )

        # Lüftersteuerung
        self.fan_controller = self._safe_init(
            lambda: FanController(FAN_PIN, logger=self.logger),
            "Lüftersteuerung",
        )

        # TCP Server
        self.tcp_server = self._safe_init(
            lambda: ColorSensorServer(TCP_HOST, TCP_PORT, logger=self.logger),
            "TCP-Server",
        )

        # OPC UA Server
        self.opcua_server = self._safe_init(
            lambda: OPCUAServer(OPCUA_ENDPOINT, OPCUA_SERVER_NAME,
                                absolute_certificate_path, absolute_private_key_path,
                                absolute_trusted_certs_dir, absolute_rejected_certs_dir,
                                absolute_issued_certs_dir, logger=self.logger),
            "OPC UA Server",
        )

        self.logger.info("Komponenteninitialisierung abgeschlossen")

    def _safe_init(self, init_func, component_name, **kwargs):
        """Sichere Initialisierung mit Fallback"""
        try:
            component = init_func(**kwargs) if kwargs else init_func()
            self.logger.info(f"{component_name} erfolgreich initialisiert")
            return component
        except Exception as e:
            self.logger.error(f"Fehler bei der Initialisierung von {component_name}: {e}")
            return None

    def start_servers(self):
        """Startet alle Server"""
        self.logger.info("Starte Server...")

        # TCP Server starten
        tcp_started = False
        if self.tcp_server:
            tcp_started = self.tcp_server.start()

        # OPC UA Server starten
        opcua_started = False
        if self.opcua_server:
            opcua_started = self.opcua_server.start()

        self.logger.info(f"Server-Status - TCP: {'OK' if tcp_started else 'FEHLER'}, "
                         f"OPC UA: {'OK' if opcua_started else 'FEHLER'}")

        return tcp_started or opcua_started

    async def led_blink_task(self):
        """Async LED Blink-Task, der periodisch blinkt."""
        if not self.led_controller:
            self.logger.warning("LED Controller nicht initialisiert - Blink-Task wird nicht gestartet")
            return

        try:
            await self.led_controller.blink_led(duration=0.5)
        except Exception as e:
            self.logger.error(f"Fehler in LED Blink Task: {e}")
            await asyncio.sleep(1)

    async def run_main_loop(self):
        """Hauptschleife für Sensordatenerfassung und -verarbeitung"""
        self.logger.info("Starte Hauptschleife...")
        self.logger.info("Drücken Sie STRG+C zum Beenden.")

        self.running = True

        while self.running:
            try:
                temperature, humidity = self._read_temperature_sensor()
                rgb = self._get_rgb_values()
                fan_status = self._control_fan(temperature)

                if self.tcp_server:
                    self.tcp_server.update_color(rgb)

                self.logger.info(
                    f"Werte - Temp: {temperature}°C, Humidity: {humidity}%, "
                    f"RGB: {rgb}, Lüfter: {'AN' if fan_status else 'AUS'}"
                )

                await self.led_blink_task()

                if self.opcua_server:
                    self.opcua_server.update_values(temperature, humidity, rgb, fan_status)

                await asyncio.sleep(SENSOR_READ_INTERVAL)

            except Exception as e:
                self.logger.error(f"Fehler in der Hauptschleife: {e}", exc_info=True)
                await asyncio.sleep(1)

    def _read_temperature_sensor(self):
        """Liest Temperatur- und Feuchtigkeitswerte"""
        if self.temp_sensor:
            try:
                return self.temp_sensor.read_sensor()
            except Exception as e:
                self.logger.error(f"Fehler beim Lesen des Temperatursensors: {e}")
        return None, None

    def _get_rgb_values(self):
        """Ermittelt RGB-Werte direkt von der Kamera (ImageProcessor)"""
        try:
            if self.image_processor:
                return self.image_processor.get_rgb_values()
        except Exception as e:
            self.logger.error(f"Fehler beim Ermitteln der RGB-Werte: {e}")

        return 0, 0, 0

    def _control_fan(self, temperature):
        """Steuert den Lüfter basierend auf Temperatur und OPC UA Eingaben"""
        if not self.fan_controller:
            return False

        try:
            # Manuelle Steuerung über OPC UA prüfen
            manual_control = False
            if self.opcua_server:
                manual_control = self.opcua_server.get_fan_control()

            if manual_control:
                self.fan_controller.set_mode(False)  # Manueller Modus
                self.fan_controller.set_fan(manual_control)
            else:
                self.fan_controller.set_mode(True)  # Automatischer Modus
                self.fan_controller.auto_control(temperature)

            return self.fan_controller.status

        except Exception as e:
            self.logger.error(f"Fehler bei der Lüftersteuerung: {e}")
            return False

    def cleanup(self):
        """Räumt alle Ressourcen auf"""
        self.logger.info("Räume Ressourcen auf...")

        try:
            if self.tcp_server:
                self.tcp_server.stop()
        except Exception as e:
            self.logger.error(f"Fehler beim Stoppen des TCP-Servers: {e}")

        try:
            if self.opcua_server:
                self.opcua_server.stop()
        except Exception as e:
            self.logger.error(f"Fehler beim Stoppen des OPC UA-Servers: {e}")

        try:
            if self.image_processor:
                self.image_processor.close()
        except Exception as e:
            self.logger.error(f"Fehler beim Schließen der Bildverarbeitung: {e}")

        try:
            if self.led_controller:
                self.led_controller.cleanup()
        except Exception as e:
            self.logger.error(f"Fehler beim Aufräumen der Ledsteuerung: {e}")

        try:
            if self.fan_controller:
                self.fan_controller.cleanup()
        except Exception as e:
            self.logger.error(f"Fehler beim Aufräumen der Lüftersteuerung: {e}")

        try:
            GPIO.cleanup()
        except Exception as e:
            self.logger.error(f"Fehler beim GPIO-Cleanup: {e}")

        self.logger.info("Alle Ressourcen wurden freigegeben.")


async def async_main():
    server = SensorServer()
    server.initialize_components()

    if not server.start_servers():
        server.logger.error("Kein Server konnte gestartet werden - beende Programm")
        return 1, server

    await server.run_main_loop()
    return 0, server


def main():
    server = None
    try:
        ret, server = asyncio.run(async_main())
        return ret
    except KeyboardInterrupt:
        if server:
            server.logger.info("Programm durch Benutzer beendet (STRG+C)")
    except Exception as e:
        if server:
            server.logger.critical(f"Kritischer Fehler: {e}", exc_info=True)
        else:
            print(f"Kritischer Fehler vor Logger-Initialisierung: {e}")
        return 1
    finally:
        if server:
            server.cleanup()

    return 0


if __name__ == "__main__":
    sys.exit(main())
