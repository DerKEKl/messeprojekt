import os
import cv2
import json
import time
import socket
import threading
import board
import adafruit_dht
from picamera2 import Picamera2
from opcua import Server, ua
from opcua.crypto import security_policies, uacrypto

OPCUA_ENDPOINT = "opc.tcp://0.0.0.0:4840"
OPCUA_SERVER_NAME = "RaspberryPiServer"
CERTIFICATE_PATH = "certificates/server_cert.pem"
PRIVATE_KEY_PATH = "certificates/server_key.pem"

TCP_HOST = "0.0.0.0"
TCP_PORT = 5000

DHT_PIN = 4

class OPCUAServer:
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
        if not os.path.exists(self.cert_path):
            uacrypto.create_self_signed_certificate(
                self.cert_path,
                self.key_path,
                f"{self.name}@RaspberryPi",
                uri=self.endpoint,
                key_size=2048
            )
        self.server.load_certificate(self.cert_path)
        self.server.load_private_key(self.key_path)
        self.server.set_security_policy([ua.SecurityPolicyType.Basic256Sha256_SignAndEncrypt])
        idx = self.server.register_namespace("http://example.org/sensors")
        objects = self.server.get_objects_node()
        self.sensors = objects.add_object(idx, "Sensors")
        self.temp_var = self.sensors.add_variable(idx, "Temperature", 0.0)
        self.humidity_var = self.sensors.add_variable(idx, "Humidity", 0.0)
        self.color_var = self.sensors.add_variable(idx, "Color", [0, 0, 0])

    def start(self):
        self.server.start()

    def update_values(self, temperature, humidity, color):
        if temperature is not None:
            self.temp_var.set_value(temperature)
        if humidity is not None:
            self.humidity_var.set_value(humidity)
        if color is not None:
            self.color_var.set_value(color)

    def stop(self):
        self.server.stop()


class TemperatureHumiditySensor:
    def __init__(self, pin):
        self.dht_device = None
        try:
            self.dht_device = adafruit_dht.DHT22(getattr(board, f"D{pin}"))
        except Exception as e:
            print(e)

    def read_sensor(self):
        if self.dht_device:
            try:
                temperature = self.dht_device.temperature
                humidity = self.dht_device.humidity
                return temperature, humidity
            except Exception as e:
                print(e)
        return None, None


class ImageProcessor:
    def __init__(self):
        self.camera = None
        self.using_picamera = False
        try:
            self.camera = Picamera2()
            config = self.camera.create_still_configuration()
            self.camera.configure(config)
            self.camera.start()
            time.sleep(1)
            self.using_picamera = True
        except:
            self.camera = cv2.VideoCapture(0)

    def get_rgb_values(self):
        try:
            if self.using_picamera:
                frame = self.camera.capture_array()
            else:
                ret, frame = self.camera.read()
                if not ret:
                    return 0, 0, 0
            bgr = cv2.mean(frame)[:3]
            return int(bgr[2]), int(bgr[1]), int(bgr[0])
        except Exception as e:
            print(e)
            return 0, 0, 0

    def close(self):
        if self.using_picamera and self.camera:
            self.camera.close()
        elif self.camera:
            self.camera.release()


class ColorSensorServer:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.server_socket = None
        self.running = False
        self.current_color = (0, 0, 0)
        self.clients = []
        self.lock = threading.Lock()

    def start(self):
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server_socket.bind((self.host, self.port))
        self.server_socket.listen(5)
        self.running = True
        threading.Thread(target=self.accept_connections, daemon=True).start()

    def accept_connections(self):
        while self.running:
            try:
                client, addr = self.server_socket.accept()
                with self.lock:
                    self.clients.append(client)
                threading.Thread(target=self.handle_client, args=(client,), daemon=True).start()
            except:
                pass

    def handle_client(self, client):
        while self.running:
            try:
                data = client.recv(1024)
                if not data:
                    break
                payload = json.loads(data.decode())
                if "rgb" in payload:
                    self.current_color = tuple(payload["rgb"])
            except:
                break
        with self.lock:
            if client in self.clients:
                self.clients.remove(client)
        client.close()

    def stop(self):
        self.running = False
        with self.lock:
            for client in self.clients:
                client.close()
        if self.server_socket:
            self.server_socket.close()


def main():
    temp_sensor = TemperatureHumiditySensor(DHT_PIN)
    image_proc = ImageProcessor()
    tcp_server = ColorSensorServer(TCP_HOST, TCP_PORT)
    opcua_server = OPCUAServer(OPCUA_ENDPOINT, OPCUA_SERVER_NAME, CERTIFICATE_PATH, PRIVATE_KEY_PATH)
    tcp_server.start()
    opcua_server.start()
    try:
        while True:
            temperature, humidity = temp_sensor.read_sensor()
            rgb = image_proc.get_rgb_values()
            opcua_server.update_values(temperature, humidity, rgb)
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    tcp_server.stop()
    opcua_server.stop()
    image_proc.close()

if __name__ == "__main__":
    main()