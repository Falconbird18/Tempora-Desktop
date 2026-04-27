import QtQuick
import Quickshell
import Quickshell.Services.Mpris
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
    property var mediaControllerRef: null

    Item {
        anchors.fill: parent
        anchors.leftMargin: 10
        anchors.rightMargin: 10

        Row {
            anchors.left: parent.left
            height: parent.height
            spacing: 10

            Components.IconButton {
                icon: "diamonds-four-duotone.svg"
                size: Theme.iconSize
                isButton: true
                onClicked: if (topBar.launcherRef) {
                    topBar.launcherRef.toggle();
                }
            }

            Components.Button {
                id: mediaButton
                property var player: topBar.mediaControllerRef ? topBar.mediaControllerRef.player : null
                text: player && player.trackTitle ? player.trackTitle : "No Media"
                width: 150
                anchors.verticalCenter: parent.verticalCenter
                onClicked: {
                    if (topBar.mediaControllerRef) {
                        let pos = mediaButton.mapToItem(null, 0, mediaButton.height);
                        topBar.mediaControllerRef.toggle(pos.x, topBar.height + 5);
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
