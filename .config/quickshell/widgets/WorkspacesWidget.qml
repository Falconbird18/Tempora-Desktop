import QtQuick
import Quickshell.Hyprland

Rectangle {
    id: root
    color: "#2e3440"
    radius: 14
    height: 28
    width: workspacesRow.width + 16

    border.color: "#3b4252"
    border.width: 1

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

                width: root.activeWorkspace === index + 1 ? 24 : 12
                height: 12
                radius: 6

                color: root.activeWorkspace === index + 1 ? "#88c0d0" : "#4c566a"

                Behavior on width {
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

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: Hyprland.dispatch("workspace " + (index + 1))
                }
            }
        }
    }
}
