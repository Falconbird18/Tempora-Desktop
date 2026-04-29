import QtQuick
import "../"
import "../components"
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
        bottom: Helpers.heightPercent(9.27)
    }

    implicitWidth: Theme.spacingSixtyFour * 5
    implicitHeight: Theme.spacingSixtyFour

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
        border.color: Theme.primaryBorderColor
        border.width: Theme.primaryBorderWidth

        RowLayout {
            anchors.fill: parent
            anchors.margins: Theme.spacingSixteen
            anchors.leftMargin: Theme.spacingSixteen
            anchors.rightMargin: Theme.spacingSixteen
            spacing: Theme.spacingSixteen

            IconButton {
                id: iconButton
                size: Theme.headingFourSize
                isButton: false
                icons: ({
                        "muted": "speaker-x-duotone",
                        "low": "speaker-none-duotone",
                        "medium": "speaker-low-duotone",
                        "high": "speaker-high-duotone",
                        "dim": "sun-dim-duotone",
                        "bright": "sun-duotone"
                    })
                currentState: (function () {
                        if (osdType === "volume") {
                            if (osdMuted || osdValue === 0)
                                return "muted";
                            else if (osdValue < 30)
                                return "low";
                            else if (osdValue < 60)
                                return "medium";
                            else
                                return "high";
                        } else {
                            if (osdValue < 50)
                                return "dim";
                            else
                                return "bright";
                        }
                    })()
            }

            ProgressBar {
                id: progressBar
                Layout.fillWidth: true
                Layout.alignment: Qt.AlignVCenter
                from: 0
                to: 100
                value: osdValue

                background: Rectangle {
                    implicitWidth: Theme.spacingSixtyFour * 5
                    implicitHeight: Theme.spacingSixteen
                    color: Theme.secondaryBackground
                    radius: Theme.secondaryRadius
                }

                contentItem: Item {
                    implicitWidth: Theme.spacingSixtyFour * 5
                    implicitHeight: Theme.spacingSixteen

                    Rectangle {
                        width: progressBar.visualPosition * parent.width
                        height: parent.height
                        color: osdType === "volume" ? Theme.primary : Theme.yellow
                        radius: Theme.secondaryRadius
                    }
                }
            }

            Text {
                text: osdValue + "%"
                color: Theme.textDark
                font.family: Theme.paragraphOneFamily
                font.pixelSize: Theme.paragraphOneSize
                font.weight: Theme.paragraphOneWeight
                Layout.alignment: Qt.AlignVCenter
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
