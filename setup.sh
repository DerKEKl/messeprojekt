#!/bin/bash

set -e  # Script bei Fehler abbrechen

echo "=== Raspberry Pi Sensor Server Setup ==="

if [ "$(id -u)" -ne 0 ]; then
    echo "Bitte als root oder mit sudo ausführen."
    exit 1
fi

# Funktion für einfache Statusanzeigen
print_step() {
    echo ""
    echo "=== $1 ==="
}

print_step "Systemupdate und benötigte Pakete installieren"
apt-get update
apt-get install -y \
  python3-full python3-pip python3-venv \
  build-essential libpcap-dev \
  libraspberrypi-bin libraspberrypi-dev \
  libgpiod2 libgpiod-dev gpiod python3-libgpiod \
  v4l-utils usbutils \
  libjpeg-dev zlib1g-dev libfreetype6-dev \
  liblcms2-dev libopenjp2-7 libtiff6 libffi-dev libssl-dev \
  i2c-tools python3-dev libatlas-base-dev \
  python3-libcamera libcamera-dev libcamera-apps

print_step "Kameraerkennung prüfen"
if ls /dev/video* 1>/dev/null 2>&1; then
    echo "Kamera-Gerät(e) erkannt:"
    ls -l /dev/video*
else
    echo "Keine Kamera unter /dev/video* gefunden."
fi

# Benutzer
CURRENT_USER="${SUDO_USER:-$USER}"

print_step "Benutzer $CURRENT_USER zur 'video'-Gruppe hinzufügen"
read -p "Soll der Benutzer $CURRENT_USER zur 'video'-Gruppe hinzugefügt werden? [j/N]: " ADD_VIDEO
if [[ "$ADD_VIDEO" =~ ^[Jj]$ ]]; then
    usermod -a -G video "$CURRENT_USER"
    echo "Benutzer hinzugefügt."
else
    echo "Übersprungen."
fi

print_step "Benutzer $CURRENT_USER zur 'gpio'- und 'dialout'-Gruppe hinzufügen"
read -p "Soll der Benutzer $CURRENT_USER zur 'gpio' und 'dialout'-Gruppe hinzugefügt werden? [j/N]: " ADD_GPIO
if [[ "$ADD_GPIO" =~ ^[Jj]$ ]]; then
    usermod -a -G gpio,dialout "$CURRENT_USER"
    echo "Benutzer hinzugefügt."
else
    echo "Übersprungen."
fi

print_step "Udev-Regel für GPIO-Zugriff erstellen"
RULES_FILE="/etc/udev/rules.d/99-gpio.rules"
cat <<EOF > "$RULES_FILE"
SUBSYSTEM=="gpio", KERNEL=="gpiochip*", ACTION=="add", PROGRAM="/bin/sh -c 'chown root:gpio /dev/gpiochip* && chmod 660 /dev/gpiochip*'"
EOF
udevadm control --reload-rules
udevadm trigger
echo "Udev-Regel gesetzt."

print_step "GPIO-Chip-Verfügbarkeit prüfen"
if gpiodetect 2>/dev/null; then
    echo "GPIO-Chips verfügbar."
else
    echo "Keine GPIO-Chips gefunden oder Berechtigungen fehlen (ggf. Neustart erforderlich)."
fi

print_step "Kameramodule laden"
modprobe uvcvideo
if modprobe bcm2835-v4l2 2>/dev/null; then
    echo "bcm2835-v4l2 Modul geladen (Raspberry Pi spezifisch)."
else
    echo "Hinweis: bcm2835-v4l2 nicht geladen, wahrscheinlich kein Raspberry Pi."
fi

print_step "Kamera mit v4l2-ctl prüfen"
if v4l2-ctl --list-devices; then
    echo "Kamera erkannt."
else
    echo "v4l2-ctl konnte keine Kamera finden."
fi

print_step "OpenCV V4L2-Unterstützung prüfen (optional)"
if python3 -c "import cv2; print(cv2.getBuildInformation())" 2>/dev/null | grep -q V4L/V4L2; then
    echo "OpenCV wurde mit V4L2-Unterstützung kompiliert."
else
    echo "OpenCV hat möglicherweise keine V4L2-Unterstützung."
fi

print_step "Raspberry Pi Kamera-Konfiguration (falls zutreffend)"
if grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
    echo "→ Bitte Kamera in raspi-config aktivieren:"
    echo "   sudo raspi-config → Interface Options → Camera → Enable"
fi

echo ""
echo "=== FERTIG ==="
echo "Bitte starten Sie das System neu oder melden Sie sich ab und wieder an, damit alle Gruppenberechtigungen aktiv werden."
