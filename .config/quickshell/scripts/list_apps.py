import os
import json
import configparser

def get_apps():
    apps = []
    dirs = ["/usr/share/applications", os.path.expanduser("~/.local/share/applications")]
    seen = set()
    for d in dirs:
        if not os.path.exists(d): continue
        for root, _, files in os.walk(d):
            for f in files:
                if f.endswith(".desktop"):
                    path = os.path.join(root, f)
                    if path in seen: continue
                    seen.add(path)
                    
                    config = configparser.ConfigParser(interpolation=None)
                    try:
                        config.read(path)
                        if "Desktop Entry" in config:
                            entry = config["Desktop Entry"]
                            if entry.get("NoDisplay", "false").lower() == "true": continue
                            if entry.get("Type", "") != "Application": continue
                            
                            name = entry.get("Name", f.replace(".desktop", ""))
                            exe = entry.get("Exec", "").split(" %")[0].split(" -")[0]
                            icon = entry.get("Icon", "")
                            
                            if exe:
                                apps.append({"name": name, "exec": exe, "icon": icon})
                    except:
                        pass
    
    apps.sort(key=lambda x: x["name"].lower())
    print(json.dumps(apps))

if __name__ == "__main__":
    get_apps()
