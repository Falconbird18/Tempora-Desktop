import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import Quickshell.Hyprland
import "../components" as Components

PanelWindow {
    id: quickSettings
    implicitWidth: 350
    implicitHeight: 250
    color: "transparent"
    visible: false

    focusable: visible
    exclusionMode: ExclusionMode.Ignore

    anchors {
        top: true
        right: true
    }
    margins {
        top: 40
        right: 10
    }

    GlobalShortcut {
        name: "toggle-quick-settings"
        description: "Toggle quick settings"
        onPressed: quickSettings.toggle()
    }

    function toggle() {
        visible = !visible;
        if (visible) {
            forceActiveFocus();
        }
    }

    Rectangle {
        anchors.fill: parent
        color: "#2e3440"
        border.color: "#4c566a"
        border.width: 2
        radius: 8

        focus: true
        Keys.onEscapePressed: quickSettings.visible = false
        onActiveFocusChanged: {
            if (!activeFocus && quickSettings.visible) {
                quickSettings.visible = false;
            }
        }

        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 15
            spacing: 10

            Text {
                text: "Quick Settings"
                color: "#eceff4"
                font.pointSize: 16
                font.bold: true
            }

            Rectangle {
                Layout.fillWidth: true
                height: 1
                color: "#4c566a"
            }

            RowLayout {
                Layout.fillWidth: true
                spacing: 15

                Components.Button {
                    text: "Wi-Fi"
                    Layout.fillWidth: true
                }

                Components.Button {
                    text: "Bluetooth"
                    Layout.fillWidth: true
                }
            }

            RowLayout {
                Layout.fillWidth: true
                spacing: 15

                Components.Button {
                    text: "Audio"
                    Layout.fillWidth: true
                }

                Components.Button {
                    text: "Display"
                    Layout.fillWidth: true
                }
            }

            Item {
                Layout.fillHeight: true
            }
        }
    }
}
