import subprocess
import json
import os
import sys

# Improved dynamic_bg.py
# - Uses timeouts on external commands to avoid hanging
# - Robust PPM (P6) header parsing that handles comments
# - Samples pixels efficiently (avoids long-running Python loops on very large images)
# - Better error logging

HYPRCTL_TIMEOUT = 2
GRIM_TIMEOUT = 6

def get_monitor_geometry():
    try:
        out = subprocess.check_output(["hyprctl", "monitors", "-j"], timeout=HYPRCTL_TIMEOUT)
        monitors = json.loads(out)
        for m in monitors:
            if m.get("focused"):
                return int(m.get("x", 0)), int(m.get("y", 0)), int(m.get("width", 0)), int(m.get("height", 0))
    except subprocess.TimeoutExpired:
        print("hyprctl timed out", file=sys.stderr)
    except FileNotFoundError:
        print("hyprctl not found", file=sys.stderr)
    except Exception as e:
        print("Failed to get monitor geometry:", e, file=sys.stderr)
    return 0, 0, 1920, 1080


def read_ppm_header_and_pixels(data):
    # data is bytes from a P6 PPM. We need to parse the header properly (magic, width, height, maxval)
    # Handle comments that start with '#'
    if not data.startswith(b'P6'):
        raise ValueError('Not a P6 PPM')
    idx = 2
    length = len(data)
    tokens = []
    while len(tokens) < 3 and idx < length:
        # skip whitespace
        while idx < length and data[idx] in b' \t\r\n':
            idx += 1
        if idx < length and data[idx] == ord('#'):
            # skip comment line
            while idx < length and data[idx] not in b'\n':
                idx += 1
            continue
        # read token
        start = idx
        while idx < length and data[idx] not in b' \t\r\n':
            idx += 1
        if start < idx:
            tokens.append(data[start:idx].decode('ascii', errors='ignore'))
    if len(tokens) < 3:
        raise ValueError('Incomplete PPM header')
    width = int(tokens[0])
    height = int(tokens[1])
    maxval = int(tokens[2])
    # consume single whitespace after header
    # idx currently at the byte after the last token; skip a single whitespace if present
    if idx < length and data[idx] in b' \t\r\n':
        idx += 1
    pixels = data[idx:]
    expected = width * height * 3
    if len(pixels) < expected:
        # It's possible that stream truncated; still attempt with what we have
        pass
    return width, height, maxval, pixels


def get_average_color():
    x, y, w, h = get_monitor_geometry()
    # Exclude top 32 pixels (assuming the bar is 32px tall and at the top)
    y_offset = 32
    if h <= y_offset:
        y_offset = 0
    geom = f"{x},{y + y_offset} {w}x{max(1, h - y_offset)}"

    try:
        proc = subprocess.run(["grim", "-g", geom, "-t", "ppm", "-"], capture_output=True, timeout=GRIM_TIMEOUT)
    except subprocess.TimeoutExpired:
        print("grim timed out", file=sys.stderr)
        return 128, 128, 128
    except FileNotFoundError:
        print("grim not found", file=sys.stderr)
        return 128, 128, 128
    except Exception as e:
        print("grim failed:", e, file=sys.stderr)
        return 128, 128, 128

    if proc.returncode != 0 or not proc.stdout:
        print("grim returned error:", proc.stderr.decode('utf-8', errors='ignore'), file=sys.stderr)
        return 128, 128, 128

    data = proc.stdout
    try:
        width, height, maxval, pixels = read_ppm_header_and_pixels(data)
    except Exception as e:
        print("PPM parse error:", e, file=sys.stderr)
        return 128, 128, 128

    # Compute average color. We'll sample pixels to avoid very long loops on huge images.
    pixel_count = (len(pixels) // 3)
    if pixel_count == 0:
        return 128, 128, 128

    # Choose a sampling step so we sample up to ~200k pixels max
    max_samples = 200000
    step = max(1, pixel_count // max_samples)

    rs = gs = bs = 0
    samples = 0
    mv = memoryview(pixels)
    for i in range(0, pixel_count, step):
        base = i * 3
        rs += mv[base]
        gs += mv[base + 1]
        bs += mv[base + 2]
        samples += 1

    if samples == 0:
        return 128, 128, 128
    r = rs / samples
    g = gs / samples
    b = bs / samples
    return r, g, b


def relative_luminance(r, g, b):
    def adjust(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b)


def contrast_ratio(r1, g1, b1, r2, g2, b2):
    l1 = relative_luminance(r1, g1, b1)
    l2 = relative_luminance(r2, g2, b2)
    light = max(l1, l2)
    dark = min(l1, l2)
    return (light + 0.05) / (dark + 0.05)


def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    if len(hex_str) == 8:
        hex_str = hex_str[:6]
    if len(hex_str) == 6:
        return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))
    return 0, 0, 0


def rgb_to_hex(r, g, b):
    return f"#{int(r):02x}{int(g):02x}{int(b):02x}"


def adjust_color_for_contrast(bg_r, bg_g, bg_b, text_r, text_g, text_b, target_contrast=4.5):
    text_lum = relative_luminance(text_r, text_g, text_b)
    is_text_dark = text_lum < 0.5

    r, g, b = bg_r, bg_g, bg_b
    step = 6

    for _ in range(60):
        if contrast_ratio(r, g, b, text_r, text_g, text_b) >= target_contrast:
            break
        if is_text_dark:
            r = min(255, r + step)
            g = min(255, g + step)
            b = min(255, b + step)
        else:
            r = max(0, r - step)
            g = max(0, g - step)
            b = max(0, b - step)
    return r, g, b


def main():
    theme_path = os.path.expanduser("~/.config/quickshell/theme.json")
    text_color_hex = "#220538"

    theme = {}
    if os.path.exists(theme_path):
        try:
            with open(theme_path, "r") as f:
                theme = json.load(f)
                if "textDark" in theme:
                    text_color_hex = theme["textDark"]
        except Exception:
            # Corrupt or unreadable theme.json; continue with defaults
            pass

    tr, tg, tb = hex_to_rgb(text_color_hex)
    ar, ag, ab = get_average_color()

    nr, ng, nb = adjust_color_for_contrast(ar, ag, ab, tr, tg, tb, 4.5)
    new_bg_hex = rgb_to_hex(nr, ng, nb)

    theme["primaryBackground"] = new_bg_hex
    theme["secondaryBackground"] = new_bg_hex

    try:
        with open(theme_path, "w") as f:
            json.dump(theme, f, indent=4)
    except Exception as e:
        print("Failed to write theme.json:", e, file=sys.stderr)

    print(f"Updated background to {new_bg_hex}")


if __name__ == "__main__":
    main()
