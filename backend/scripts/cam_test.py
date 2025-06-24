import time
import sys
import cv2
import numpy as np
import os

# AlexGustafsson dobot-python library
sys.path.insert(0, os.path.abspath('dobot-python/lib'))
from interface import Interface

print("[INFO] Verbindung zu Dobot wird hergestellt...")
bot = Interface('COM8')

if bot.connected():
    print("[INFO] Verbindung erfolgreich hergestellt!")
else:
    print("[ERROR] Verbindung fehlgeschlagen!")
    exit()

# Positionen
STANDARD_POS = [250, 0, 50, 0]
SCAN_POS = [40, -200, 145, -80]

# Sortier-Positionen
SORT_POSITIONS = {
    'blue': [30, 245, -20, 83],
    'green': [155, 245, -20, 0],
    'red': [91, 262, -20, 70],
    'yellow': [-72, 220, 7, 108]
}

# Kalibrierung
PIXEL_TO_MM_X = 0.01
PIXEL_TO_MM_Y = -2.2

# Multi-Sampling Parameter
SAMPLING_COUNT = 8
SAMPLING_DELAY = 0.2

def set_suction(enable):
    """Saugnapf ein/aus schalten"""
    try:
        # Set suction cup (enable_control, suction_on)
        bot.set_end_effector_suction_cup(True, enable)
        time.sleep(0.1)
    except Exception as e:
        print(f"[WARNING] Saugnapf-Steuerung fehlgeschlagen: {e}")

def move_to_position(x, y, z, r, wait=True):
    """Bewegung zu Position - MOVJ (Joint Movement)"""
    try:
        # Mode 1 = MOVJ (Joint movement - keine linearen Zwischenschritte)
        bot.set_point_to_point_command(1, x, y, z, r)
        
        if wait:
            # Warte bis Bewegung abgeschlossen
            time.sleep(2)  # Anpassen je nach Geschwindigkeit
            
    except Exception as e:
        print(f"[ERROR] Bewegung fehlgeschlagen: {e}")

def home_robot():
    """Roboter zur Home-Position fahren"""
    print("[HOME] Fahre zur Home-Position...")
    try:
        bot.set_homing_command(0, wait=True)  # Auto homing
        time.sleep(2)  # Warten bis Homing abgeschlossen
    except Exception as e:
        print(f"[ERROR] Homing fehlgeschlagen: {e}")

def multi_sample_scan():
    """Mehrfach-Sampling für höchste Genauigkeit"""
    print(f"[SCAN] Fahre zu Scanposition...")
    
    # Direkt zur Scan-Position (kein Zwischenschritt nötig bei MOVJ)
    move_to_position(*SCAN_POS)
    time.sleep(1)
    
    print(f"[SCAN] Starte {SAMPLING_COUNT}x Sampling für höchste Genauigkeit...")
    
    # Sammle alle Messungen
    all_detections = []
    
    for sample in range(SAMPLING_COUNT):
        print(f"[SAMPLE] Messung {sample + 1}/{SAMPLING_COUNT}")
        
        cap = cv2.VideoCapture(1, cv2.CAP_DSHOW)
        if not cap.isOpened():
            continue
        
        # Mehrere Frames für bessere Qualität
        for _ in range(3):
            ret, frame = cap.read()
        if not ret:
            cap.release()
            continue
        
        # Blöcke in diesem Frame finden
        frame_blocks = detect_blocks_in_frame(frame)
        all_detections.extend(frame_blocks)
        
        cap.release()
        time.sleep(SAMPLING_DELAY)
    
    # Mittelwerte berechnen
    averaged_blocks = calculate_averaged_positions(all_detections)
    
    print(f"[SCAN-RESULT] {len(averaged_blocks)} Blöcke mit {SAMPLING_COUNT}x Sampling erkannt")
    
    return averaged_blocks

def detect_blocks_in_frame(frame):
    """Erkennt Blöcke in einem einzelnen Frame"""
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    
    color_ranges = {
        'red': [(np.array([0, 120, 70]), np.array([10, 255, 255])), 
                (np.array([170, 120, 70]), np.array([180, 255, 255]))],
        'yellow': [(np.array([20, 100, 100]), np.array([30, 255, 255]))],
        'green': [(np.array([40, 70, 70]), np.array([80, 255, 255]))],
        'blue': [(np.array([100, 150, 20]), np.array([140, 255, 255]))]
    }
    
    frame_blocks = []
    
    for color, ranges in color_ranges.items():
        combined_mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
        for lower, upper in ranges:
            mask = cv2.inRange(hsv, lower, upper)
            combined_mask = cv2.bitwise_or(combined_mask, mask)
        
        contours, _ = cv2.findContours(combined_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 300:
                M = cv2.moments(contour)
                if M["m00"] != 0:
                    # Sub-Pixel Genauigkeit
                    pixel_x = M["m10"] / M["m00"]
                    pixel_y = M["m01"] / M["m00"]
                    
                    frame_blocks.append({
                        'color': color,
                        'pixel_x': pixel_x,
                        'pixel_y': pixel_y,
                        'area': area
                    })
    
    return frame_blocks

def calculate_averaged_positions(all_detections):
    """Berechnet Mittelwerte aller Messungen pro Block"""
    if not all_detections:
        return []
    
    # Gruppiere Detections nach Farbe und Position
    block_groups = {}
    
    for detection in all_detections:
        color = detection['color']
        
        # Finde ähnliche Blöcke (gleiche Farbe, ähnliche Position)
        found_group = False
        for group_id, group in block_groups.items():
            if (group['color'] == color and 
                abs(group['pixel_x_sum'] / group['count'] - detection['pixel_x']) < 50 and
                abs(group['pixel_y_sum'] / group['count'] - detection['pixel_y']) < 50):
                
                # Zu existierender Gruppe hinzufügen
                group['pixel_x_sum'] += detection['pixel_x']
                group['pixel_y_sum'] += detection['pixel_y']
                group['area_sum'] += detection['area']
                group['count'] += 1
                found_group = True
                break
        
        if not found_group:
            # Neue Gruppe erstellen
            group_id = f"{color}_{len(block_groups)}"
            block_groups[group_id] = {
                'color': color,
                'pixel_x_sum': detection['pixel_x'],
                'pixel_y_sum': detection['pixel_y'],
                'area_sum': detection['area'],
                'count': 1
            }
    
    # Mittelwerte berechnen und zu Roboter-Koordinaten konvertieren
    averaged_blocks = []
    
    for group_id, group in block_groups.items():
        if group['count'] >= 3:  # Mindestens 3 Messungen für Stabilität
            
            # Mittelwerte
            avg_pixel_x = group['pixel_x_sum'] / group['count']
            avg_pixel_y = group['pixel_y_sum'] / group['count']
            
            # Zu Roboter-Koordinaten
            offset_x = (avg_pixel_x - 320) * PIXEL_TO_MM_X
            offset_y = (avg_pixel_y - 240) * PIXEL_TO_MM_Y
            
            robot_x = SCAN_POS[0] + offset_x
            robot_y = SCAN_POS[1] + offset_y
            
            # Stabilität berechnen
            pixel_x_variance = 0
            pixel_y_variance = 0
            variance_count = 0
            
            for detection in all_detections:
                if (detection['color'] == group['color'] and 
                    abs(detection['pixel_x'] - avg_pixel_x) < 50 and
                    abs(detection['pixel_y'] - avg_pixel_y) < 50):
                    
                    pixel_x_variance += (detection['pixel_x'] - avg_pixel_x) ** 2
                    pixel_y_variance += (detection['pixel_y'] - avg_pixel_y) ** 2
                    variance_count += 1
            
            stability_x = (pixel_x_variance / variance_count) ** 0.5 if variance_count > 1 else 0
            stability_y = (pixel_y_variance / variance_count) ** 0.5 if variance_count > 1 else 0
            
            averaged_blocks.append({
                'color': group['color'],
                'x': robot_x,
                'y': robot_y,
                'pixel_x': avg_pixel_x,
                'pixel_y': avg_pixel_y,
                'measurements': group['count'],
                'stability_x': stability_x,
                'stability_y': stability_y
            })
            
            print(f"[GEFUNDEN] {group['color']} bei Pixel({avg_pixel_x:.1f},{avg_pixel_y:.1f}) → Roboter({robot_x:.1f}, {robot_y:.1f})")
            print(f"           📊 {group['count']} Messungen, Stabilität: X±{stability_x:.1f}px Y±{stability_y:.1f}px")
    
    # Sortiere nach Stabilität (stabilste zuerst)
    averaged_blocks.sort(key=lambda x: x['stability_x'] + x['stability_y'])
    
    return averaged_blocks

def test_position(block):
    """Fährt zu Block-Position und fragt ob es passt"""
    print(f"[TEST] Fahre zu {block['color']} bei ({block['x']:.1f}, {block['y']:.1f})")
    print(f"       Basiert auf {block['measurements']} Messungen")
    
    move_to_position(block['x'], block['y'], 50, 0)
    
    result = input(f"Bin ich über dem {block['color']} Block? (j/n): ")
    return result.lower() == 'j'

def adjust_calibration():
    """Passt X- und Y-Kalibrierung getrennt an"""
    global PIXEL_TO_MM_X, PIXEL_TO_MM_Y
    
    print(f"Aktuelle Kalibrierung:")
    print(f"  X-Richtung: {PIXEL_TO_MM_X} mm/pixel")
    print(f"  Y-Richtung: {PIXEL_TO_MM_Y} mm/pixel")
    
    try:
        new_x = input(f"Neuer X-Wert (Enter = {PIXEL_TO_MM_X} behalten): ")
        if new_x:
            PIXEL_TO_MM_X = float(new_x)
        
        new_y = input(f"Neuer Y-Wert (Enter = {PIXEL_TO_MM_Y} behalten): ")
        if new_y:
            PIXEL_TO_MM_Y = float(new_y)
        
        print(f"Neue Kalibrierung: X={PIXEL_TO_MM_X}, Y={PIXEL_TO_MM_Y}")
    except:
        print("Ungültige Eingabe - behalte alte Werte")

def pick_and_place_block(block):
    """Greift Block und sortiert ihn ein"""
    print(f"[PICK] Greife {block['color']} bei ({block['x']:.1f}, {block['y']:.1f})")
    print(f"       Präzision: {block['measurements']} Messungen, Stabilität ±{block['stability_x']:.1f}px")
    
    # Greifen - direkt zur Position (MOVJ)
    move_to_position(block['x'], block['y'], -41, 0)
    set_suction(True)  # Saugnapf an
    time.sleep(0.5)
    
    # Block anheben
    move_to_position(block['x'], block['y'], 50, 0)
    
    # Einsortieren - direkt zur Sortierposition (MOVJ)
    if block['color'] in SORT_POSITIONS:
        x, y, z, r = SORT_POSITIONS[block['color']]
        move_to_position(x, y, z, r)
        set_suction(False)  # Saugnapf aus
        move_to_position(*STANDARD_POS)
        print(f"RESULT:{block['color']}")
    else:
        set_suction(False)
        print(f"[ERROR] Unbekannte Farbe: {block['color']}")

def main():
    """Hauptprogramm mit AlexGustafsson dobot-python"""
    print("🎯 HOCHPRÄZISES PICK-AND-PLACE MIT JOINT-BEWEGUNGEN")
    print(f"📊 {SAMPLING_COUNT}x Sampling für maximale Genauigkeit")
    print("🔧 MOVJ-Modus: Keine linearen Zwischenschritte nötig")
    
    # Initial setup
    print("[SETUP] Roboter-Initialisierung...")
    set_suction(False)  # Saugnapf aus
    
    home_robot()
    
    time.sleep(1)
    
    # Zur Standardposition
    move_to_position(*STANDARD_POS)
    
    while True:
        # Multi-Sampling Scan
        blocks = multi_sample_scan()
        
        if not blocks:
            print("Keine stabilen Blöcke gefunden")
            break
        
        # Stabilsten Block testen
        most_stable_block = blocks[0]
        print(f"Test-Block: {most_stable_block['color']} (stabilster Block)")
        position_ok = test_position(most_stable_block)
        
        if not position_ok:
            # Kalibrierung anpassen
            adjust_calibration()
            continue
        
        # Kalibrierung stimmt - alle Blöcke bearbeiten
        print(f"✅ Kalibrierung OK - bearbeite {len(blocks)} Blöcke")
        
        for i, block in enumerate(blocks, 1):
            print(f"\n[PROGRESS] Block {i}/{len(blocks)}")
            pick_and_place_block(block)
        
        break
    
    # Cleanup
    print("[CLEANUP] Roboter zur Standardposition...")
    move_to_position(*STANDARD_POS)
    set_suction(False)
    print("Fertig!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[INFO] Programm unterbrochen")
        set_suction(False)
        move_to_position(*STANDARD_POS)
    except Exception as e:
        print(f"[ERROR] Unerwarteter Fehler: {e}")
        set_suction(False)
    finally:
        print("[INFO] Verbindung wird geschlossen...")
