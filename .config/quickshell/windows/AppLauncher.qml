import QtQuick
import Quickshell
import "../components" as Components

PopupWindow {
    id: appLauncher
    width: 400
    height: 500
    color: "#2e3440"
    visible: false

    function toggle() {
        visible = !visible;
    }

    Rectangle {
        anchors.fill: parent
        color: "transparent"
        border.color: "#4c566a"
        border.width: 2
        radius: 8

        Column {
            anchors.fill: parent
            anchors.margins: 15
            spacing: 10

            Text {
                text: "Applications"
                color: "#eceff4"
                font.pointSize: 16
                font.bold: true
            }

            Rectangle {
                width: parent.width
                height: 1
                color: "#4c566a"
            }

            Components.Button {
                text: "Terminal"
                width: parent.width
                onClicked: {
                    console.log("Launch Terminal");
                    appLauncher.visible = false;
                }
            }

            Components.Button {
                text: "Browser"
                width: parent.width
                onClicked: {
                    console.log("Launch Browser");
                    appLauncher.visible = false;
                }
            }
        }
    }
}
