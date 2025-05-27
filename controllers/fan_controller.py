import logging
import RPi.GPIO as GPIO
from config import FAN_TEMPERATURE_THRESHOLD

class FanController:
    def __init__(self, pin, logger=None):
        self.pin = pin or 13
        self.status = False
        self.auto_mode = True
        self.logger = logger or logging.getLogger(__name__)
        self.pwm_fan = None

        try:
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(self.pin, GPIO.OUT)
            # PWM mit 100Hz starten
            self.pwm_fan = GPIO.PWM(self.pin, 100)
            self.pwm_fan.start(0)  # Fan aus (0% Duty Cycle)
            self.logger.info(f"Lüfter-Controller mit PWM initialisiert auf Pin {self.pin}")
        except Exception as e:
            self.logger.error(f"Fehler beim Initialisieren des Lüfter-Controllers: {e}")
            raise

    def set_fan(self, status, speed=100):
        """
        Schaltet Lüfter ein/aus.
        Wenn speed angegeben (0-100), wird PWM Duty Cycle gesetzt.
        """
        try:
            if status:
                duty = max(0, min(speed, 100))  # Speed auf 0-100 begrenzen
                self.pwm_fan.ChangeDutyCycle(duty)
                self.logger.info(f"Lüfter eingeschaltet mit Speed {duty}%")
                self.status = True
            else:
                self.pwm_fan.ChangeDutyCycle(0)
                self.logger.info("Lüfter ausgeschaltet")
                self.status = False
            return True
        except Exception as e:
            self.logger.error(f"Fehler beim Schalten des Lüfters: {e}")
            return False

    def auto_control(self, temperature):
        if not self.auto_mode or temperature is None:
            return self.status

        if temperature >= FAN_TEMPERATURE_THRESHOLD:
            # Geschwindigkeit von 0 bis 100% abhängig von Temperatur 30-40 Grad
            speed = min(100, max(0, (temperature - FAN_TEMPERATURE_THRESHOLD) * 10))
            return self.set_fan(True, speed=speed)
        else:
            return self.set_fan(False)

    def set_mode(self, auto_mode):
        self.auto_mode = auto_mode
        mode_text = "Automatik" if auto_mode else "Manuell"
        self.logger.info(f"Lüftersteuerung: {mode_text}-Modus aktiviert")

    def cleanup(self):
        try:
            self.set_fan(False)
            if self.pwm_fan:
                self.pwm_fan.stop()
            self.logger.info("Lüfter ausgeschaltet und PWM gestoppt (Cleanup)")
        except Exception as e:
            self.logger.warning(f"Fehler beim Lüfter-Cleanup: {e}")

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