import QtQuick
import "../"

Rectangle {
    id: root
    color: mouseArea.containsMouse ? Theme.hover : Qt.alpha(Theme.secondaryBackground, Theme.secondaryAlpha)
    radius: Theme.primaryRadius
    width: clockText.paintedWidth + 24
    height: Theme.normalHeight

    signal clicked

    MouseArea {
        id: mouseArea
        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        onClicked: root.clicked()
    }

    Text {
        id: clockText
        anchors.centerIn: parent
        color: Theme.textDark
        font.family: Theme.paragraphOneFamily !== undefined ? Theme.paragraphOneFamily : "Open Sans"
        font.pixelSize: Theme.paragraphOneSize !== undefined ? Theme.paragraphOneSize : 16
        font.weight: Theme.paragraphOneWeight !== undefined ? Theme.paragraphOneWeight : 400
    }

    Timer {
        interval: 1000
        running: true
        repeat: true
        onTriggered: {
            clockText.text = Qt.formatDateTime(new Date(), "ddd, MMM d  •  h:mm ap");
        }
    }

    Component.onCompleted: {
        clockText.text = Qt.formatDateTime(new Date(), "ddd, MMM d  •  h:mm ap");
    }
}
