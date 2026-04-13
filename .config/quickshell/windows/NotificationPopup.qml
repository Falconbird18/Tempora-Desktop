import QtQuick
import QtQuick.Layouts
import Quickshell
import Quickshell.Wayland
import Quickshell.Services.Notifications

PanelWindow {
    id: root

    anchors {
        top: true
        right: true
    }

    margins {
        top: 60
        right: 10
    }

    color: "transparent"

    implicitWidth: 350
    implicitHeight: notificationList.count > 0 ? Math.min(notificationList.contentHeight, 800) : 0

    NotificationServer {
        id: server

        onNotification: notification => {
            notification.tracked = true;
        }
    }

    // Notifications List
    ListView {
        id: notificationList
        anchors.fill: parent
        spacing: 10
        model: server.trackedNotifications

        delegate: Rectangle {
            width: ListView.view.width
            height: layout.implicitHeight + 24
            color: "#1e1e2e" // dark theme background
            radius: 12
            border.color: "#cba6f7" // accent color
            border.width: 1

            // Notification close timer (optional auto-dismiss after 5 seconds)
            Timer {
                interval: modelData.expireTimeout > 0 ? modelData.expireTimeout : 5000
                running: true
                onTriggered: modelData.dismiss()
            }

            RowLayout {
                id: layout
                anchors.fill: parent
                anchors.margins: 12
                spacing: 12

                // Icon
                Image {
                    source: modelData.appIcon !== "" ? modelData.appIcon : "image://icon/dialog-information"
                    Layout.preferredWidth: 48
                    Layout.preferredHeight: 48
                    fillMode: Image.PreserveAspectCrop
                }

                // Text Content
                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: 4

                    Text {
                        text: modelData.appName || "Notification"
                        font.pixelSize: 12
                        color: "#a6adc8"
                        font.bold: true
                    }

                    Text {
                        text: modelData.summary
                        font.pixelSize: 14
                        color: "#cdd6f4"
                        font.bold: true
                        wrapMode: Text.Wrap
                        Layout.fillWidth: true
                    }

                    Text {
                        text: modelData.body
                        font.pixelSize: 13
                        color: "#bac2de"
                        wrapMode: Text.Wrap
                        Layout.fillWidth: true
                        visible: text !== ""
                    }
                }

                // Close button
                Rectangle {
                    Layout.alignment: Qt.AlignTop | Qt.AlignRight
                    width: 24
                    height: 24
                    color: "transparent"
                    radius: 12

                    Text {
                        anchors.centerIn: parent
                        text: "×"
                        color: "#f38ba8"
                        font.pixelSize: 20
                    }

                    MouseArea {
                        anchors.fill: parent
                        onClicked: modelData.dismiss()
                    }
                }
            }
        }

        // Animations
        add: Transition {
            NumberAnimation {
                property: "opacity"
                from: 0
                to: 1
                duration: 200
            }
            NumberAnimation {
                property: "x"
                from: 50
                to: 0
                duration: 200
                easing.type: Easing.OutCubic
            }
        }
        remove: Transition {
            NumberAnimation {
                property: "opacity"
                to: 0
                duration: 200
            }
            NumberAnimation {
                property: "scale"
                to: 0.8
                duration: 200
            }
        }
    }
}
