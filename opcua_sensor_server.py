from opcua import Server, ua
from opcua.crypto import security_policies, uacrypto
import os

class OPCUAServer:
    def __init__(self, endpoint, name, cert_path, private_key_path):
        self.server = Server()
        self.endpoint = endpoint
        self.name = name
        self.cert_path = cert_path
        self.private_key_path = private_key_path
        self.setup_server()

    def setup_server(self):
        self.server.set_endpoint(self.endpoint)
        self.server.set_server_name(self.name)

        # Create certificates if they don't exist
        cert_dir = os.path.dirname(self.cert_path)
        if not os.path.exists(cert_dir):
            os.makedirs(cert_dir)
        
        if not os.path.exists(self.cert_path):
            uacrypto.create_self_signed_certificate(
                self.cert_path,
                self.private_key_path,
                f"{self.name}@RaspberryPi",
                uri=self.endpoint,
                key_size=2048
            )

        # Load certificates
        self.server.load_certificate(self.cert_path)
        self.server.load_private_key(self.private_key_path)

        # Set security policy
        self.server.set_security_policy([
            ua.SecurityPolicyType.Basic256Sha256_SignAndEncrypt
        ])

        # Set up namespace and variables
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