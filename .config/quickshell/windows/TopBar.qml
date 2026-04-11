import QtQuick
import Quickshell
import "../components" as Components
import "../widgets" as Widgets
import "../"

PanelWindow {
    id: topBar

    anchors {
        top: true
        left: true
        right: true
    }

    implicitHeight: 36
    color: Qt.alpha(Theme.primaryBackground, Theme.primaryAlpha)

    // We expect the parent (ShellRoot) to pass in a reference to the launcher
    property var launcherRef: null
    property var quickSettingsRef: null

    Item {
        anchors.fill: parent
        anchors.leftMargin: 10
        anchors.rightMargin: 10

        Row {
            anchors.left: parent.left
            height: parent.height
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
        }

        Widgets.WorkspacesWidget {
            anchors.horizontalCenter: parent.horizontalCenter
            anchors.verticalCenter: parent.verticalCenter
        }

        Widgets.ClockWidget {
            anchors.right: parent.right
            anchors.verticalCenter: parent.verticalCenter

            onClicked: {
                if (topBar.quickSettingsRef) {
                    topBar.quickSettingsRef.toggle();
                }
            }
        }
    }
}
