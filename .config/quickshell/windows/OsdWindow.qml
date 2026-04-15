import QtQuick
import "../"
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import Qt5Compat.GraphicalEffects

PanelWindow {
    id: osdWindow
    color: "transparent"
    visible: false

    exclusionMode: ExclusionMode.Ignore

    anchors {
        bottom: true
    }

    margins {
        bottom: 100
    }

    implicitWidth: 320
    implicitHeight: 60

    property string osdType: "volume"
    property int osdValue: 50
    property bool osdMuted: false

    Timer {
        id: hideTimer
        interval: 2000
        repeat: false
        onTriggered: {
            osdWindow.visible = false;
        }
    }

    function showOsd(type, value, muted) {
        osdType = type;
        osdValue = value;
        osdMuted = muted;
        osdWindow.visible = true;
        hideTimer.restart();
    }

    Rectangle {
        anchors.fill: parent
        color: Qt.alpha(Theme.primaryBackground, Theme.primaryAlpha)
        radius: Theme.primaryRadius

        RowLayout {
            anchors.fill: parent
            anchors.margins: 15
            anchors.leftMargin: 20
            anchors.rightMargin: 20
            spacing: 15

            Image {
                id: iconImage
                sourceSize.width: Theme.headingFourSize
                sourceSize.height: Theme.headingFourSize
                Layout.alignment: Qt.AlignVCenter

                layer.enabled: true
                layer.effect: ColorOverlay {
                    color: Theme.textDark
                }

                source: {
                    if (osdType === "volume") {
                        if (osdMuted || osdValue === 0)
                            return "file:///usr/share/icons/breeze/status/24/audio-volume-muted.svg";
                        if (osdValue < 30)
                            return "file:///usr/share/icons/breeze/status/24/audio-volume-low.svg";
                        if (osdValue < 70)
                            return "file:///usr/share/icons/breeze/status/24/audio-volume-medium.svg";
                        return "file:///usr/share/icons/breeze/status/24/audio-volume-high.svg";
                    } else {
                        // Fallback generic icons since breeze lacks specific display brightness ones
                        if (osdValue < 30)
                            return "file:///usr/share/icons/Pop/scalable/status/display-brightness-low-symbolic.svg";
                        if (osdValue < 70)
                            return "file:///usr/share/icons/Pop/scalable/status/display-brightness-medium-symbolic.svg";
                        return "file:///usr/share/icons/Pop/scalable/status/display-brightness-high-symbolic.svg";
                    }
                }

                onStatusChanged: {
                    if (status === Image.Error) {
                        if (osdType === "brightness") {
                            source = "image://icon/preferences-desktop-display";
                        } else if (osdType === "volume") {
                            source = "image://icon/audio-card";
                        }
                    }
                }
            }

            ProgressBar {
                id: progressBar
                Layout.fillWidth: true
                Layout.alignment: Qt.AlignVCenter
                from: 0
                to: 100
                value: osdValue

                background: Rectangle {
                    implicitWidth: 150
                    implicitHeight: 8
                    color: Theme.secondaryBackground
                    radius: Theme.secondaryRadius
                }

                contentItem: Item {
                    implicitWidth: 150
                    implicitHeight: 8

                    Rectangle {
                        width: progressBar.visualPosition * parent.width
                        height: parent.height
                        color: osdType === "volume" ? Theme.primary : "#ebcb8b"
                        radius: 4
                    }
                }
            }

            Text {
                text: osdValue + "%"
                color: Theme.textDark
                font.family: Theme.paragraphOneFamily !== undefined ? Theme.paragraphOneFamily : "Open Sans"
                font.pixelSize: Theme.paragraphOneSize !== undefined ? Theme.paragraphOneSize : 16
                font.weight: Theme.paragraphOneWeight !== undefined ? Theme.paragraphOneWeight : 400
                Layout.alignment: Qt.AlignVCenter
                Layout.minimumWidth: 40
                horizontalAlignment: Text.AlignRight
            }
        }
    }

    Process {
        id: osdDaemon
        command: ["python3", Quickshell.shellDir + "/scripts/osd_daemon.py"]
        running: true
        stdout: SplitParser {
            onRead: data => {
                try {
                    var obj = JSON.parse(data);
                    if (obj.type && obj.value !== undefined) {
                        osdWindow.showOsd(obj.type, obj.value, obj.muted);
                    }
                } catch (e) {
                    console.log("OSD Parse error:", e);
                }
            }
        }
    }
}
