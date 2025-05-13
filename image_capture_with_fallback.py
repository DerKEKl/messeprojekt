import cv2
from picamera2 import Picamera2
import time

class ImageProcessor:
    def __init__(self):
        try:
            self.camera = Picamera2()
            config = self.camera.create_still_configuration()
            self.camera.configure(config)
            self.camera.start()
            time.sleep(2)
            self.using_picamera = True
        except:
            print("Falling back to USB camera")
            self.camera = cv2.VideoCapture(0)
            self.using_picamera = False

    def get_rgb_values(self):
        try:
            if self.using_picamera:
                frame = self.camera.capture_array()
            else:
                _, frame = self.camera.read()
            
            avg_color = cv2.mean(frame)[:3]
            return tuple(map(int, avg_color[::-1]))  # Convert BGR to RGB
        except Exception as e:
            print(f"Error capturing image: {e}")
            return (0, 0, 0)

    def close(self):
        if self.using_picamera:
            self.camera.close()
        else:
            self.camera.release()