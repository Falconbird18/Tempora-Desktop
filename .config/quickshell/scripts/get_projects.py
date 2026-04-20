#!/usr/bin/env python3
import json
import os
import xml.etree.ElementTree as ET
from urllib.parse import unquote
import datetime
import mimetypes

XBEL_PATH = os.path.expanduser("~/.local/share/recently-used.xbel")
CONFIG_PATH = os.path.expanduser("~/.config/quickshell/projects.json")

def format_time(iso_str):
    if not iso_str:
        return "Unknown time"
    try:
        # Example format: 2024-04-19T23:07:36Z
        if iso_str.endswith('Z'):
            iso_str = iso_str[:-1]
        # Remove fractional seconds if present
        if '.' in iso_str:
            iso_str = iso_str.split('.')[0]
        dt = datetime.datetime.fromisoformat(iso_str)
        return dt.strftime("%-I:%M %p")
    except Exception:
        return iso_str

def get_file_type(path):
    ext = os.path.splitext(path)[1].lower()
    if not ext:
        return "File"
    ext_name = ext[1:].upper()
    mime = mimetypes.guess_type(path)[0]
    if mime:
        if mime.startswith('image/'):
            return f"{ext_name} image"
        elif mime.startswith('video/'):
            return f"{ext_name} video"
        elif mime.startswith('text/'):
            return f"{ext_name} document"
        elif mime == 'application/pdf':
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
                return projects
        except Exception as e:
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
            modified = bookmark.get("modified", "")
            app_name = "Unknown"
            for elem in bookmark.iter():
                if elem.tag.endswith("application"):
                    app_name = elem.get("name", app_name)
            
            # Map known app desktop files to their icon names
            app_icon = app_name
            if "org.freedesktop.impl.portal.desktop" in app_name:
                app_icon = "text-x-generic"
            if app_name.lower() == "org.inkscape.inkscape":
                app_icon = "org.inkscape.Inkscape"
            elif app_name.lower() == "org.kde.kdenlive":
                app_icon = "kdenlive"
            elif "gimp" in app_name.lower():
                app_icon = "gimp"

            bookmarks.append({
                "name": os.path.basename(path),
                "path": path,
                "app": app_name,
                "icon": app_icon,
                "pinned": False,
                "time": format_time(modified),
                "file_type": get_file_type(path),
                "modified_raw": modified,
            })
        bookmarks.sort(key=lambda x: x.get("modified_raw", ""), reverse=True)
        for b in bookmarks[:limit]:
            if "modified_raw" in b:
                del b["modified_raw"]
            recent_files.append(b)
    except Exception as e:
        pass
    return recent_files

def main():
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
    print(json.dumps(projects, separators=(",", ":")))

if __name__ == "__main__":
    main()
