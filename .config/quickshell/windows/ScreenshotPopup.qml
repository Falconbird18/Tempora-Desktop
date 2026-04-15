import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import Quickshell.Hyprland
import "../"

PanelWindow {
    id: screenshotPopup
    color: "transparent"
    visible: false

    focusable: visible
    exclusionMode: ExclusionMode.Ignore

    anchors {
        top: true
        bottom: true
        left: true
        right: true
    }

    // This exposes a global shortcut to Hyprland.
    // You will need to add the following line to your Hyprland config (e.g. keybinds.conf):
    // bind = Super Space, S, global, quickshell:screenshot-popup
    GlobalShortcut {
        name: "screenshot-popup"
        onPressed: {
            screenshotPopup.visible = !screenshotPopup.visible;
        }
    }

    Shortcut {
        sequence: "Escape"
        onActivated: screenshotPopup.visible = false
    }

    // Click outside the popup to close it
    MouseArea {
        anchors.fill: parent
        onClicked: screenshotPopup.visible = false
    }

    Rectangle {
        anchors.centerIn: parent
        width: 380
        height: 160
        color: "#1e1e2e" // Fallback dark theme background
        radius: 12
        border.color: "#313244"
        border.width: 1

        // Consume clicks inside the rectangle so they don't trigger the close MouseArea
        MouseArea {
            anchors.fill: parent
        }

        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 20
            spacing: 15

            Text {
                text: "Take a Screenshot"
                font.pointSize: 16
                font.bold: true
                color: "#cdd6f4" // Fallback light text
                Layout.alignment: Qt.AlignHCenter
            }

            RowLayout {
                Layout.alignment: Qt.AlignHCenter
                spacing: 15

                Button {
                    text: "Whole Screen"
                    onClicked: {
                        screenshotPopup.visible = false;
                        screenProcess.running = true;
                    }
                }
                Button {
                    text: "Window"
                    onClicked: {
                        screenshotPopup.visible = false;
                        windowProcess.running = true;
                    }
                }
                Button {
                    text: "Area"
                    onClicked: {
                        screenshotPopup.visible = false;
                        areaProcess.running = true;
                    }
                }
            }
        }
    }

    Process {
        id: screenProcess
        command: ["sh", "-c", "sleep 0.2 && grim - | wl-copy && notify-send 'Screenshot' 'Whole screen copied to clipboard' -i accessories-screenshot"]
    }

    Process {
        id: windowProcess
        command: ["sh", "-c", "sleep 0.2 && grim -g \"$(hyprctl activewindow -j | jq -r '\"\\(.at[0]),\\(.at[1]) \\(.size[0])x\\(.size[1])\"')\" - | wl-copy && notify-send 'Screenshot' 'Window copied to clipboard' -i accessories-screenshot"]
    }

    Process {
        id: areaProcess
        command: ["sh", "-c", "sleep 0.2 && grim -g \"$(slurp)\" - | wl-copy && notify-send 'Screenshot' 'Area copied to clipboard' -i accessories-screenshot"]
    }
}
