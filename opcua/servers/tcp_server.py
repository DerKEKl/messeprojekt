import asyncio
import json
import logging


class ColorSensorServer:
    def __init__(self, host, port, logger=None):
        self.host = host
        self.port = port
        self.logger = logger or logging.getLogger(__name__)
        self.server = None
        self.clients = set()
        self.latest_color = (0, 0, 0)

    def update_color(self, rgb_tuple):
        if not isinstance(rgb_tuple, tuple) or len(rgb_tuple) != 3:
            self.logger.warning(f"Ungültige Farbwerte übergeben: {rgb_tuple}")
            return
        self.latest_color = rgb_tuple
        self.logger.debug(f"Farbwerte aktualisiert: {self.latest_color}")

    async def handle_client(self, reader, writer):
        addr = writer.get_extra_info('peername')
        self.logger.info(f"Client verbunden: {addr}")
        self.clients.add(writer)
        try:
            while True:
                data = await reader.read(100)
                if not data:
                    break
                self.logger.info(f"Empfangen von {addr}: {data}")
        except Exception as e:
            self.logger.error(f"Fehler mit Client {addr}: {e}")
        finally:
            self.logger.info(f"Client getrennt: {addr}")
            self.clients.discard(writer)
            try:
                writer.close()
                await writer.wait_closed()
            except ConnectionResetError as cre:
                self.logger.debug(f"ConnectionResetError beim Schließen von {addr}: {cre}")
            except Exception as e:
                self.logger.error(f"Fehler beim Schließen von {addr}: {e}")

    async def send_color_to_clients(self):
        while True:
            message = json.dumps({
                "r": self.latest_color[0],
                "g": self.latest_color[1],
                "b": self.latest_color[2]
            }) + "\n"
            to_remove = set()
            for writer in self.clients:
                try:
                    writer.write(message.encode())
                    await writer.drain()
                except Exception as e:
                    self.logger.error(f"Fehler beim Senden an Client: {e}")
                    to_remove.add(writer)
            for w in to_remove:
                self.clients.discard(w)
            await asyncio.sleep(1)

    def stop(self):
        if self.server:
            self.server.close()
            self.logger.info("TCP-Server gestoppt")
        else:
            self.logger.warning("Server ist nicht gestartet oder bereits gestoppt.")

    async def start_server(self):
        self.server = await asyncio.start_server(self.handle_client, self.host, self.port)
        self.logger.info(f"Server gestartet auf {self.host}:{self.port}")

        asyncio.create_task(self.send_color_to_clients())

        async with self.server:
            await self.server.serve_forever()

    def start(self):
        loop = asyncio.get_event_loop()
        loop.create_task(self.start_server())
        return True
