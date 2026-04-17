import QtQuick
import QtQuick.Layouts
import "../"

Rectangle {
    id: root
    implicitWidth: 150
    implicitHeight: 36
    radius: height / 2
    color: Qt.alpha(Theme.tertiaryBackground, 0.4)
    border.color: Qt.darker(Theme.primaryBackground, 1.2)
    border.width: 1

    property string leftText: "Left"
    property string rightText: "Right"
    property bool checked: false // false = left, true = right

    signal toggled

    MouseArea {
        anchors.fill: parent
        cursorShape: Qt.PointingHandCursor
        onClicked: {
            root.checked = !root.checked;
            root.toggled();
        }
    }

    // Sliding Highlight Background
    Rectangle {
        width: parent.width / 2
        height: parent.height
        radius: parent.radius
        color: Theme.primary
        x: root.checked ? parent.width / 2 : 0

        Behavior on x {
            NumberAnimation {
                duration: 200
                easing.type: Easing.InOutQuad
            }
        }
    }

    RowLayout {
        anchors.fill: parent
        spacing: 0

        Text {
            Layout.preferredWidth: parent.width / 2
            Layout.fillHeight: true
            text: root.leftText
            horizontalAlignment: Text.AlignHCenter
            verticalAlignment: Text.AlignVCenter
            color: !root.checked ? "#ffffff" : Theme.textDark
            font.bold: true
            font.family: Theme.paragraphOneFamily !== undefined ? Theme.paragraphOneFamily : "Open Sans"
        }

        Text {
            Layout.preferredWidth: parent.width / 2
            Layout.fillHeight: true
            text: root.rightText
            horizontalAlignment: Text.AlignHCenter
            verticalAlignment: Text.AlignVCenter
            color: root.checked ? "#ffffff" : Theme.textDark
            font.bold: true
            font.family: Theme.paragraphOneFamily !== undefined ? Theme.paragraphOneFamily : "Open Sans"
        }
    }
}
