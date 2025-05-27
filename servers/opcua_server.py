"""
OPC UA Server für Sensor- und Steuerungsdaten
"""

import os
import logging
from opcua import Server, ua
from opcua.crypto import security_policies, uacrypto


class OPCUAServer:
    """
    OPC UA Server Klasse für den Raspberry Pi.
    Stellt Temperatur-, Feuchtigkeits- und Farbwerte
    über das OPC UA-Protokoll zur Verfügung.
    """

    def __init__(self, endpoint, name, cert_path, key_path, logger=None):
        self.server = Server()
        self.endpoint = endpoint
        self.name = name
        self.cert_path = cert_path
        self.key_path = key_path
        self.logger = logger or logging.getLogger(__name__)

        # Variablen-Referenzen
        self.temp_var = None
        self.humidity_var = None
        self.color_var = None
        self.fan_status_var = None
        self.fan_control_var = None

        self._setup_server()

    def _setup_server(self):
        """Konfiguriert den OPC UA Server"""
        try:
            self.server.set_endpoint(self.endpoint)
            self.server.set_server_name(self.name)

            self._setup_certificates()
            self._setup_security()
            self._create_variables()

            self.logger.info("OPC UA Server erfolgreich konfiguriert")
        except Exception as e:
            self.logger.error(f"Fehler beim Setup des OPC UA Servers: {e}", exc_info=True)
            raise

    def _setup_certificates(self):
        """Erstellt oder lädt Zertifikate"""
        cert_dir = os.path.dirname(self.cert_path)
        if not os.path.exists(cert_dir):
            os.makedirs(cert_dir)
            self.logger.info(f"Zertifikatsverzeichnis erstellt: {cert_dir}")

        if not os.path.exists(self.cert_path):
            self.logger.info("Erstelle selbstsigniertes Zertifikat")
            uacrypto.create_self_signed_certificate(
                self.cert_path,
                self.key_path,
                f"{self.name}@RaspberryPi",
                uri=self.endpoint,
                key_size=2048
            )

        self.server.load_certificate(self.cert_path)
        self.server.load_private_key(self.key_path)
        self.logger.info("Zertifikate und Schlüssel geladen")

    def _setup_security(self):
        """Konfiguriert Sicherheitsrichtlinien"""
        self.server.set_security_policy([ua.SecurityPolicyType.Basic256Sha256_SignAndEncrypt])
        self.logger.info("Sicherheitsrichtlinien konfiguriert")

    def _create_variables(self):
        """Erstellt die OPC UA Variablen"""
        idx = self.server.register_namespace("http://raspberry-mrt.local/sensors")
        objects = self.server.get_objects_node()
        self.sensors = objects.add_object(idx, "Sensors")

        # Sensor-Variablen
        self.temp_var = self.sensors.add_variable(idx, "Temperature", 0.0)
        self.humidity_var = self.sensors.add_variable(idx, "Humidity", 0.0)
        self.color_var = self.sensors.add_variable(idx, "Color", [0, 0, 0])
        self.fan_status_var = self.sensors.add_variable(idx, "FanStatus", False)

        # Steuerungs-Variable (schreibbar)
        self.fan_control_var = self.sensors.add_variable(idx, "FanControl", False)
        self.fan_control_var.set_writable()

        self.logger.info("OPC UA Server-Variablen erstellt")

    def start(self):
        """Startet den OPC UA Server."""
        try:
            self.server.start()
            self.logger.info(f"OPC UA Server gestartet auf {self.endpoint}")
            return True
        except Exception as e:
            self.logger.error(f"Fehler beim Starten des OPC UA Servers: {e}", exc_info=True)
            return False

    def update_values(self, temperature, humidity, color, fan_status):
        """
        Aktualisiert die Variablen des OPC UA Servers
        mit neuen Werten für Temperatur, Feuchtigkeit, Farbe und Lüfterstatus.
        """
        try:
            updates_made = []

            if temperature is not None and self.temp_var:
                self.temp_var.set_value(float(temperature))
                updates_made.append(f"Temp: {temperature}")

            if humidity is not None and self.humidity_var:
                self.humidity_var.set_value(float(humidity))
                updates_made.append(f"Humidity: {humidity}")

            if color is not None and self.color_var:
                self.color_var.set_value(list(color))
                updates_made.append(f"Color: {color}")

            if fan_status is not None and self.fan_status_var:
                self.fan_status_var.set_value(bool(fan_status))
                updates_made.append(f"Fan: {fan_status}")

            if updates_made:
                self.logger.debug(f"OPC UA Updates: {', '.join(updates_made)}")

            return True
        except Exception as e:
            self.logger.error(f"Fehler beim Aktualisieren der OPC UA-Variablen: {e}")
            return False

    def get_fan_control(self):
        """Gibt den aktuellen Wert der Lüftersteuerungsvariable zurück."""
        try:
            if self.fan_control_var:
                return self.fan_control_var.get_value()
            return False
        except Exception as e:
            self.logger.error(f"Fehler beim Lesen der Fan-Control-Variable: {e}")
            return False

    def stop(self):
        """Beendet den OPC UA Server."""
        try:
            self.server.stop()
            self.logger.info("OPC UA Server gestoppt")
        except Exception as e:
            self.logger.error(f"Fehler beim Stoppen des OPC UA Servers: {e}")


class DummyOPCUAServer:
    """
    Dummy-Implementation für Testzwecke ohne OPC UA
    """

    def __init__(self, endpoint, name, cert_path, key_path, logger=None):
        self.endpoint = endpoint
        self.name = name
        self.logger = logger or logging.getLogger(__name__)
        self.fan_control_value = False

    def start(self):
        self.logger.info(f"Dummy-OPC UA Server gestartet für {self.endpoint}")
        return True

    def update_values(self, temperature, humidity, color, fan_status):
        self.logger.debug(f"Dummy-OPC UA Update: T={temperature}, H={humidity}, C={color}, F={fan_status}")
        return True

    def get_fan_control(self):
        return self.fan_control_value

    def stop(self):
        self.logger.info("Dummy-OPC UA Server gestoppt")