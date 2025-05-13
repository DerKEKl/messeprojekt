from temp_humidity_sensor import TemperatureHumiditySensor
from image_processor import ImageProcessor
from tcp_server import ColorSensorServer
from opcua_server import OPCUAServer
from config import *
import time

def main():
    # Initialize components
    temp_sensor = TemperatureHumiditySensor(DHT_PIN)
    image_proc = ImageProcessor()
    tcp_server = ColorSensorServer(TCP_HOST, TCP_PORT)
    opcua_server = OPCUAServer(
        OPCUA_ENDPOINT,
        OPCUA_SERVER_NAME,
        CERTIFICATE_PATH,
        PRIVATE_KEY_PATH
    )

    # Start servers
    tcp_server.start()
    opcua_server.start()

    try:
        while True:
            # Read sensor data
            temp, humidity = temp_sensor.read_sensor()
            rgb_values = image_proc.get_rgb_values()

            # Update OPC UA values
            opcua_server.update_values(temp, humidity, rgb_values)

            time.sleep(1)

    except KeyboardInterrupt:
        # Cleanup
        tcp_server.stop()
        opcua_server.stop()
        image_proc.close()

if __name__ == "__main__":
    main()