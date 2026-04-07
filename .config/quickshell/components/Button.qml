import QtQuick
import QtQuick.Controls.Basic

Button {
    id: control
    property color bgColor: "#2e3440"
    property color hoverColor: "#3b4252"
    property color textColor: "#eceff4"

    contentItem: Text {
        text: control.text
        color: control.textColor
        horizontalAlignment: Text.AlignHCenter
        verticalAlignment: Text.AlignVCenter
        font.pointSize: 11
    }

    background: Rectangle {
        implicitWidth: 100
        implicitHeight: 32
        color: control.hovered ? control.hoverColor : control.bgColor
        radius: 6
        border.color: "#4c566a"
        border.width: 1
    }
}
