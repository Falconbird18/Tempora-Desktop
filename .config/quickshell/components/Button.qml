import QtQuick
import "../"
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
        elide: Text.ElideRight
        width: control.width
        leftPadding: 10
        rightPadding: 10
    }

    background: Rectangle {
        implicitWidth: 100
        implicitHeight: Theme.normalHeight
        color: control.hovered ? control.hoverColor : Qt.alpha(Theme.secondaryBackground, Theme.secondaryAlpha)
        radius: Theme.primaryRadius
    }
}
