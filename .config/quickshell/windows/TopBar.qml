import QtQuick
import Quickshell
import "../components" as Components

PanelWindow {
    id: topBar

    anchors {
        top: true
        left: true
        right: true
    }

    height: 36
    color: "#2e3440"

    // We expect the parent (ShellRoot) to pass in a reference to the launcher
    property var launcherRef: null

    Row {
        anchors.fill: parent
        anchors.leftMargin: 10
        anchors.rightMargin: 10
        spacing: 10

        Components.Button {
            text: "Menu"
            width: 80
            anchors.verticalCenter: parent.verticalCenter
            onClicked: {
                if (topBar.launcherRef) {
                    topBar.launcherRef.toggle();
                }
            }
        }

        Item {
            // Spacer
            width: parent.width - 200
            height: parent.height
        }

        Text {
            text: Qt.formatDateTime(new Date(), "hh:mm ap")
            color: "#eceff4"
            font.pointSize: 11
            font.bold: true
            anchors.verticalCenter: parent.verticalCenter

            // Simple timer to update the clock
            Timer {
                interval: 1000
                running: true
                repeat: true
                onTriggered: parent.text = Qt.formatDateTime(new Date(), "hh:mm ap")
            }
        }
    }
}
