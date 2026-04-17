pragma Singleton
import QtQuick
import Quickshell.Io

Item {
    id: root

    // Workspace settings
    // Can be "dots" or "numbers"
    property string workspaceStyle

    // Internal state to prevent saving defaults before the load completes
    property bool _loaded: false

    onWorkspaceStyleChanged: {
        if (_loaded) {
            saveSettings();
        }
    }

    function saveSettings() {
        let config = {
            workspaceStyle: root.workspaceStyle
        };
        let jsonString = JSON.stringify(config, null, 4).replace(/'/g, "'\\''");

        // Write the JSON safely to the settings file using echo
        writeProcess.command = ["sh", "-c", "echo '" + jsonString + "' > '" + root.configPath + "'"];
        writeProcess.running = true;
    }

    Process {
        id: writeProcess
    }

    property string jsonBuffer: ""

    property string configPath: Qt.resolvedUrl(".").toString().replace("file://", "") + "settings.json"

    Process {
        id: readProcess
        // Attempt to read the existing config file, or fall back to an empty JSON object
        command: ["sh", "-c", "cat '" + root.configPath + "' 2>/dev/null || echo '{}'"]
        stdout: SplitParser {
            onRead: data => {
                root.jsonBuffer += data + "\n";
            }
        }
        onExited: {
            let str = root.jsonBuffer.trim();
            if (str !== "") {
                try {
                    let parsed = JSON.parse(str);
                    if (parsed.workspaceStyle !== undefined) {
                        root.workspaceStyle = parsed.workspaceStyle;
                    }
                } catch (e) {
                    console.log("Failed to parse settings.json: " + e);
                }
            }
            // Allow saving on future property changes now that we've synced state
            root._loaded = true;
            root.jsonBuffer = "";
        }
    }

    Component.onCompleted: {
        readProcess.running = true;
    }
}
