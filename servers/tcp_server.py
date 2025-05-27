"""
TCP Server für Farbdaten-Empfang
"""

import socket
import threading
import json
import logging


class ColorSensorServer:
    """
    TCP-Server, der Farbwerte von externen Clients entgegennimmt.
    """

    def __init__(self, host, port, logger=None):
        self.host = host
        self.port = port
        self.logger = logger or logging.getLogger(__name__)

        self.server_socket = None
        self.running = False
        self.current_color = (0, 0, 0)
        self.clients = []
        self.lock = threading.Lock()
        self.color_updated = False  # Flag für neue Farbe

    def start(self):
        """Startet den TCP-Server."""
        try:
            self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.server_socket.bind((self.host, self.port))
            self.server_socket.listen(5)
            self.running = True

            # Connection-Handler in separatem Thread starten
            threading.Thread(target=self._accept_connections, daemon=True).start()

            self.logger.info(f"TCP-Server gestartet auf {self.host}:{self.port}")
            return True
        except Exception as e:
            self.logger.error(f"Fehler beim Starten des TCP-Servers: {e}", exc_info=True)
            return False

    def _accept_connections(self):
        """Akzeptiert eingehende Verbindungen und startet für jeden Client einen Thread."""
        while self.running:
            try:
                client, addr = self.server_socket.accept()
                self.logger.info(f"Neue Verbindung von {addr}")

                with self.lock:
                    self.clients.append(client)

                # Client-Handler in separatem Thread starten
                threading.Thread(
                    target=self._handle_client,
                    args=(client,),
                    daemon=True
                ).start()

            except OSError:
                if self.running:
                    self.logger.error("Socket-Fehler beim Akzeptieren von Verbindungen")
                break
            except Exception as e:
                if self.running:
                    self.logger.error(f"Fehler beim Akzeptieren einer Verbindung: {e}")

    def _handle_client(self, client):
        """
        Empfängt die Farbdaten (RGB) des Clients im JSON-Format,
        z.B. {"rgb": [R, G, B]}.
        """
        client_address = None
        try:
            client_address = client.getpeername()
            self.logger.info(f"Client-Handler gestartet für {client_address}")
        except:
            self.logger.info("Client-Handler gestartet (Adresse unbekannt)")

        while self.running:
            try:
                data = client.recv(1024)
                if not data:
                    self.logger.info(f"Client {client_address} hat die Verbindung getrennt")
                    break

                # JSON-Daten parsen
                payload = json.loads(data.decode())
                if "rgb" in payload and isinstance(payload["rgb"], list) and len(payload["rgb"]) == 3:
                    with self.lock:
                        self.current_color = tuple(payload["rgb"])
                        self.color_updated = True  # Signal für neue Daten

                    self.logger.info(f"Neue Farbwerte von {client_address} empfangen: {self.current_color}")
                else:
                    self.logger.warning(f"Ungültiges Farbdatenformat von {client_address}: {payload}")

            except json.JSONDecodeError:
                self.logger.warning(f"Ungültiges JSON-Format von {client_address} empfangen")
            except ConnectionResetError:
                self.logger.info(f"Verbindung zu {client_address} wurde zurückgesetzt")
                break
            except Exception as e:
                self.logger.error(f"Fehler bei der Client-Kommunikation mit {client_address}: {e}")
                break

        # Client aufräumen
        self._cleanup_client(client)
        self.logger.info(f"Client-Verbindung zu {client_address} geschlossen")

    def _cleanup_client(self, client):
        """Räumt einen Client auf"""
        with self.lock:
            if client in self.clients:
                self.clients.remove(client)

        try:
            client.close()
        except Exception:
            pass

    def get_color(self):
        """Gibt aktuelle Farbwerte zurück und setzt das Update-Flag zurück."""
        with self.lock:
            color = self.current_color
            was_updated = self.color_updated
            self.color_updated = False
            return color, was_updated

    def stop(self):
        """Beendet den TCP-Server und trennt alle aktiven Verbindungen."""
        self.running = False

        # Alle Clients schließen
        with self.lock:
            for client in self.clients[:]:  # Kopie der Liste erstellen
                try:
                    client.close()
                except Exception as e:
                    self.logger.warning(f"Fehler beim Schließen eines Clients: {e}")
            self.clients.clear()

        # Server-Socket schließen
        if self.server_socket:
            try:
                self.server_socket.close()
            except Exception as e:
                self.logger.warning(f"Fehler beim Schließen des Server-Sockets: {e}")

        self.logger.info("TCP-Server beendet")


class DummyTCPServer:
    """
    Dummy-Implementation für Testzwecke
    """

    def __init__(self, host, port, logger=None):
        self.host = host
        self.port = port
        self.logger = logger or logging.getLogger(__name__)
        self.current_color = (0, 0, 0)

    def start(self):
        self.logger.info(f"Dummy-TCP-Server gestartet für {self.host}:{self.port}")
        return True

    def get_color(self):
        return self.current_color, False

    def stop(self):
        self.logger.info("Dummy-TCP-Server gestoppt")