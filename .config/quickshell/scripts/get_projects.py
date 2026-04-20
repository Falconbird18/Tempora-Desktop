#!/usr/bin/env python3
import datetime
import hashlib
import json
import mimetypes
import os
import urllib.parse
import xml.etree.ElementTree as ET
from urllib.parse import unquote

XBEL_PATH = os.path.expanduser("~/.local/share/recently-used.xbel")
CONFIG_PATH = os.path.expanduser("~/.config/quickshell/projects.json")

# Global cache for app icons
APP_ICON_MAP = {}


def build_app_icon_map():
    """Scans system .desktop files to map application IDs, names, and execs to their correct icons."""
    global APP_ICON_MAP
    if APP_ICON_MAP:
        return

    dirs = [
        "/usr/share/applications",
        os.path.expanduser("~/.local/share/applications"),
        "/var/lib/flatpak/exports/share/applications",
        "/var/lib/snapd/desktop/applications",
    ]

    for d in dirs:
        if not os.path.exists(d):
            continue
        for root, _, files in os.walk(d):
            for f in files:
                if f.endswith(".desktop"):
                    path = os.path.join(root, f)
                    try:
                        with open(path, "r", encoding="utf-8", errors="ignore") as f_in:
                            in_desktop_entry = False
                            name = ""
                            icon = ""
                            exec_bin = ""
                            for line in f_in:
                                line = line.strip()
                                if line == "[Desktop Entry]":
                                    in_desktop_entry = True
                                elif line.startswith("[") and in_desktop_entry:
                                    break
                                elif in_desktop_entry:
                                    if line.startswith("Name=") and not name:
                                        name = line[5:].strip()
                                    elif line.startswith("Icon=") and not icon:
                                        icon = line[5:].strip()
                                    elif line.startswith("Exec=") and not exec_bin:
                                        exec_val = line[5:].strip().split(" ")[0]
                                        exec_bin = os.path.basename(exec_val)

                            app_id = f.replace(".desktop", "")
                            if icon:
                                APP_ICON_MAP[app_id] = icon
                                APP_ICON_MAP[app_id.lower()] = icon
                                if name:
                                    APP_ICON_MAP[name] = icon
                                if exec_bin:
                                    APP_ICON_MAP[exec_bin] = icon
                    except Exception:
                        pass


def get_freedesktop_thumbnail(filepath):
    """
    Checks the standard Linux thumbnail cache for a pre-rendered thumbnail of the file.
    This works for PDFs, Blender files, videos, documents, etc. (handled by file managers).
    """
    uri = "file://" + urllib.parse.quote(os.path.abspath(filepath))
    md5_hash = hashlib.md5(uri.encode("utf-8")).hexdigest()

    # Prioritize high quality, then normal
    for size in ["large", "normal"]:
        thumb_path = os.path.expanduser(f"~/.cache/thumbnails/{size}/{md5_hash}.png")
        if os.path.exists(thumb_path):
            return thumb_path

    # Legacy fallback path
    thumb_path = os.path.expanduser(f"~/.thumbnails/normal/{md5_hash}.png")
    if os.path.exists(thumb_path):
        return thumb_path

    return ""


def format_mtime(mtime):
    try:
        dt = datetime.datetime.fromtimestamp(mtime)
        return dt.strftime("%-I:%M %p")
    except Exception:
        return "Unknown time"


def get_file_type(path):
    ext = os.path.splitext(path)[1].lower()
    if not ext:
        return "File"
    ext_name = ext[1:].upper()
    mime = mimetypes.guess_type(path)[0]
    if mime:
        if mime.startswith("image/"):
            return f"{ext_name} image"
        elif mime.startswith("video/"):
            return f"{ext_name} video"
        elif mime.startswith("text/"):
            return f"{ext_name} document"
        elif mime == "application/pdf":
            return "PDF document"
    return f"{ext_name} file"


def get_manual_projects():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r") as f:
                projects = json.load(f)
                for p in projects:
                    p["pinned"] = True
                    if "icon" not in p:
                        p["icon"] = "folder"
                    if "time" not in p:
                        p["time"] = "Pinned"
                    if "file_type" not in p:
                        p["file_type"] = "Project"
                    if "thumb" not in p and "path" in p:
                        p["thumb"] = get_freedesktop_thumbnail(p["path"])
                return projects
        except Exception:
            pass
    return []


def get_recent_files(limit=15):
    recent_files = []
    if not os.path.exists(XBEL_PATH):
        return recent_files

    try:
        tree = ET.parse(XBEL_PATH)
        root = tree.getroot()
        bookmarks = []
        for bookmark in root.findall("bookmark"):
            href = bookmark.get("href")
            if not href or not href.startswith("file://"):
                continue

            path = unquote(href[7:])
            if not os.path.exists(path):
                continue

            file_mtime = os.path.getmtime(path)

            # Extract the bookmark's modified time
            modified_str = bookmark.get("modified", "")
            xbel_modified_ts = 0
            if modified_str:
                try:
                    iso_str = modified_str
                    if iso_str.endswith("Z"):
                        iso_str = iso_str[:-1]
                    if "." in iso_str:
                        iso_str = iso_str.split(".")[0]
                    xbel_modified_ts = datetime.datetime.fromisoformat(
                        iso_str
                    ).timestamp()
                except Exception:
                    pass

            # Core logic: if the app logged this file (xbel_modified_ts) significantly
            # later than the file's actual modification time, it means it was merely OPENED,
            # not EDITED. We allow a 2-minute (120s) buffer for delayed disk writes.
            if xbel_modified_ts > 0 and (xbel_modified_ts - file_mtime > 120):
                continue

            app_name = "Unknown"
            for elem in bookmark.iter():
                if elem.tag.endswith("application"):
                    app_name = elem.get("name", app_name)

            # --- Icon Mapping ---
            app_icon = APP_ICON_MAP.get(
                app_name, APP_ICON_MAP.get(app_name.lower(), app_name)
            )

            # Fallback for generic file dialog portals that aren't real apps
            if "org.freedesktop.impl.portal.desktop" in app_name:
                app_icon = "text-x-generic"

            # Check for a freedesktop rendered thumbnail
            thumb_path = get_freedesktop_thumbnail(path)

            bookmarks.append(
                {
                    "name": os.path.basename(path),
                    "path": path,
                    "app": app_name,
                    "icon": app_icon,
                    "thumb": thumb_path,  # Expose the thumbnail path for the UI
                    "pinned": False,
                    "time": format_mtime(file_mtime),
                    "file_type": get_file_type(path),
                    "mtime": file_mtime,
                }
            )

        # Sort by actual edit time, most recent first
        bookmarks.sort(key=lambda x: x.get("mtime", 0), reverse=True)

        for b in bookmarks[:limit]:
            if "mtime" in b:
                del b["mtime"]
            recent_files.append(b)

    except Exception:
        pass

    return recent_files


def main():
    # Build the app icon dictionary once before parsing files
    build_app_icon_map()

    projects = []
    seen_paths = set()

    manual_projects = get_manual_projects()
    for p in manual_projects:
        path = p.get("path", "")
        if path and os.path.exists(path):
            projects.append(p)
            seen_paths.add(path)

    recent_files = get_recent_files(limit=20)
    for r in recent_files:
        path = r["path"]
        if path not in seen_paths:
            projects.append(r)
            seen_paths.add(path)

    # Output must be on a single line for QML's SplitParser
    print(json.dumps(projects, separators=(",", ":")))


if __name__ == "__main__":
    main()
