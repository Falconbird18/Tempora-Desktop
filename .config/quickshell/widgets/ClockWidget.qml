import QtQuick

Rectangle {
    id: root
    color: "#2e3440" // Nord background color
    radius: 14
    width: clockText.paintedWidth + 24
    height: 28

    border.color: "#3b4252"
    border.width: 1

    Text {
        id: clockText
        anchors.centerIn: parent
        color: "#eceff4" // Nord text color
        font.family: "Inter, sans-serif"
        font.pixelSize: 13
        font.weight: Font.DemiBold
    }

    Timer {
        interval: 1000
        running: true
        repeat: true
        onTriggered: {
            clockText.text = Qt.formatDateTime(new Date(), "ddd, MMM d   •   h:mm ap");
        }
    }

    Component.onCompleted: {
        clockText.text = Qt.formatDateTime(new Date(), "ddd, MMM d   •   h:mm ap");
    }
}
