#!/bin/bash

echo "=== Systemupdate und benötigte Pakete installieren ==="
apt-get update
apt-get install -y \
  python3-full \
  python3-pip \
  python3-venv \
  build-essential \
  libpcap-dev \
  libraspberrypi-bin \
  libraspberrypi-dev \
  libgpiod2 \
  libgpiod-dev \
  gpiod \
  python3-libgpiod \
  v4l-utils \
  usbutils \
  libjpeg-dev \
  zlib1g-dev \
  libfreetype6-dev \
  liblcms2-dev \
  libopenjp2-7 \
  libtiff5 \
  libffi-dev \
  libssl-dev \
  i2c-tools \
  python3-dev \
  libatlas-base-dev \
  python3-libcamera \
  libcamera-dev \
  libcamera-apps

echo "=== Kameraerkennung prüfen ==="
if ls /dev/video* 1>/dev/null 2>&1; then
    echo "Kamera-Gerät(e) erkannt:"
    ls -l /dev/video*
else
    echo "Keine Kamera unter /dev/video* gefunden."
fi

echo "=== Benutzer zur 'video'-Gruppe hinzufügen ==="
usermod -a -G video "$SUDO_USER"

echo "=== Benutzer zur 'gpio'- und 'dialout'-Gruppe hinzufügen ==="
usermod -a -G gpio,dialout "$SUDO_USER"

echo "=== Udev-Regel für GPIO-Zugriff erstellen ==="
cat <<EOF > /etc/udev/rules.d/99-gpio.rules
SUBSYSTEM=="gpio", KERNEL=="gpiochip*", ACTION=="add", PROGRAM="/bin/sh -c 'chown root:gpio /dev/gpiochip* && chmod 660 /dev/gpiochip*'"
EOF

echo "=== Udev-Regeln neu laden ==="
udevadm control --reload-rules
udevadm trigger

echo "=== GPIO-Chip-Verfügbarkeit prüfen ==="
if gpiodetect 2>/dev/null; then
    echo "GPIO-Chips verfügbar."
else
    echo "Keine GPIO-Chips gefunden oder Berechtigungen fehlen (ggf. Neustart erforderlich)."
fi

echo "=== Kameramodule laden ==="
modprobe uvcvideo
modprobe bcm2835-v4l2 2>/dev/null || echo "Hinweis: bcm2835-v4l2 ist evtl. nur für Raspberry Pi nötig."

echo "=== Kamera mit v4l2-ctl prüfen ==="
v4l2-ctl --list-devices || echo "v4l2-ctl konnte keine Kamera finden."

echo "=== OpenCV-Check (optional) ==="
if python3 -c "import cv2; print(cv2.getBuildInformation())" 2>/dev/null | grep -q V4L/V4L2; then
    echo "OpenCV wurde mit V4L2-Unterstützung kompiliert."
else
    echo "OpenCV hat möglicherweise keine V4L2-Unterstützung."
fi

echo "=== Raspberry Pi Kamera-Konfiguration (falls zutreffend) ==="
if grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
    echo "→ Bitte Kamera in raspi-config aktivieren:"
    echo "   sudo raspi-config → Interface Options → Camera → Enable"
fi

echo "=== FERTIG ==="
echo "Bitte starten Sie das System neu oder melden Sie sich ab und wieder an, damit alle Gruppenberechtigungen aktiv werden."
