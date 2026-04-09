import json
import re
import subprocess
import sys
import threading
import time


def get_brightness():
    try:
        out = subprocess.check_output(["brightnessctl", "-m"], text=True).strip()
        # Output format: amdgpu_bl1,backlight,60652,100%,60652
        parts = out.split(",")
        if len(parts) >= 4:
            percent_str = parts[3].replace("%", "")
            return int(percent_str)
    except Exception:
        pass
    return 0


def get_volume():
    try:
        out = subprocess.check_output(
            ["wpctl", "get-volume", "@DEFAULT_AUDIO_SINK@"], text=True
        ).strip()
        # Output format: Volume: 0.70 [MUTED]
        vol = 0
        muted = False
        if "MUTED" in out:
            muted = True
            out = out.replace("[MUTED]", "").strip()
        parts = out.split(":")
        if len(parts) >= 2:
            vol = int(float(parts[1].strip()) * 100)
        return vol, muted
    except Exception:
        pass
    return 0, False


def brightness_monitor():
    proc = subprocess.Popen(
        ["udevadm", "monitor", "--subsystem-match=backlight"],
        stdout=subprocess.PIPE,
        text=True,
    )
    for line in iter(proc.stdout.readline, ""):
        if "change" in line:
            val = get_brightness()
            print(
                json.dumps({"type": "brightness", "value": val, "muted": False}),
                flush=True,
            )


def volume_monitor():
    proc = subprocess.Popen(["pactl", "subscribe"], stdout=subprocess.PIPE, text=True)
    for line in iter(proc.stdout.readline, ""):
        if "change" in line and "sink" in line:
            vol, muted = get_volume()
            print(
                json.dumps({"type": "volume", "value": vol, "muted": muted}), flush=True
            )


if __name__ == "__main__":
    t1 = threading.Thread(target=brightness_monitor, daemon=True)
    t2 = threading.Thread(target=volume_monitor, daemon=True)

    t1.start()
    t2.start()

    while True:
        time.sleep(1)
