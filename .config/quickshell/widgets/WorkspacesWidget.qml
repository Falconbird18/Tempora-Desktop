import QtQuick
import Quickshell.Hyprland
import "../"

Rectangle {
    id: root
    color: Qt.alpha(Theme.secondaryBackground, Theme.secondaryAlpha)
    radius: Theme.primaryRadius
    height: Theme.normalHeight
    width: workspacesRow.width + 16

    property int activeWorkspace: Hyprland.focusedWorkspace ? Hyprland.focusedWorkspace.id : 1
    property int workspaceCount: {
        let max = 5;
        if (Hyprland.workspaces && Hyprland.workspaces.values) {
            for (let i = 0; i < Hyprland.workspaces.values.length; ++i) {
                if (Hyprland.workspaces.values[i].id > max) {
                    max = Hyprland.workspaces.values[i].id;
                }
            }
        }
        return max;
    }

    Row {
        id: workspacesRow
        anchors.centerIn: parent
        spacing: 8

        Repeater {
            model: root.workspaceCount

            delegate: Rectangle {
                required property int index
                property bool isActive: root.activeWorkspace === index + 1

                width: Settings.workspaceStyle === "numbers" ? 24 : (isActive ? 24 : 12)
                height: Settings.workspaceStyle === "numbers" ? 24 : 12
                radius: Settings.workspaceStyle === "numbers" ? 12 : 6

                color: isActive ? Theme.primary : Qt.alpha(Theme.tertiaryBackground, Theme.tertiaryAlpha)

                Behavior on width {
                    NumberAnimation {
                        duration: 200
                        easing.type: Easing.OutExpo
                    }
                }

                Behavior on height {
                    NumberAnimation {
                        duration: 200
                        easing.type: Easing.OutExpo
                    }
                }

                Behavior on color {
                    ColorAnimation {
                        duration: 200
                    }
                }

                Text {
                    anchors.centerIn: parent
                    text: (index + 1).toString()
                    color: isActive ? "#ffffff" : Theme.textDark
                    visible: Settings.workspaceStyle === "numbers"
                    font.pixelSize: 12
                    font.bold: true
                }

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: Hyprland.dispatch("workspace " + (index + 1))
                }
            }
        }
    }
}
