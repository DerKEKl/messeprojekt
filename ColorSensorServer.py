import socket
import threading
import json

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