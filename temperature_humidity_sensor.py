import board
import adafruit_dht

class TemperatureHumiditySensor:
    def __init__(self, pin):
        try:
            self.dht_device = adafruit_dht.DHT22(getattr(board, f"D{pin}"))
        except Exception as e:
            print(f"Error initializing DHT22: {e}")
            self.dht_device = None

    def read_sensor(self):
        if self.dht_device:
            try:
                temperature = self.dht_device.temperature
                humidity = self.dht_device.humidity
                return temperature, humidity
            except Exception as e:
                print(f"Error reading DHT22: {e}")
        return None, None