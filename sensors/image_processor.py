"""
Bildverarbeitung und Kamera-Interface
"""

import os
import time
import logging
import numpy as np

# Optional imports mit Fallback
try:
    from picamera2 import Picamera2

    PICAMERA2_AVAILABLE = True
except ImportError:
    PICAMERA2_AVAILABLE = False

try:
    from PIL import Image

    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


class ImageProcessor:
    """
    Klasse zur Erfassung von RGB-Farbwerten und Farberkennung:
    1) picamera2 (falls verfügbar)
    2) Fallback: Simulationsmodus
    """

    def __init__(self, logger=None):
        self.logger = logger or logging.getLogger(__name__)
        self.camera = None
        self.using_picamera2 = False
        self.simulation_mode = False

        self._check_camera_availability()
        self._initialize_camera()

    def _check_camera_availability(self):
        """Prüft, ob eine Kamera verfügbar ist"""
        if not os.path.exists("/dev/video0"):
            self.logger.warning("Keine Kamera unter /dev/video0 gefunden – Simulationsmodus aktiviert.")
            self.simulation_mode = True
            return

        if not PICAMERA2_AVAILABLE:
            self.logger.warning("picamera2 nicht verfügbar")
            self.simulation_mode = True

    def _initialize_camera(self):
        """Initialisiert die Kamera falls verfügbar"""
        if self.simulation_mode:
            self.logger.info("Bildverarbeitung im Simulationsmodus gestartet")
            return

        if PICAMERA2_AVAILABLE:
            try:
                self.camera = Picamera2()
                config = self.camera.create_still_configuration()
                self.camera.configure(config)
                self.camera.start()
                time.sleep(1)  # Kamera stabilisieren lassen
                self.using_picamera2 = True
                self.logger.info("picamera2 erfolgreich initialisiert und gestartet")
            except Exception as e:
                self.logger.error(f"Probleme mit picamera2: {e}")
                self.camera = None
                self.simulation_mode = True
                self.logger.warning("Fallback auf Simulationsmodus")

    def get_rgb_values(self):
        """
        Gibt die Mittelwerte in RGB zurück, die aus dem Kamerabild berechnet werden.
        Bei Fehlern oder wenn keine Kamera verfügbar ist, werden simulierte Werte zurückgegeben.
        """
        try:
            if self.simulation_mode:
                return self._get_simulated_rgb()

            if self.using_picamera2 and self.camera:
                return self._get_camera_rgb()

            # Fallback
            return 0, 0, 0

        except Exception as e:
            self.logger.error(f"Fehler beim Bestimmen der RGB-Farbwerte: {e}")
            return 0, 0, 0

    def _get_simulated_rgb(self):
        """Generiert simulierte RGB-Werte für Testzwecke"""
        r = np.random.randint(0, 255)
        g = np.random.randint(0, 255)
        b = np.random.randint(0, 255)
        self.logger.debug(f"Simulierte RGB-Werte: ({r}, {g}, {b})")
        return r, g, b

    def _get_camera_rgb(self):
        """Extrahiert RGB-Mittelwerte aus dem Kamerabild"""
        try:
            frame = self.camera.capture_array()
            r = int(np.mean(frame[:, :, 0]))
            g = int(np.mean(frame[:, :, 1]))
            b = int(np.mean(frame[:, :, 2]))
            self.logger.debug(f"Kamera RGB-Werte: ({r}, {g}, {b})")
            return r, g, b
        except Exception as e:
            self.logger.error(f"Fehler beim Lesen der Kamera: {e}")
            raise

    def close(self):
        """Schließt die Kamera oder gibt sie frei."""
        if self.using_picamera2 and self.camera:
            try:
                self.camera.close()
                self.logger.info("Kamera geschlossen")
            except Exception as e:
                self.logger.warning(f"Fehler beim Schließen der Kamera: {e}")


class DummyImageProcessor:
    """
    Dummy-Implementation für Testzwecke ohne Hardware
    """

    def __init__(self, logger=None):
        self.logger = logger or logging.getLogger(__name__)
        self.logger.info("Dummy-Bildverarbeitung initialisiert")

    def get_rgb_values(self):
        """Gibt konstante RGB-Werte zurück"""
        return 0, 0, 0

    def close(self):
        """Dummy-Methode"""
        self.logger.info("Dummy-Bildverarbeitung geschlossen")