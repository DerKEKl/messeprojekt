import os
import json
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

OPCUA_ENDPOINT = "opc.tcp://0.0.0.0:4840"
OPCUA_SERVER_NAME = "RaspberryPiServer"
CERTIFICATE_PATH = "certificates/server_cert.pem"
PRIVATE_KEY_PATH = "certificates/server_key.pem"

TCP_HOST = "0.0.0.0"
TCP_PORT = 5000

DHT_PIN = 4
FAN_PIN = 18

COLOR_THRESHOLDS = {
    "red1": {"lower": np.array([0, 120, 70]), "upper": np.array([10, 255, 255])},
    "red2": {"lower": np.array([170, 120, 70]), "upper": np.array([180, 255, 255])},
    "yellow": {"lower": np.array([20, 100, 100]), "upper": np.array([30, 255, 255])},
    "green": {"lower": np.array([40, 70, 70]), "upper": np.array([80, 255, 255])},
    "blue": {"lower": np.array([100, 150, 20]), "upper": np.array([140, 255, 255])}
}

FAN_TEMPERATURE_THRESHOLD = 27.0  # in °C


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

        idx = self.server.register_namespace("http://example.org/sensors")
        objects = self.server.get_objects_node()
        self.sensors = objects.add_object(idx, "Sensors")

        self.temp_var = self.sensors.add_variable(idx, "Temperature", 0.0)
        self.humidity_var = self.sensors.add_variable(idx, "Humidity", 0.0)
        self.color_var = self.sensors.add_variable(idx, "Color", [0, 0, 0])
        self.color_name_var = self.sensors.add_variable(idx, "ColorName", "none")
        self.fan_status_var = self.sensors.add_variable(idx, "FanStatus", False)

        self.fan_control_var = self.sensors.add_variable(idx, "FanControl", False)
        self.fan_control_var.set_writable()

        logger.info("OPC UA Server-Variablen erstellt")

    def start(self):
        """Startet den OPC UA Server."""
        self.server.start()
        logger.info(f"OPC UA Server gestartet auf {self.endpoint}")

    def update_values(self, temperature, humidity, color, color_name, fan_status):
        """
        Aktualisiert die Variablen des OPC UA Servers
        mit neuen Werten für Temperatur, Feuchtigkeit, Farbe und Lüfterstatus.
        """
        if temperature is not None:
            self.temp_var.set_value(temperature)
        if humidity is not None:
            self.humidity_var.set_value(humidity)
        if color is not None:
            self.color_var.set_value(color)
        if color_name is not None:
            self.color_name_var.set_value(color_name)
        if fan_status is not None:
            self.fan_status_var.set_value(fan_status)

    def get_fan_control(self):
        """Gibt den aktuellen Wert der Lüftersteuerungsvariable zurück."""
        return self.fan_control_var.get_value()

    def stop(self):
        """Beendet den OPC UA Server."""
        self.server.stop()
        logger.info("OPC UA Server gestoppt")


class TemperatureHumiditySensor:
    """
    Klasse zur Ansteuerung des DHT22-Sensors
    über die Bibliothek adafruit_dht.
    """

    def __init__(self, pin):
        self.dht_device = None
        try:
            self.dht_device = adafruit_dht.DHT22(getattr(board, f"D{pin}"))
            logger.info(f"DHT22-Sensor initialisiert auf Pin D{pin}")
        except Exception as e:
            logger.error(f"Fehler beim Initialisieren des DHT22-Sensors: {e}")

    def read_sensor(self):
        """
        Temperatur- und Feuchtigkeitswert vom DHT22-Sensor abfragen.
        Gibt (None, None) zurück, falls kein Wert gelesen werden kann.
        """
        if self.dht_device:
            try:
                temperature = self.dht_device.temperature
                humidity = self.dht_device.humidity
                return temperature, humidity
            except RuntimeError as e:
                logger.debug(f"Lesefehler beim DHT22-Sensor: {e}")
            except Exception as e:
                logger.error(f"Fehler beim Lesen des DHT22-Sensors: {e}")
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
        self.camera = None
        self.using_picamera2 = False

        if PICAMERA2_AVAILABLE:
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

        if not self.camera and PIL_AVAILABLE:
            logger.warning("Kein Kamerazugriff verfügbar, RGB-Werte werden simuliert")
        elif not PIL_AVAILABLE and not self.camera:
            logger.warning("Warnung: Weder picamera2 noch PIL sind verfügbar")

    def get_rgb_values(self):
        """
        Gibt die Mittelwerte in RGB zurück, die aus dem Kamerabild berechnet werden.
        Bei Fehlern oder wenn keine Kamera verfügbar ist, werden simulierte oder Standardwerte zurückgegeben.
        """
        try:
            if self.using_picamera2 and self.camera:
                frame = self.camera.capture_array()
                r = int(np.mean(frame[:, :, 0]))
                g = int(np.mean(frame[:, :, 1]))
                b = int(np.mean(frame[:, :, 2]))
                return r, g, b
            else:
                r = int(127 + 50 * np.sin(time.time() * 0.1))
                g = int(127 + 50 * np.sin(time.time() * 0.2))
                b = int(127 + 50 * np.sin(time.time() * 0.3))
                return r, g, b
        except Exception as e:
            logger.error(f"Fehler beim Bestimmen der RGB-Farbwerte: {e}")
            return 0, 0, 0

    def identify_color(self):
        """
        Identifiziert die dominante Farbe im Kamerabild.
        Verwendet die HSV-Farbdarstellung für robustere Farberkennung.
        """
        try:
            if self.using_picamera2 and self.camera:
                frame = self.camera.capture_array()

                r, g, b = frame[:, :, 0] / 255.0, frame[:, :, 1] / 255.0, frame[:, :, 2] / 255.0

                max_val = np.maximum(np.maximum(r, g), b)
                min_val = np.minimum(np.minimum(r, g), b)
                diff = max_val - min_val

                h = np.zeros_like(r)
                h[max_val == r] = (60 * ((g - b) / (diff + 1e-10)))[max_val == r] % 360
                h[max_val == g] = (60 * ((b - r) / (diff + 1e-10)) + 120)[max_val == g]
                h[max_val == b] = (60 * ((r - g) / (diff + 1e-10)) + 240)[max_val == b]
                h[diff == 0] = 0

                s = np.zeros_like(r)
                s[max_val != 0] = (diff / (max_val + 1e-10))[max_val != 0]

                v = max_val

                hsv_h = (h / 2).astype(np.uint8)  # Umwandlung von [0, 360] zu [0, 180]
                hsv_s = (s * 255).astype(np.uint8)
                hsv_v = (v * 255).astype(np.uint8)

                hsv = np.stack([hsv_h, hsv_s, hsv_v], axis=-1)

                color_counts = {
                    "red": 0,
                    "yellow": 0,
                    "green": 0,
                    "blue": 0
                }

                mask_red1 = np.all((hsv >= COLOR_THRESHOLDS["red1"]["lower"]) &
                                   (hsv <= COLOR_THRESHOLDS["red1"]["upper"]), axis=2)
                mask_red2 = np.all((hsv >= COLOR_THRESHOLDS["red2"]["lower"]) &
                                   (hsv <= COLOR_THRESHOLDS["red2"]["upper"]), axis=2)
                mask_red = mask_red1 | mask_red2
                color_counts["red"] = np.count_nonzero(mask_red)

                mask_yellow = np.all((hsv >= COLOR_THRESHOLDS["yellow"]["lower"]) &
                                     (hsv <= COLOR_THRESHOLDS["yellow"]["upper"]), axis=2)
                color_counts["yellow"] = np.count_nonzero(mask_yellow)

                mask_green = np.all((hsv >= COLOR_THRESHOLDS["green"]["lower"]) &
                                    (hsv <= COLOR_THRESHOLDS["green"]["upper"]), axis=2)
                color_counts["green"] = np.count_nonzero(mask_green)

                mask_blue = np.all((hsv >= COLOR_THRESHOLDS["blue"]["lower"]) &
                                   (hsv <= COLOR_THRESHOLDS["blue"]["upper"]), axis=2)
                color_counts["blue"] = np.count_nonzero(mask_blue)

                threshold = 200
                max_color = max(color_counts, key=color_counts.get)

                if color_counts[max_color] > threshold:
                    logger.info(f"Farbe erkannt: {max_color} (Pixelanzahl: {color_counts[max_color]})")
                    return max_color
                else:
                    logger.info("Keine dominante Farbe erkannt")
                    return "none"
            else:
                current_time = time.time()
                colors = ["red", "yellow", "green", "blue", "none"]
                color_idx = int((current_time / 10) % len(colors))
                logger.info(f"Simulierte Farberkennung: {colors[color_idx]}")
                return colors[color_idx]

        except Exception as e:
            logger.error(f"Fehler bei der Farberkennung: {e}")
            return "none"

    def close(self):
        """Schließt die Kamera oder gibt sie frei."""
        if self.using_picamera2 and self.camera:
            self.camera.close()
            logger.info("Kamera geschlossen")


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
        self.current_color_name = "none"
        self.clients = []
        self.lock = threading.Lock()

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
        except Exception as e:
            logger.error(f"Fehler beim Starten des TCP-Servers: {e}")

    def accept_connections(self):
        """Akzeptiert eingehende Verbindungen und startet pro Client einen Thread."""
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
        Empfängt Daten eines Clients und aktualisiert self.current_color.
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
                    self.current_color = tuple(payload["rgb"])
                    logger.info(f"Neue Farbwerte von {client_address} empfangen: {self.current_color}")

                if "color_name" in payload:
                    self.current_color_name = payload["color_name"]
                    logger.info(f"Neuer Farbname von {client_address} empfangen: {self.current_color_name}")
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
        client.close()
        logger.info(f"Client-Verbindung zu {client_address} geschlossen")

    def stop(self):
        """Beendet den TCP-Server."""
        self.running = False

        # Clients schließen
        with self.lock:
            for client in self.clients:
                try:
                    client.close()
                except Exception as e:
                    logger.warning(f"Fehler beim Schließen eines Clients: {e}")
            self.clients.clear()

        # Server-Socket schließen
        if self.server_socket:
            try:
                self.server_socket.close()
            except Exception as e:
                logger.warning(f"Fehler beim Schließen des Server-Sockets: {e}")

        logger.info("TCP-Server beendet")


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

    temp_sensor = TemperatureHumiditySensor(DHT_PIN)
    image_proc = ImageProcessor()
    fan_controller = FanController(FAN_PIN)

    tcp_server = ColorSensorServer(TCP_HOST, TCP_PORT)
    opcua_server = OPCUAServer(
        OPCUA_ENDPOINT,
        OPCUA_SERVER_NAME,
        CERTIFICATE_PATH,
        PRIVATE_KEY_PATH
    )

    tcp_server.start()
    opcua_server.start()
    logger.info("Alle Server gestartet. Drücken Sie STRG+C zum Beenden.")

    try:
        while True:
            temperature, humidity = temp_sensor.read_sensor()
            rgb = image_proc.get_rgb_values()
            color_name = image_proc.identify_color()

            manual_control = opcua_server.get_fan_control()
            if manual_control:
                fan_controller.set_mode(False)
                fan_controller.set_fan(manual_control)
            else:
                fan_controller.set_mode(True)
                fan_controller.auto_control(temperature)

            fan_status = fan_controller.status
            logger.info(
                f"Temperatur: {temperature}°C, Luftfeuchtigkeit: {humidity}%, RGB: {rgb}, Farbe: {color_name}, Lüfter: {'AN' if fan_status else 'AUS'}")
            opcua_server.update_values(temperature, humidity, rgb, color_name, fan_status)

            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("\nBeende Programm (STRG+C).")
    except Exception as e:
        logger.error(f"Fehler im Hauptprogramm: {e}")
    finally:
        tcp_server.stop()
        opcua_server.stop()
        image_proc.close()
        fan_controller.cleanup()
        GPIO.cleanup()
        logger.info("Programm sauber beendet.")


if __name__ == "__main__":
    main()