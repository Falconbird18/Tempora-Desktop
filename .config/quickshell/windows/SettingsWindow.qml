import QtQuick
import "../"
import QtQuick.Window
import QtQuick.Controls
import QtQuick.Layouts

Window {
    id: settingsWindow
    width: 600
    height: 400
    color: Qt.alpha(Theme.primaryBackground, 0.8)
    title: "Settings"
    visible: false

    Rectangle {
        anchors.fill: parent
        color: Qt.alpha(Theme.primaryBackground, 0.8)

        Text {
            anchors.centerIn: parent
            text: "Settings Window"
            color: "#eceff4"
            font.pointSize: 24
        }
    }

    function toggle() {
        visible = !visible;
        if (visible) {
            requestActivate();
        }
    }
}
