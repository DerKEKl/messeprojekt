import cv2
from picamera2 import Picamera2
import time

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