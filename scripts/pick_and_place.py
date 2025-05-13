import time
import sys
from pydobot import Dobot
from identify_color import identify

sys.path.insert(0, "src")

print("[INFO] Verbindung zu Dobot wird hergestellt...")
bot = Dobot("COM6")
time.sleep(1)
print("[INFO] Verbindung erfolgreich hergestellt!")
bot.suck(False)


def pick():
    print("[AKTION] Greife nach Bauteil...")
    bot.move_to(10, -241, -41, -87)
    bot.suck(True)
    bot.move_to(250, 0, 50, 0)
    print("[AKTION] Bauteil erfasst.")

def getColor():
    bot.move_to(250, 0, 50, 0, wait=True)
    print("[AKTION] Farbe wird analysiert...")
    color = identify()
    time.sleep(1)
    print(f"Farbe erkannt. Das Teil ist {color}.")
    return color

def place(color):
    print(f"[ACTION] Bauteil wird einsortiert für Farbe {color}...")
    time.sleep(1)
    
    if color == "none":
        print("[ACTION] Keine Farbe erkannt.")
        bot.suck(False)
        return
    
    if color == "blue":
        bot.move_to(30, 245, -20, 83, wait=True)
        bot.suck(False)
        print("[ACTION] Place abgeschlossen.")
        bot.move_to(250, 0, 50, 0, wait=True)
        return

    if color == "green":
        bot.move_to(155, 245, -20, 0, wait=True)
        bot.suck(False)
        print("[ACTION] Place abgeschlossen.")
        bot.move_to(250, 0, 50, 0, wait=True)
        return
    
    if color == "red":
        bot.move_to(91, 262, -20, 70, wait=True)
        bot.suck(False)
        print("[ACTION] Place abgeschlossen.")
        bot.move_to(250, 0, 50, 0, wait=True)
        return
    
    if color == "yellow":
        bot.move_to(-72, 220, 7, 108, wait=True)
        bot.suck(False)
        print("[ACTION] Place abgeschlossen.")
        bot.move_to(250, 0, 50, 0, wait=True)
        return
    
def programm():
    pick()
    color = getColor()
    place(color)

def main():
    programm()
    programm()
    programm()


if __name__ == "__main__":
    main()