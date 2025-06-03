"""
Konfigurationsdatei für den Raspberry Pi Sensor Server
"""

# OPC UA Server Konfiguration
OPCUA_ENDPOINT = "opc.tcp://0.0.0.0:4840"
OPCUA_SERVER_NAME = "RaspberryPi :: Server"
CERTIFICATE_PATH = "certificates/server_cert.pem"
PRIVATE_KEY_PATH = "certificates/server_key.pem"
TRUSTED_CERTS = " servers/pki/trusted/certs"
REJECTED_CERTS = "servers/pki/rejected/certs"
ISSUED_CERTS = "servers/pki/issued/certs"

# TCP Server Konfiguration
TCP_HOST = "0.0.0.0"
TCP_PORT = 5000

# GPIO Pin Konfiguration
DHT_PIN = 4
FAN_PIN = 13
LED_PIN = 23

# Sensor Konfiguration
FAN_TEMPERATURE_THRESHOLD = 25.0  # in °C
MIN_DIFF = 0.5

# Logging Konfiguration
LOG_DIR = "logs"
LOG_FILE = "latest.log"
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
LOG_LEVEL = "INFO"

# Hauptschleife Konfiguration
SENSOR_READ_INTERVAL = 1  # Sekunden
