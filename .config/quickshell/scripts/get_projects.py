#!/usr/bin/env python3
import datetime
import hashlib
import json
import mimetypes
import os
import subprocess
import urllib.parse
import xml.etree.ElementTree as ET
import zipfile
from urllib.parse import unquote

XBEL_PATH = os.path.expanduser("~/.local/share/recently-used.xbel")
CONFIG_PATH = os.path.expanduser("~/.config/quickshell/projects.json")

APP_DICT = {}


def build_app_dict():
    global APP_DICT
    if APP_DICT:
        return
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        list_apps_path = os.path.join(script_dir, "list_apps.py")
        res = subprocess.run(
            ["python3", list_apps_path], capture_output=True, text=True
        )
        apps = json.loads(res.stdout)

        for app in apps:
            dname = app.get("desktop", "")
            if dname:
                APP_DICT[dname] = app
                APP_DICT[dname.lower()] = app

            # Also key by human name for things like "Document Viewer"
            name = app.get("name", "")
            if name:
                APP_DICT[name] = app

            # Key by Exec bin
            exe = app.get("exec", "")
            if exe:
                exe_bin = os.path.basename(exe.split(" ")[0])
                APP_DICT[exe_bin] = app
    except Exception:
        pass


def get_default_desktop_file(filepath):
    try:
        mime = mimetypes.guess_type(filepath)[0]
        if not mime:
            res = subprocess.run(
                ["file", "-b", "--mime-type", filepath], capture_output=True, text=True
            )
            mime = res.stdout.strip()
        if mime:
            res = subprocess.run(["gio", "mime", mime], capture_output=True, text=True)
            for line in res.stdout.split("\n"):
                if line.startswith("Default application for"):
                    desktop_file = line.split(":")[-1].strip()
                    return desktop_file.replace(".desktop", "")
    except Exception:
        pass
    return ""


def create_text_thumbnail(filepath):
    uri = "file://" + urllib.parse.quote(os.path.abspath(filepath))
    md5_hash = hashlib.md5(uri.encode("utf-8")).hexdigest()
    thumb_out = f"/tmp/text_thumb_{md5_hash}.svg"
    if os.path.exists(thumb_out):
        return thumb_out

    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            lines = [f.readline().rstrip("\n") for _ in range(20)]

        # Strip trailing empty lines to look nicer
        while lines and not lines[-1]:
            lines.pop()

        svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
    <rect width="100%" height="100%" fill="#2e3440" rx="15"/>
    <text x="15" y="30" font-family="monospace" font-size="12" fill="#d8dee9">
"""
        y = 30
        for line in lines:
            line = line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            if len(line) > 40:
                line = line[:37] + "..."
            svg_content += f'        <tspan x="15" y="{y}">{line}</tspan>\n'
            y += 14

        svg_content += """    </text>
</svg>"""
        with open(thumb_out, "w", encoding="utf-8") as f:
            f.write(svg_content)
        return thumb_out
    except Exception:
        return ""


def get_freedesktop_thumbnail(filepath):
    uri = "file://" + urllib.parse.quote(os.path.abspath(filepath))
    md5_hash = hashlib.md5(uri.encode("utf-8")).hexdigest()

    if filepath.lower().endswith(".mscz"):
        try:
            thumb_out = f"/tmp/mscz_thumb_{md5_hash}.png"
            if os.path.exists(thumb_out):
                return thumb_out
            with zipfile.ZipFile(filepath, "r") as z:
                if "Thumbnails/thumbnail.png" in z.namelist():
                    with open(thumb_out, "wb") as f:
                        f.write(z.read("Thumbnails/thumbnail.png"))
                    return thumb_out
        except Exception:
            pass

    # Text previews
    ext = filepath.lower().split(".")[-1]
    if ext in [
        "tex",
        "html",
        "js",
        "py",
        "rs",
        "cpp",
        "c",
        "h",
        "qml",
        "json",
        "xml",
        "txt",
        "md",
        "sh",
        "conf",
        "ini",
    ]:
        return create_text_thumbnail(filepath)

    for size in ["large", "normal"]:
        thumb_path = os.path.expanduser(f"~/.cache/thumbnails/{size}/{md5_hash}.png")
        if os.path.exists(thumb_path):
            return thumb_path

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
            if not os.path.exists(path) or os.path.isdir(path):
                continue

            file_mtime = os.path.getmtime(path)

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

            if xbel_modified_ts > 0 and (xbel_modified_ts - file_mtime > 120):
                continue

            app_name = "Unknown"
            for elem in bookmark.iter():
                if elem.tag.endswith("application"):
                    app_name = elem.get("name", app_name)

            # Use app dict from list_apps.py
            app_data = APP_DICT.get(app_name)

            # If portal or not found, figure out default app for file
            if not app_data or "portal.desktop" in app_name:
                desktop_file = get_default_desktop_file(path)
                app_data = APP_DICT.get(desktop_file)

            if app_data:
                app_icon = app_data.get("icon", "text-x-generic")
                exec_cmd = app_data.get("exec", f"xdg-open '{path}'")

                if exec_cmd != f"xdg-open '{path}'":
                    exec_cmd = f"{exec_cmd} '{path}'"
            else:
                app_icon = "text-x-generic"
                exec_cmd = f"xdg-open '{path}'"

            thumb_path = get_freedesktop_thumbnail(path)

            bookmarks.append(
                {
                    "name": os.path.basename(path),
                    "path": path,
                    "app": app_name,
                    "icon": app_icon,
                    "thumb": thumb_path,
                    "exec": exec_cmd,
                    "pinned": False,
                    "time": format_mtime(file_mtime),
                    "file_type": get_file_type(path),
                    "mtime": file_mtime,
                }
            )

        bookmarks.sort(key=lambda x: x.get("mtime", 0), reverse=True)

        for b in bookmarks[:limit]:
            if "mtime" in b:
                del b["mtime"]
            recent_files.append(b)

    except Exception:
        pass

    return recent_files


def main():
    build_app_dict()

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
