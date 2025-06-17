import cv2
import numpy as np

def identify():
    lower_red1 = np.array([0, 120, 70])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([170, 120, 70])
    upper_red2 = np.array([180, 255, 255])
    lower_yellow = np.array([20, 100, 100])
    upper_yellow = np.array([30, 255, 255])
    lower_green = np.array([40, 70, 70])
    upper_green = np.array([80, 255, 255])
    lower_blue = np.array([100, 150, 20])
    upper_blue = np.array([140, 255, 255])
    
    cap = cv2.VideoCapture(1, cv2.CAP_DSHOW) 

    if not cap.isOpened():
        print("Kamera konnte nicht geöffnet werden!")
        exit()

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Kein Bild von der Kamera empfangen!")
            break

        cv2.imshow("Kamera-Test", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        mask_red = cv2.bitwise_or(
            cv2.inRange(hsv, lower_red1, upper_red1),
            cv2.inRange(hsv, lower_red2, upper_red2)
        )
        mask_yellow = cv2.inRange(hsv, lower_yellow, upper_yellow)
        mask_green = cv2.inRange(hsv, lower_green, upper_green)
        mask_blue = cv2.inRange(hsv, lower_blue, upper_blue)

        if cv2.countNonZero(mask_red) > 200:
            cap.release()
            cv2.destroyAllWindows()
            return "red"
        elif cv2.countNonZero(mask_yellow) > 200:
            cap.release()
            cv2.destroyAllWindows()
            return "yellow"
        elif cv2.countNonZero(mask_green) > 200:
            cap.release()
            cv2.destroyAllWindows()
            return "green"
        elif cv2.countNonZero(mask_blue) > 200:
            cap.release()
            cv2.destroyAllWindows()
            return "blue"
        else:
            cap.release()
            cv2.destroyAllWindows()
            return "none"

    cap.release()
    cv2.destroyAllWindows()
    return None
