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
        threading.Thread(target=self._accept_connections, daemon=True).start()

    def _accept_connections(self):
        while self.running:
            try:
                client, _ = self.server_socket.accept()
                with self.lock:
                    self.clients.append(client)
                threading.Thread(target=self._handle_client, args=(client,), daemon=True).start()
            except:
                if self.running:
                    continue

    def _handle_client(self, client):
        while self.running:
            try:
                data = client.recv(1024)
                if not data:
                    break
                color_data = json.loads(data.decode())
                if 'rgb' in color_data:
                    self.current_color = tuple(color_data['rgb'])
            except:
                break
        
        with self.lock:
            if client in self.clients:
                self.clients.remove(client)
        client.close()

    def get_current_color(self):
        return self.current_color

    def stop(self):
        self.running = False
        for client in self.clients:
            try:
                client.close()
            except:
                pass
        if self.server_socket:
            self.server_socket.close()