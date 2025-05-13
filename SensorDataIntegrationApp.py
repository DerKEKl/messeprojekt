import time
from temperature_humidity_sensor import TemperatureHumiditySensor
from image_processor import ImageProcessor
from color_sensor_server import ColorSensorServer
from opcua_server import OPCUAServer
from config import *

def main():
    temp_sensor = TemperatureHumiditySensor(DHT_PIN)
    image_proc = ImageProcessor()
    tcp_server = ColorSensorServer(TCP_HOST, TCP_PORT)
    opcua_server = OPCUAServer(
        OPCUA_ENDPOINT,
        OPCUA_SERVER_NAME,
        CERTIFICATE_PATH,
        PRIVATE_KEY_PATH
    )
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