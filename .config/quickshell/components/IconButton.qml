import QtQuick
import QtQuick.Controls.Basic
import "../"

Item {
    id: root

    // Properties to easily configure the icon, fallback, and size
    property string icon: ""
    property string fallbackIcon: "dialog-information"
    property int size: 24

    // Toggle whether this acts as a button or just an image
    property bool isButton: true

    signal clicked

    implicitWidth: size
    implicitHeight: size

    Image {
        id: img
        anchors.fill: parent

        // Use Helpers to resolve the icon path
        source: Helpers.iconOrFallback(root.icon, "", root.fallbackIcon)
        sourceSize.width: root.size
        sourceSize.height: root.size
        fillMode: Image.PreserveAspectFit

        // Simple visual feedback when pressed
        opacity: root.isButton && mouseArea.pressed ? 0.7 : 1.0

        Behavior on opacity {
            NumberAnimation {
                duration: 100
            }
        }
    }

    MouseArea {
        id: mouseArea
        anchors.fill: parent
        enabled: root.isButton

        // Show pointer cursor only if it's acting as a button
        cursorShape: root.isButton ? Qt.PointingHandCursor : Qt.ArrowCursor

        onClicked: root.clicked()
    }
}
