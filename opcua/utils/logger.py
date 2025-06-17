"""
Logging Utilities für den Raspberry Pi Sensor Server
"""

import datetime
import logging
import os
import tarfile

from config import LOG_DIR, LOG_FILE, LOG_FORMAT, LOG_LEVEL


def rotate_latest_log():
    """
    Prüft, ob logs/latest.log existiert und archiviert sie
    in ein .tar.gz Archiv mit Datumsbezeichnung und aufsteigendem Zähler.
    """
    latest_log_path = os.path.join(LOG_DIR, LOG_FILE)
    os.makedirs(LOG_DIR, exist_ok=True)

    if not os.path.isfile(latest_log_path):
        return

    today_str = datetime.datetime.now().strftime("%Y%m%d")
    counter = 1

    while True:
        archive_name = f"{today_str}-{counter}.tar.gz"
        archive_path = os.path.join(LOG_DIR, archive_name)

        if not os.path.exists(archive_path):
            with tarfile.open(archive_path, "w:gz") as tar:
                tar.add(latest_log_path, arcname=LOG_FILE)
            os.remove(latest_log_path)
            break
        counter += 1


def setup_logging(name="RaspberryPi :: Server"):
    """
    Konfiguriert das Logging-System
    """
    rotate_latest_log()

    # Logging Level aus String konvertieren
    numeric_level = getattr(logging, LOG_LEVEL.upper(), logging.INFO)

    logging.basicConfig(
        level=numeric_level,
        format=LOG_FORMAT,
        handlers=[
            logging.FileHandler(os.path.join(LOG_DIR, LOG_FILE)),
            logging.StreamHandler()
        ]
    )

    return logging.getLogger(name)
