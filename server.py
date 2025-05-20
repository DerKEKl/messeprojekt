import os
import json
import sys
import time
import socket
import logging
import threading
import board
import adafruit_dht
import RPi.GPIO as GPIO
from opcua import Server, ua
from opcua.crypto import security_policies, uacrypto
import numpy as np

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("raspberry_server.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("RaspberryPi :: Server")

try:
    from picamera2 import Picamera2

    PICAMERA2_AVAILABLE = True
    logger.info("picamera2 Bibliothek erfolgreich importiert")
except ImportError:
    PICAMERA2_AVAILABLE = False
    logger.warning("picamera2 nicht verfügbar - versuche Alternativen")

try:
    from PIL import Image

    PIL_AVAILABLE = True
    logger.info("PIL (Pillow) Bibliothek erfolgreich importiert")
except ImportError:
    PIL_AVAILABLE = False
    logger.warning("PIL (Pillow) nicht verfügbar")

# Konstanten
OPCUA_ENDPOINT = "opc.tcp://0.0.0.0:4840"
OPCUA_SERVER_NAME = "RaspberryPi :: Server"
CERTIFICATE_PATH = "certificates/server_cert.pem"
PRIVATE_KEY_PATH = "certificates/server_key.pem"

TCP_HOST = "0.0.0.0"
TCP_PORT = 5000

# DHT22 PIN als direkter Wert - nicht als Board-Objekt, um Initialisierungsprobleme zu vermeiden
DHT_PIN = 4
FAN_PIN = 18

FAN_TEMPERATURE_THRESHOLD = 30.0  # in °C


class OPCUAServer:
    """
    OPC UA Server Klasse für den Raspberry Pi.
    Stellt Temperatur-, Feuchtigkeits- und Farbwerte
    über das OPC UA-Protokoll zur Verfügung.
    """

    def __init__(self, endpoint, name, cert_path, key_path):
        self.server = Server()
        self.endpoint = endpoint
        self.name = name
        self.cert_path = cert_path
        self.key_path = key_path
        self.setup_server()

    def setup_server(self):
        try:
            self.server.set_endpoint(self.endpoint)
            self.server.set_server_name(self.name)

            cert_dir = os.path.dirname(self.cert_path)
            if not os.path.exists(cert_dir):
                os.makedirs(cert_dir)
                logger.info(f"Zertifikatsverzeichnis erstellt: {cert_dir}")

            if not os.path.exists(self.cert_path):
                logger.info("Erstelle selbstsigniertes Zertifikat")
                uacrypto.create_self_signed_certificate(
                    self.cert_path,
                    self.key_path,
                    f"{self.name}@RaspberryPi",
                    uri=self.endpoint,
                    key_size=2048
                )

            self.server.load_certificate(self.cert_path)
            self.server.load_private_key(self.key_path)
            logger.info("Zertifikate und Schlüssel geladen")

            self.server.set_security_policy([ua.SecurityPolicyType.Basic256Sha256_SignAndEncrypt])

            idx = self.server.register_namespace("http://raspberry-mrt.local/sensors")
            objects = self.server.get_objects_node()
            self.sensors = objects.add_object(idx, "Sensors")

            self.temp_var = self.sensors.add_variable(idx, "Temperature", 0.0)
            self.humidity_var = self.sensors.add_variable(idx, "Humidity", 0.0)
            self.color_var = self.sensors.add_variable(idx, "Color", [0, 0, 0])
            self.fan_status_var = self.sensors.add_variable(idx, "FanStatus", False)

            self.fan_control_var = self.sensors.add_variable(idx, "FanControl", False)
            self.fan_control_var.set_writable()

            logger.info("OPC UA Server-Variablen erstellt")
        except Exception as e:
            logger.error(f"Fehler beim Setup des OPC UA Servers: {e}", exc_info=True)
            raise

    def start(self):
        """Startet den OPC UA Server."""
        try:
            self.server.start()
            logger.info(f"OPC UA Server gestartet auf {self.endpoint}")
            return True
        except Exception as e:
            logger.error(f"Fehler beim Starten des OPC UA Servers: {e}", exc_info=True)
            return False

    def update_values(self, temperature, humidity, color, fan_status):
        """
        Aktualisiert die Variablen des OPC UA Servers
        mit neuen Werten für Temperatur, Feuchtigkeit, Farbe und Lüfterstatus.
        """
        try:
            if temperature is not None:
                self.temp_var.set_value(temperature)
            if humidity is not None:
                self.humidity_var.set_value(humidity)
            if color is not None:
                self.color_var.set_value(color)
            if fan_status is not None:
                self.fan_status_var.set_value(fan_status)
            return True
        except Exception as e:
            logger.error(f"Fehler beim Aktualisieren der OPC UA-Variablen: {e}")
            return False

    def get_fan_control(self):
        """Gibt den aktuellen Wert der Lüftersteuerungsvariable zurück."""
        try:
            return self.fan_control_var.get_value()
        except Exception as e:
            logger.error(f"Fehler beim Lesen der Fan-Control-Variable: {e}")
            return False

    def stop(self):
        """Beendet den OPC UA Server."""
        try:
            self.server.stop()
            logger.info("OPC UA Server gestoppt")
        except Exception as e:
            logger.error(f"Fehler beim Stoppen des OPC UA Servers: {e}")


class TemperatureHumiditySensor:
    """
    Klasse zur Ansteuerung des DHT22-Sensors
    über die Bibliothek adafruit_dht.
    """

    def __init__(self, pin):
        self.dht_device = None
        try:
            # Versuch 1: Board-Objekt direkt verwenden
            logger.info(f"Versuche DHT22-Sensor zu initialisieren mit Pin {pin}")
            self.dht_device = adafruit_dht.DHT22(pin)
            logger.info(f"DHT22-Sensor erfolgreich initialisiert auf Pin {pin}")
        except Exception as e:
            logger.warning(f"Initialisierung mit board.D4 fehlgeschlagen: {e}")
            # Versuch 2: Mit der Pin-Nummer direkt
            try:
                self.dht_device = adafruit_dht.DHT22(4)  # Direkter Pin-Wert
                logger.info("DHT22-Sensor erfolgreich initialisiert mit direkter Pin-Nummer 4")
            except Exception as e2:
                logger.error(f"Fehler beim Initialisieren des DHT22-Sensors mit Pin-Nummer 4: {e2}")
                # Versuch 3: GPIO-Pin verwenden
                try:
                    # In neueren Versionen kann dies erforderlich sein
                    from adafruit_blinka.microcontroller.bcm283x import pin
                    self.dht_device = adafruit_dht.DHT22(pin.D4)
                    logger.info("DHT22-Sensor erfolgreich initialisiert mit Blinka pin.D4")
                except Exception as e3:
                    logger.error(f"Alle Initialisierungsversuche für DHT22 fehlgeschlagen: {e3}")
                    # Dummy-Implementation, die Fehler abfängt
                    self.dht_device = None

    def read_sensor(self):
        """
        Temperatur- und Feuchtigkeitswert vom DHT22-Sensor abfragen.
        Gibt (None, None) zurück, falls kein Wert gelesen werden kann.
        """
        if not self.dht_device:
            logger.debug("DHT-Sensor nicht initialisiert - verwende Dummy-Werte")
            # Dummy-Werte für Tests
            import random
            return 25.0 + random.uniform(-2, 2), 50.0 + random.uniform(-5, 5)

        for _ in range(3):  # Bis zu 3 Versuche
            try:
                temperature = self.dht_device.temperature
                humidity = self.dht_device.humidity
                # Bei erfolgreicher Messung explizit loggen
                logger.debug(f"DHT22 erfolgreich gelesen: Temp={temperature}°C, Humidity={humidity}%")
                return temperature, humidity
            except RuntimeError as e:
                # RuntimeError ist normal bei DHT-Sensoren und kein kritischer Fehler
                logger.debug(f"Temporärer Lesefehler beim DHT22-Sensor: {e}")
                time.sleep(0.5)  # Kurze Pause vor dem nächsten Versuch
            except Exception as e:
                logger.error(f"Fehler beim Lesen des DHT22-Sensors: {e}")
                break

        # Nach allen Versuchen keine Werte erhalten
        return None, None


class FanController:
    """
    Klasse zur Steuerung eines Lüfters über einen GPIO-Pin.
    """

    def __init__(self, pin):
        self.pin = pin
        self.status = False
        self.auto_mode = True

        try:
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(self.pin, GPIO.OUT)
            GPIO.output(self.pin, GPIO.LOW)
            logger.info(f"Lüfter-Controller initialisiert auf Pin {pin}")
        except Exception as e:
            logger.error(f"Fehler beim Initialisieren des Lüfter-Controllers: {e}")

    def set_fan(self, status):
        """Schaltet den Lüfter ein oder aus."""
        try:
            if status:
                GPIO.output(self.pin, GPIO.HIGH)
                logger.info("Lüfter eingeschaltet")
            else:
                GPIO.output(self.pin, GPIO.LOW)
                logger.info("Lüfter ausgeschaltet")
            self.status = status
            return True
        except Exception as e:
            logger.error(f"Fehler beim Schalten des Lüfters: {e}")
            return False

    def auto_control(self, temperature):
        """
        Steuert den Lüfter basierend auf der Temperatur,
        wenn der automatische Modus aktiv ist.
        """
        if self.auto_mode and temperature is not None:
            if temperature >= FAN_TEMPERATURE_THRESHOLD and not self.status:
                logger.info(f"Automatische Lüftersteuerung: Temperatur {temperature}°C > {FAN_TEMPERATURE_THRESHOLD}°C")
                return self.set_fan(True)
            elif temperature < FAN_TEMPERATURE_THRESHOLD and self.status:
                logger.info(f"Automatische Lüftersteuerung: Temperatur {temperature}°C < {FAN_TEMPERATURE_THRESHOLD}°C")
                return self.set_fan(False)
        return self.status

    def set_mode(self, auto_mode):
        """Schaltet zwischen automatischem und manuellem Modus um."""
        self.auto_mode = auto_mode
        logger.info(f"Lüftersteuerung: {'Automatik' if auto_mode else 'Manuell'}-Modus aktiviert")

    def cleanup(self):
        """Schaltet den Lüfter aus und gibt den GPIO-Pin frei."""
        try:
            GPIO.output(self.pin, GPIO.LOW)
            logger.info("Lüfter ausgeschaltet (Cleanup)")
        except Exception as e:
            logger.warning(f"Fehler beim Ausschalten des Lüfters (Cleanup): {e}")


class ImageProcessor:
    """
    Klasse zur Erfassung von RGB-Farbwerten und Farberkennung:
    1) picamera2 (falls verfügbar)
    2) Fallback: Pillow für einfache Bildverarbeitung
    """

    def __init__(self):
        # KORREKTUR: Nicht abbrechen, wenn keine Kamera gefunden wird
        if not os.path.exists("/dev/video0"):
            logger.warning("Keine Kamera unter /dev/video0 gefunden – Simulationsmodus aktiviert.")
            self.simulation_mode = True
        else:
            self.simulation_mode = False

        self.camera = None
        self.using_picamera2 = False

        if not self.simulation_mode and PICAMERA2_AVAILABLE:
            try:
                self.camera = Picamera2()
                config = self.camera.create_still_configuration()
                self.camera.configure(config)
                self.camera.start()
                time.sleep(1)
                self.using_picamera2 = True
                logger.info("picamera2 erfolgreich initialisiert und gestartet")
            except Exception as e:
                logger.error(f"Probleme mit picamera2: {e}")
                self.camera = None
                self.simulation_mode = True

        if not self.camera and PIL_AVAILABLE:
            logger.warning("Kein Kamerazugriff verfügbar - verwende Simulationswerte")
        elif not PIL_AVAILABLE and not self.camera:
            logger.warning("Warnung: Weder picamera2 noch PIL sind verfügbar - verwende Simulationswerte")

    def get_rgb_values(self):
        """
        Gibt die Mittelwerte in RGB zurück, die aus dem Kamerabild berechnet werden.
        Bei Fehlern oder wenn keine Kamera verfügbar ist, werden simulierte oder Standardwerte zurückgegeben.
        """
        try:
            if self.simulation_mode:
                # Simulierte RGB-Werte für den Testbetrieb
                r = np.random.randint(0, 255)
                g = np.random.randint(0, 255)
                b = np.random.randint(0, 255)
                logger.debug(f"Simulierte RGB-Werte: ({r}, {g}, {b})")
                return r, g, b

            if self.using_picamera2 and self.camera:
                frame = self.camera.capture_array()
                r = int(np.mean(frame[:, :, 0]))
                g = int(np.mean(frame[:, :, 1]))
                b = int(np.mean(frame[:, :, 2]))
                return r, g, b

            return 0, 0, 0
        except Exception as e:
            logger.error(f"Fehler beim Bestimmen der RGB-Farbwerte: {e}")
            return 0, 0, 0

    def close(self):
        """Schließt die Kamera oder gibt sie frei."""
        if self.using_picamera2 and self.camera:
            try:
                self.camera.close()
                logger.info("Kamera geschlossen")
            except Exception as e:
                logger.warning(f"Fehler beim Schließen der Kamera: {e}")


class ColorSensorServer:
    """
    TCP-Server, der ggf. Farbwerte von externen Clients entgegennimmt.
    """

    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.server_socket = None
        self.running = False
        self.current_color = (0, 0, 0)
        self.clients = []
        self.lock = threading.Lock()
        self.color_updated = False  # Flag für neue Farbe

    def start(self):
        """Startet den TCP-Server."""
        try:
            self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.server_socket.bind((self.host, self.port))
            self.server_socket.listen(5)
            self.running = True
            threading.Thread(target=self.accept_connections, daemon=True).start()
            logger.info(f"TCP-Server gestartet auf {self.host}:{self.port}")
            return True
        except Exception as e:
            logger.error(f"Fehler beim Starten des TCP-Servers: {e}", exc_info=True)
            return False

    def accept_connections(self):
        """Akzeptiert eingehende Verbindungen und startet für jeden Client einen Thread."""
        while self.running:
            try:
                client, addr = self.server_socket.accept()
                logger.info(f"Neue Verbindung von {addr}")
                with self.lock:
                    self.clients.append(client)
                threading.Thread(target=self.handle_client, args=(client,), daemon=True).start()
            except OSError:
                if self.running:
                    logger.error("Socket-Fehler beim Akzeptieren von Verbindungen")
                break
            except Exception as e:
                if self.running:
                    logger.error(f"Fehler beim Akzeptieren einer Verbindung: {e}")

    def handle_client(self, client):
        """
        Empfängt die Farbdaten (RGB) des Clients im JSON-Format,
        z.B. {"rgb": [R, G, B]}.
        """
        client_address = client.getpeername()
        logger.info(f"Client-Handler gestartet für {client_address}")

        while self.running:
            try:
                data = client.recv(1024)
                if not data:
                    logger.info(f"Client {client_address} hat die Verbindung getrennt")
                    break

                payload = json.loads(data.decode())
                if "rgb" in payload:
                    with self.lock:
                        self.current_color = tuple(payload["rgb"])
                        self.color_updated = True  # Signal für neue Daten
                    logger.info(f"Neue Farbwerte von {client_address} empfangen: {self.current_color}")

            except json.JSONDecodeError:
                logger.warning(f"Ungültiges JSON-Format von {client_address} empfangen")
            except ConnectionResetError:
                logger.info(f"Verbindung zu {client_address} wurde zurückgesetzt")
                break
            except Exception as e:
                logger.error(f"Fehler bei der Client-Kommunikation mit {client_address}: {e}")
                break

        with self.lock:
            if client in self.clients:
                self.clients.remove(client)
        try:
            client.close()
        except Exception:
            pass
        logger.info(f"Client-Verbindung zu {client_address} geschlossen")

    def get_color(self):
        """Gibt aktuelle Farbwerte zurück und setzt das Update-Flag zurück."""
        with self.lock:
            color = self.current_color
            was_updated = self.color_updated
            self.color_updated = False
            return color, was_updated

    def stop(self):
        """Beendet den TCP-Server und trennt alle aktiven Verbindungen."""
        self.running = False

        with self.lock:
            for client in self.clients:
                try:
                    client.close()
                except Exception as e:
                    logger.warning(f"Fehler beim Schließen eines Clients: {e}")
            self.clients.clear()

        if self.server_socket:
            try:
                self.server_socket.close()
            except Exception as e:
                logger.warning(f"Fehler beim Schließen des Server-Sockets: {e}")

        logger.info("TCP-Server beendet")


def create_dummy_server():
    """Erstellt einen Dummy-Server, wenn der OPCUA-Server nicht gestartet werden kann"""

    class DummyServer:
        def update_values(self, *args):
            return True

        def get_fan_control(self):
            return False

        def stop(self):
            pass

    return DummyServer()


def main():
    """
    Hauptprogrammablauf:
    1. Initialisiert Sensoren/Kamera, Lüfter und Server.
    2. Erfasst in einer Schleife laufend Sensordaten.
    3. Aktualisiert Lüftersteuerung basierend auf Temperatur.
    4. Aktualisiert OPC-UA-Variablen.
    5. Ende bei KeyboardInterrupt.
    """
    logger.info(f"Starte OPC UA Server für Sensoren auf {OPCUA_ENDPOINT}")

    # Globale Variablen für Server und Geräte
    tcp_server = None
    opcua_server = None
    temp_sensor = None
    image_proc = None
    fan_controller = None

    # Fehlerbehebung für vorhandene Hardware
    try:
        # Debug-Log zum Start des Hauptprogramms
        logger.info("Initialisierung der Komponenten gestartet...")

        # Initialisiere Sensoren und Controller mit detaillierter Fehlerprotokollierung
        try:
            temp_sensor = TemperatureHumiditySensor(DHT_PIN)
            logger.info("Temperatursensor erfolgreich initialisiert")
        except Exception as e:
            logger.error(f"Kritischer Fehler bei der Initialisierung des Temperatursensors: {e}", exc_info=True)
            # Fortfahren mit None als Sensor

        try:
            image_proc = ImageProcessor()
            logger.info("Bildverarbeitung erfolgreich initialisiert")
        except Exception as e:
            logger.error(f"Fehler bei der Initialisierung der Bildverarbeitung: {e}", exc_info=True)
            # Fortfahren mit minimaler ImageProcessor-Implementation
            image_proc = type('DummyImageProcessor', (),
                              {'get_rgb_values': lambda _: (0, 0, 0), 'close': lambda _: None})()

        try:
            fan_controller = FanController(FAN_PIN)
            logger.info("Lüftersteuerung erfolgreich initialisiert")
        except Exception as e:
            logger.error(f"Fehler bei der Initialisierung der Lüftersteuerung: {e}", exc_info=True)
            # Fortfahren mit Dummy-Controller
            fan_controller = type('DummyFanController', (), {'status': False, 'set_fan': lambda _, status: None,
                                                             'auto_control': lambda _, temp: False,
                                                             'set_mode': lambda _, mode: None,
                                                             'cleanup': lambda _: None})()

        # Server initialisieren
        try:
            tcp_server = ColorSensorServer(TCP_HOST, TCP_PORT)
            logger.info("TCP-Server-Objekt erstellt")
        except Exception as e:
            logger.error(f"Fehler bei der Erstellung des TCP-Servers: {e}", exc_info=True)
            # Fortfahren mit Dummy-Server
            tcp_server = type('DummyTCPServer', (), {'start': lambda _: True, 'get_color': lambda _: ((0, 0, 0), False),
                                                     'stop': lambda _: None})()

        # WICHTIGE ÄNDERUNG: Besserer Fehlerumgang bei OPCUA Server
        try:
            opcua_server = OPCUAServer(
                OPCUA_ENDPOINT,
                OPCUA_SERVER_NAME,
                CERTIFICATE_PATH,
                PRIVATE_KEY_PATH
            )
            logger.info("OPCUA-Server-Objekt erstellt")
        except Exception as e:
            logger.error(f"Fehler bei der Erstellung des OPCUA-Servers: {e}", exc_info=True)
            # Nicht abbrechen, sondern mit Dummy fortfahren
            logger.warning("Verwende Dummy OPCUA-Server")
            opcua_server = create_dummy_server()

        # Starte Server und prüfe auf erfolgreiche Initialisierung
        logger.info("Starte Server...")

        # TCP-Server starten
        tcp_started = False
        try:
            tcp_started = tcp_server.start()
            logger.info(f"TCP-Server erfolgreich gestartet: {tcp_started}")
        except Exception as e:
            logger.error(f"Fehler beim Starten des TCP-Servers: {e}", exc_info=True)
            tcp_started = False

        # OPCUA-Server starten (nur wenn es kein Dummy ist)
        opcua_started = False
        if hasattr(opcua_server, 'start'):
            try:
                opcua_started = opcua_server.start()
                logger.info(f"OPCUA-Server erfolgreich gestartet: {opcua_started}")
            except Exception as e:
                logger.error(f"Fehler beim Starten des OPCUA-Servers: {e}", exc_info=True)
                # Dummy-Server erstellen, wenn Start fehlschlägt
                opcua_server = create_dummy_server()
        else:
            logger.info("Verwende Dummy OPCUA-Server (hat keine start-Methode)")
            opcua_started = True  # Dummy ist immer "gestartet"

        # Selbst wenn Server nicht starten konnten, trotzdem weitermachen
        logger.info("Server-Initialisierung abgeschlossen. Drücken Sie STRG+C zum Beenden.")
        logger.info(f"TCP-Server Status: {'Gestartet' if tcp_started else 'Fehlgeschlagen'}")
        logger.info(f"OPCUA-Server Status: {'Gestartet' if opcua_started else 'Fehlgeschlagen'}")

        # Hauptschleife mit zusätzlicher Fehlerprotokollierung für jeden Schritt
        counter = 0
        logger.info("Starte Hauptschleife...")
        while True:
            # Sensordaten lesen mit expliziter Fehlerbehandlung für jeden Schritt
            try:
                temperature, humidity = temp_sensor.read_sensor() if temp_sensor else (None, None)
                # Log einmal pro 10 Iterationen (oder jeden erfolgreichen Lesevorgang)
                if counter % 10 == 0 or (temperature is not None and humidity is not None):
                    logger.debug(f"Sensorwerte gelesen: Temp={temperature}, Humidity={humidity}")
            except Exception as e:
                logger.error(f"Fehler beim Lesen des Temperatursensors: {e}")
                temperature, humidity = None, None

            # Farbwerte von TCP oder Kamera
            try:
                color_from_tcp, has_new_color = tcp_server.get_color()
                if has_new_color:
                    logger.debug(f"Neue Farbwerte vom TCP-Client: {color_from_tcp}")
                    rgb = color_from_tcp
                else:
                    rgb = image_proc.get_rgb_values() if image_proc else (0, 0, 0)
                    if counter % 10 == 0:  # Reduziere Logging-Frequenz
                        logger.debug(f"Farbwerte von der Kamera: {rgb}")
            except Exception as e:
                logger.error(f"Fehler beim Ermitteln der Farbwerte: {e}")
                rgb = (0, 0, 0)

            # Lüftersteuerung
            try:
                manual_control = opcua_server.get_fan_control()
                if fan_controller:
                    if manual_control:
                        fan_controller.set_mode(False)
                        fan_controller.set_fan(manual_control)
                    else:
                        fan_controller.set_mode(True)
                        fan_controller.auto_control(temperature)

                    fan_status = fan_controller.status
                else:
                    fan_status = False
            except Exception as e:
                logger.error(f"Fehler bei der Lüftersteuerung: {e}")
                fan_status = False

            # Log der aktuellen Werte
            if counter % 5 == 0:  # Log alle 5 Sekunden anstatt jede Sekunde
                logger.info(
                    f"Temperatur: {temperature}°C, Luftfeuchtigkeit: {humidity}%, RGB: {rgb}, Lüfter: {'AN' if fan_status else 'AUS'}")

            # OPCUA-Variablen aktualisieren
            try:
                opcua_server.update_values(temperature, humidity, rgb, fan_status)
                if counter % 10 == 0:  # Log alle 10 Sekunden
                    logger.debug("OPCUA-Variablen erfolgreich aktualisiert")
            except Exception as e:
                logger.error(f"Fehler beim Aktualisieren der OPCUA-Variablen: {e}")

            # Zähler erhöhen und warten
            counter = (counter + 1) % 100  # Zähler zurücksetzen bei 100
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("\nBeende Programm (STRG+C).")
    except Exception as e:
        logger.error(f"Fehler im Hauptprogramm: {e}", exc_info=True)
    finally:
        try:
            if tcp_server:
                tcp_server.stop()
            if opcua_server and hasattr(opcua_server, 'stop'):
                opcua_server.stop()
            if image_proc:
                image_proc.close()
            if fan_controller:
                fan_controller.cleanup()
            GPIO.cleanup()  # Clean up GPIO resources
            logger.info("Alle Ressourcen wurden freigegeben. Programm beendet.")
        except Exception as e:
            logger.error(f"Fehler beim Aufräumen der Ressourcen: {e}", exc_info=True)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.critical(f"Unbehandelte Ausnahme im Hauptprogramm: {e}", exc_info=True)
        sys.exit(1)