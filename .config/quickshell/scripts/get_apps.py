import json
import os

app_dirs = [
    "/usr/share/applications/",
    os.path.expanduser("~/.local/share/applications/"),
]

apps = []
seen_execs = set()

for d in app_dirs:
    if not os.path.exists(d):
        continue
    for f in os.listdir(d):
        if not f.endswith(".desktop"):
            continue
        path = os.path.join(d, f)

        try:
            # .desktop files can contain duplicates or ignore errors, so we parse manually to be safe
            with open(path, "r", encoding="utf-8", errors="ignore") as f_obj:
                lines = f_obj.readlines()

            entry = {}
            in_desktop = False
            for line in lines:
                line = line.strip()
                if line == "[Desktop Entry]":
                    in_desktop = True
                    continue
                elif line.startswith("[") and in_desktop:
                    in_desktop = False

                if in_desktop and "=" in line:
                    k, v = line.split("=", 1)
                    entry[k] = v

            if entry.get("NoDisplay", "").lower() == "true":
                continue
            if entry.get("Hidden", "").lower() == "true":
                continue
            if entry.get("Type") != "Application":
                continue

            name = entry.get("Name")
            exec_cmd = entry.get("Exec")
            icon = entry.get("Icon", "")

            if name and exec_cmd:
                # Clean up Exec (remove %U, %F, etc.)
                exec_cmd = " ".join(
                    [part for part in exec_cmd.split() if not part.startswith("%")]
                )
                if exec_cmd not in seen_execs:
                    apps.append(
                        {
                            "name": name,
                            "exec": exec_cmd,
                            "icon": icon,
                            "searchKey": name.lower(),
                        }
                    )
                    seen_execs.add(exec_cmd)
        except Exception:
            continue

# Sort alphabetically
apps.sort(key=lambda x: x["name"].lower())

json_data = json.dumps(apps)

with open("/tmp/quickshellApps.json", "w", encoding="utf-8") as out:
    out.write(json_data)

with open("/tmp/qs_apps.json", "w", encoding="utf-8") as out:
    out.write(json_data)

print(json_data)
