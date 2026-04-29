import subprocess
import json
import os

def get_monitor_geometry():
    try:
        out = subprocess.check_output(["hyprctl", "monitors", "-j"])
        monitors = json.loads(out)
        for m in monitors:
            if m.get("focused"):
                return int(m["x"]), int(m["y"]), int(m["width"]), int(m["height"])
    except Exception as e:
        print("Failed to get monitor geometry:", e)
    return 0, 0, 1920, 1080

def get_average_color():
    x, y, w, h = get_monitor_geometry()
    # Exclude top 32 pixels (assuming the bar is 32px tall and at the top)
    geom = f"{x},{y+32} {w}x{h-32}"
    
    proc = subprocess.Popen(["grim", "-g", geom, "-t", "ppm", "-"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    data, err = proc.communicate()
    
    if not data:
        print("Grim failed:", err)
        return 128, 128, 128
        
    idx = 0
    # PPM Header: P6 \n width height \n maxval \n
    for _ in range(4):
        while idx < len(data) and data[idx:idx+1] in b' \t\n\r': idx += 1
        while idx < len(data) and data[idx:idx+1] not in b' \t\n\r': idx += 1
    # Skip the single whitespace after maxval
    idx += 1
    pixels = data[idx:]
    
    if len(pixels) < 3:
        return 128, 128, 128
        
    # Sample every 30th pixel (so we look at 1 in 10 pixels to be fast)
    r = sum(pixels[0::30]) / (len(pixels[0::30]) or 1)
    g = sum(pixels[1::30]) / (len(pixels[1::30]) or 1)
    b = sum(pixels[2::30]) / (len(pixels[2::30]) or 1)
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
    step = 5
    
    for _ in range(55):
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
        with open(theme_path, "r") as f:
            try:
                theme = json.load(f)
                if "textDark" in theme:
                    text_color_hex = theme["textDark"]
            except Exception:
                pass
                
    tr, tg, tb = hex_to_rgb(text_color_hex)
    ar, ag, ab = get_average_color()
    
    nr, ng, nb = adjust_color_for_contrast(ar, ag, ab, tr, tg, tb, 4.5)
    new_bg_hex = rgb_to_hex(nr, ng, nb)
    
    theme["primaryBackground"] = new_bg_hex
    theme["secondaryBackground"] = new_bg_hex
    
    with open(theme_path, "w") as f:
        json.dump(theme, f, indent=4)
        
    print(f"Updated background to {new_bg_hex}")

if __name__ == "__main__":
    main()
