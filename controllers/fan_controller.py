"""
Lüftersteuerung für GPIO-basierte Lüfter
"""

import logging
import RPi.GPIO as GPIO
from config import FAN_TEMPERATURE_THRESHOLD


class FanController:
    """
    Klasse zur Steuerung eines Lüfters über einen GPIO-Pin.
    """

    def __init__(self, pin, logger=None):
        self.pin = pin
        self.status = False
        self.auto_mode = True
        self.logger = logger or logging.getLogger(__name__)

        try:
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(self.pin, GPIO.OUT)
            GPIO.output(self.pin, GPIO.LOW)
            self.logger.info(f"Lüfter-Controller initialisiert auf Pin {pin}")
        except Exception as e:
            self.logger.error(f"Fehler beim Initialisieren des Lüfter-Controllers: {e}")
            raise

    def set_fan(self, status):
        """Schaltet den Lüfter ein oder aus."""
        try:
            if status:
                GPIO.output(self.pin, GPIO.HIGH)
                self.logger.info("Lüfter eingeschaltet")
            else:
                GPIO.output(self.pin, GPIO.LOW)
                self.logger.info("Lüfter ausgeschaltet")

            self.status = status
            return True
        except Exception as e:
            self.logger.error(f"Fehler beim Schalten des Lüfters: {e}")
            return False

    def auto_control(self, temperature):
        """
        Steuert den Lüfter basierend auf der Temperatur,
        wenn der automatische Modus aktiv ist.
        """
        if not self.auto_mode or temperature is None:
            return self.status

        if temperature >= FAN_TEMPERATURE_THRESHOLD and not self.status:
            self.logger.info(
                f"Automatische Lüftersteuerung: Temperatur {temperature}°C > {FAN_TEMPERATURE_THRESHOLD}°C"
            )
            return self.set_fan(True)
        elif temperature < FAN_TEMPERATURE_THRESHOLD and self.status:
            self.logger.info(
                f"Automatische Lüftersteuerung: Temperatur {temperature}°C < {FAN_TEMPERATURE_THRESHOLD}°C"
            )
            return self.set_fan(False)

        return self.status

    def set_mode(self, auto_mode):
        """Schaltet zwischen automatischem und manuellem Modus um."""
        self.auto_mode = auto_mode
        mode_text = "Automatik" if auto_mode else "Manuell"
        self.logger.info(f"Lüftersteuerung: {mode_text}-Modus aktiviert")

    def cleanup(self):
        """Schaltet den Lüfter aus und gibt den GPIO-Pin frei."""
        try:
            if self.status:
                GPIO.output(self.pin, GPIO.LOW)
                self.status = False
            self.logger.info("Lüfter ausgeschaltet (Cleanup)")
        except Exception as e:
            self.logger.warning(f"Fehler beim Ausschalten des Lüfters (Cleanup): {e}")


class DummyFanController:
    """
    Dummy-Implementation für Testzwecke ohne Hardware
    """

    def __init__(self, pin, logger=None):
        self.pin = pin
        self.status = False
        self.auto_mode = True
        self.logger = logger or logging.getLogger(__name__)
        self.logger.info(f"Dummy-Lüfter-Controller initialisiert für Pin {pin}")

    def set_fan(self, status):
        self.status = status
        status_text = "eingeschaltet" if status else "ausgeschaltet"
        self.logger.info(f"Dummy-Lüfter {status_text}")
        return True

    def auto_control(self, temperature):
        if not self.auto_mode or temperature is None:
            return self.status

        if temperature >= FAN_TEMPERATURE_THRESHOLD and not self.status:
            return self.set_fan(True)
        elif temperature < FAN_TEMPERATURE_THRESHOLD and self.status:
            return self.set_fan(False)

        return self.status

    def set_mode(self, auto_mode):
        self.auto_mode = auto_mode
        mode_text = "Automatik" if auto_mode else "Manuell"
        self.logger.info(f"Dummy-Lüftersteuerung: {mode_text}-Modus aktiviert")

    def cleanup(self):
        self.logger.info("Dummy-Lüfter Cleanup durchgeführt")