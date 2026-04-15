import QtQuick
import Quickshell
import Quickshell.Services.Mpris
import "../components" as Components
import "../"

PanelWindow {
    id: mediaController
    visible: false
    implicitWidth: 350
    implicitHeight: 120
    color: "transparent"
    exclusionMode: ExclusionMode.Ignore

    anchors {
        top: true
        left: true
    }

    property int xOffset: 0
    property int yOffset: 40

    margins {
        top: yOffset
        left: xOffset
    }

    property var player: Mpris.players.values && Mpris.players.values.length > 0 ? Mpris.players.values[0] : null

    function toggle(x, y) {
        if (visible) {
            visible = false;
        } else {
            xOffset = x;
            yOffset = y;
            visible = true;
        }
    }

    Rectangle {
        anchors.fill: parent
        color: Qt.alpha(Theme.secondaryBackground, Theme.secondaryAlpha)
        radius: Theme.primaryRadius
        border.color: Qt.alpha(Theme.tertiaryBackground, 0.5)
        border.width: 1

        Row {
            anchors.fill: parent
            anchors.margins: 10
            spacing: 15

            // Album Art
            Rectangle {
                width: 100
                height: 100
                radius: Theme.primaryRadius
                color: Qt.alpha(Theme.tertiaryBackground, Theme.tertiaryAlpha)
                clip: true
                anchors.verticalCenter: parent.verticalCenter

                Image {
                    anchors.fill: parent
                    source: mediaController.player && mediaController.player.trackArtUrl ? mediaController.player.trackArtUrl : ""
                    fillMode: Image.PreserveAspectCrop
                    asynchronous: true
                }

                // Fallback icon if no art
                Text {
                    anchors.centerIn: parent
                    text: "🎵"
                    font.pointSize: 24
                    visible: !parent.children[0].status === Image.Ready
                }
            }

            // Controls & Info
            Column {
                width: parent.width - 125
                height: parent.height
                spacing: 8
                anchors.verticalCenter: parent.verticalCenter

                Item {
                    width: parent.width
                    height: 40

                    Column {
                        anchors.fill: parent
                        spacing: 2

                        Text {
                            text: mediaController.player && mediaController.player.trackTitle ? mediaController.player.trackTitle : "No Media Playing"
                            color: Theme.textDark
                            font.bold: true
                            font.pointSize: 11
                            elide: Text.ElideRight
                            width: parent.width
                        }

                        Text {
                            text: mediaController.player && mediaController.player.trackArtist ? mediaController.player.trackArtist : "Unknown Artist"
                            color: Qt.alpha(Theme.textDark, 0.7)
                            font.pointSize: 9
                            elide: Text.ElideRight
                            width: parent.width
                        }
                    }
                }

                Row {
                    spacing: 10
                    anchors.horizontalCenter: parent.horizontalCenter

                    Components.Button {
                        text: "⏮"
                        width: 30
                        height: 30
                        onClicked: if (mediaController.player)
                            mediaController.player.previous()
                    }

                    Components.Button {
                        text: mediaController.player && mediaController.player.isPlaying ? "⏸" : "▶"
                        width: 40
                        height: 30
                        onClicked: if (mediaController.player)
                            mediaController.player.togglePlaying()
                    }

                    Components.Button {
                        text: "⏭"
                        width: 30
                        height: 30
                        onClicked: if (mediaController.player)
                            mediaController.player.next()
                    }
                }

                // Progress Bar
                Rectangle {
                    width: parent.width
                    height: 8
                    color: Qt.alpha(Theme.tertiaryBackground, Theme.tertiaryAlpha)
                    radius: 4
                    anchors.horizontalCenter: parent.horizontalCenter

                    Rectangle {
                        width: mediaController.player && mediaController.player.length > 0 ? Math.min((mediaController.player.position / mediaController.player.length) * parent.width, parent.width) : 0
                        height: parent.height
                        color: Theme.primary
                        radius: 4
                    }

                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: mouse => {
                            if (mediaController.player && mediaController.player.length > 0) {
                                mediaController.player.position = (mouse.x / width) * mediaController.player.length;
                            }
                        }
                    }
                }
            }
        }
    }
}
