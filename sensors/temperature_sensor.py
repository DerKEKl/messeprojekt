"""
DHT22 Temperatursensor Klasse
"""

import time
import logging
import adafruit_dht
import board
import RPi.GPIO as GPIO  # Tippfehler von GIOP korrigiert


class TemperatureHumiditySensor:
    """
    Klasse zur Ansteuerung des DHT22-Sensors
    über die Bibliothek adafruit_dht (inkl. Blinka).
    """

    def __init__(self, use_dummy=False, logger=None):
        """
        :param use_dummy: Wenn True, werden Dummy-Werte zurückgegeben (z.B. für Tests ohne Hardware).
        :param logger: Optionaler Logger.
        """
        self.logger = logger or logging.getLogger(__name__)
        self.use_dummy = use_dummy
        self.dht_device = None

        if self.use_dummy:
            self.logger.info("Dummy-Modus aktiviert: Sensorwerte werden simuliert.")
            return

        try:
            # Verwende Board-Pin D4 (GPIO4)
            self.dht_device = adafruit_dht.DHT22(board.D4, use_pulseio=False)
            self.logger.info("DHT22-Sensor erfolgreich initialisiert an board.D4")
        except Exception as e:
            self.logger.error(f"Fehler bei der DHT22-Initialisierung: {e}")
            self.dht_device = None

    def read_sensor(self, max_attempts=5, delay=1.0):
        """
        Temperatur- und Feuchtigkeitswert vom DHT22-Sensor abfragen.
        Gibt (None, None) zurück, falls kein Wert gelesen werden kann.
        :param max_attempts: Anzahl der Leseversuche.
        :param delay: Pause zwischen Versuchen (Sekunden).
        """
        if self.use_dummy or not self.dht_device:
            self.logger.debug("Dummy-Werte werden generiert.")
            import random
            return 25.0 + random.uniform(-2, 2), 50.0 + random.uniform(-5, 5)

        for attempt in range(1, max_attempts + 1):
            try:
                temperature = self.dht_device.temperature
                humidity = self.dht_device.humidity

                if temperature is not None and humidity is not None:
                    self.logger.debug(f"DHT22 gelesen: Temp={temperature:.2f}°C, Feuchte={humidity:.2f}%")
                    return temperature, humidity
                else:
                    self.logger.debug(f"DHT22 Versuch {attempt}: Keine gültigen Werte erhalten.")

            except RuntimeError as err:
                self.logger.debug(f"Temporärer DHT22-Lesefehler (Versuch {attempt}): {err}")
                time.sleep(delay)
            except Exception as err:
                self.logger.error(f"Allgemeiner Fehler beim Lesen des DHT22 (Versuch {attempt}): {err}")
                break

        self.logger.warning("DHT22: Alle Leseversuche fehlgeschlagen.")
        return None, None

    def cleanup(self):
        """
        Ressourcencleanup für den Sensor und GPIO.
        """
        self.logger.info("Cleanup: DHT22 und GPIO werden freigegeben.")
        if self.dht_device:
            try:
                self.dht_device.exit()
                self.logger.info("DHT22-Sensor erfolgreich beendet.")
            except Exception as e:
                self.logger.error(f"Fehler beim Beenden des DHT22-Sensors: {e}")

        try:
            GPIO.cleanup()
            self.logger.info("GPIO erfolgreich freigegeben.")
        except Exception as e:
            self.logger.error(f"Fehler beim GPIO-Cleanup: {e}")
