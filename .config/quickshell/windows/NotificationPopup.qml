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
    implicitHeight: Math.min(notificationColumn.implicitHeight, 800)
    visible: server.trackedNotifications.length > 0

    NotificationServer {
        id: server

        onNotification: notification => {
            console.log("Notification received: appName=", notification.appName, "summary=", notification.summary, "body=", notification.body, "appIcon=", notification.appIcon, "expireTimeout=", notification.expireTimeout);
            notification.tracked = true;
        }
    }

    Flickable {
        id: flickable
        anchors.fill: parent
        contentHeight: notificationColumn.implicitHeight
        clip: true

        Column {
            id: notificationColumn
            width: flickable.width
            spacing: 10

            Repeater {
                model: server.trackedNotifications

                delegate: Rectangle {
                    width: notificationColumn.width
                    height: layout.implicitHeight + 24
                    color: "#1e1e2e" // dark theme background
                    radius: 12
                    border.color: "#cba6f7" // accent color
                    border.width: 1

                    // Notification close timer (optional auto-dismiss after 5 seconds)
                    Timer {
                        interval: modelData.expireTimeout > 0 ? modelData.expireTimeout : 5000
                        running: modelData.expireTimeout !== 0
                        onTriggered: modelData.dismiss()
                    }

                    RowLayout {
                        id: layout
                        anchors.left: parent.left
                        anchors.right: parent.right
                        anchors.top: parent.top
                        anchors.margins: 12
                        spacing: 12

                        // Icon
                        Image {
                            source: {
                                if (modelData.image)
                                    return modelData.image;
                                if (!modelData.appIcon)
                                    return "image://icon/dialog-information";
                                if (modelData.appIcon.startsWith("file://") || modelData.appIcon.startsWith("qrc://") || modelData.appIcon.startsWith("image://"))
                                    return modelData.appIcon;
                                if (modelData.appIcon.startsWith("/"))
                                    return "file://" + modelData.appIcon;
                                return "image://icon/" + modelData.appIcon;
                            }
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
            }
        }
    }
}
