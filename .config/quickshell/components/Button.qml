import QtQuick
import "../"
import QtQuick.Controls.Basic

Button {
    id: control

    contentItem: Text {
        text: control.text
        color: Theme.textDark
        font.family: Theme.paragraphOneFamily
        font.pointSize: Theme.paragraphOneSize
        font.weight: Theme.paragraphOneWeight
        horizontalAlignment: Text.AlignHCenter
        verticalAlignment: Text.AlignVCenter
        elide: Text.ElideRight
        width: control.width
        leftPadding: 10
        rightPadding: 10
    }

    background: Rectangle {
        implicitWidth: 100
        implicitHeight: Theme.normalHeight
        color: control.hovered ? Qt.alpha(Theme.tertiaryBackground, Theme.tertiaryAlpha) : Qt.alpha(Theme.secondaryBackground, Theme.secondaryAlpha)
        radius: Theme.primaryRadius
    }
}
