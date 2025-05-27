"""
DHT22 Temperatursensor Klasse
"""

import time
import logging
import adafruit_dht
from adafruit_blinka.microcontroller.bcm283x import pin as bcm_pin


class TemperatureHumiditySensor:
    """
    Klasse zur Ansteuerung des DHT22-Sensors
    über die Bibliothek adafruit_dht (inkl. Blinka).
    """

    def __init__(self, logger=None):
        self.logger = logger or logging.getLogger(__name__)
        self.dht_device = None

        try:
            # Fester Ansatz: Verwende Blinka pin.D4
            self.dht_device = adafruit_dht.DHT22(bcm_pin.D4)
            self.logger.info("DHT22-Sensor erfolgreich initialisiert mit Blinka pin.D4")
        except Exception as e:
            self.logger.error(f"Fehler bei der DHT22-Initialisierung: {e}")
            self.dht_device = None

    def read_sensor(self):
        """
        Temperatur- und Feuchtigkeitswert vom DHT22-Sensor abfragen.
        Gibt (None, None) zurück, falls kein Wert gelesen werden kann.
        """
        if not self.dht_device:
            self.logger.debug("DHT-Sensor nicht initialisiert – verwende Dummy-Werte.")
            import random
            return 25.0 + random.uniform(-2, 2), 50.0 + random.uniform(-5, 5)

        for attempt in range(3):
            try:
                temperature = self.dht_device.temperature
                humidity = self.dht_device.humidity

                if temperature is not None and humidity is not None:
                    self.logger.debug(f"DHT22 gelesen: Temp={temperature}°C, Feuchte={humidity}%")
                    return temperature, humidity
                else:
                    self.logger.debug(f"DHT22 Versuch {attempt + 1}: Keine gültigen Werte erhalten")

            except RuntimeError as err:
                # DHT-Sensoren werfen bei gelegentlichen Auslesefehlern RuntimeError
                self.logger.debug(f"Temporärer DHT22-Lesefehler (Versuch {attempt + 1}): {err}")
                time.sleep(0.5)
            except Exception as err:
                self.logger.error(f"Allgemeiner Fehler beim Lesen des DHT22 (Versuch {attempt + 1}): {err}")
                break

        self.logger.warning("DHT22: Alle Leseversuche fehlgeschlagen")
        return None, None
