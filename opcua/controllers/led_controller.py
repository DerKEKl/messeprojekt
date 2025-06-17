import asyncio
import logging

import RPi.GPIO as GPIO


class LEDController:
    def __init__(self, pin, logger=None):
        self.led_pin = pin
        self.logger = logger or logging.getLogger(__name__)

        try:
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(self.led_pin, GPIO.OUT)
            GPIO.output(self.led_pin, GPIO.LOW)
            self.logger.info(f"LED Controller auf Pin {self.led_pin} initialisiert")
        except Exception as e:
            self.logger.error(f"Fehler bei der Initialisierung der LED: {e}")
            raise

    async def blink_led(self, duration=1):
        """Blinkt die LED `times` mal mit Pause `duration` Sekunden."""
        try:
            self.on()
            await asyncio.sleep(duration)
            self.off()
            self.logger.info(" ")
        except Exception as e:
            self.logger.error(f"Fehler beim Blinken der LED: {e}")

    def on(self):
        try:
            GPIO.output(self.led_pin, GPIO.HIGH)
        except Exception as e:
            self.logger.error(f"Fehler beim Einschalten der LED: {e}")

    def off(self):
        try:
            GPIO.output(self.led_pin, GPIO.LOW)
        except Exception as e:
            self.logger.error(f"Fehler beim Ausschalten der LED: {e}")

    def cleanup(self):
        try:
            GPIO.output(self.led_pin, GPIO.LOW)
            GPIO.cleanup(self.led_pin)
            self.logger.info("LED Controller Ressourcen freigegeben")
        except Exception as e:
            self.logger.warning(f"Fehler beim Cleanup der LED: {e}")
