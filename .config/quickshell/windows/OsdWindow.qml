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

    // Derive the user's home directory from Quickshell.shellDir when possible.
    // This avoids hardcoding /home/username. The heuristic looks for a leading
    // "/home/<user>" prefix inside Quickshell.shellDir (or file:// variant).
    property string userHome: (function () {
            try {
                var sd = "";
                if (typeof Quickshell !== "undefined" && Quickshell.shellDir) {
                    sd = Quickshell.shellDir.toString();
                } else {
                    // Fallback: try resolved URL of current QML file (may be qrc)
                    sd = Qt.resolvedUrl(".").toString();
                }

                // Remove file:// prefix if present
                if (sd.indexOf("file://") === 0) {
                    sd = sd.replace("file://", "");
                }

                // Normalize trailing slashes
                while (sd.length > 1 && sd.endsWith("/"))
                    sd = sd.slice(0, -1);

                var parts = sd.split("/");
                // parts[0] is "" for leading slash, so parts[1] === "home"
                if (parts.length >= 3 && parts[1] === "home") {
                    return "/" + parts[1] + "/" + parts[2];
                }

                // If not obvious, attempt to search for a /home/<user> segment
                for (var i = 0; i < parts.length - 1; ++i) {
                    if (parts[i] === "home" && (i + 1) < parts.length) {
                        return "/" + parts[i] + "/" + parts[i + 1];
                    }
                }
            } catch (e) {
                console.log("OsdWindow: userHome derivation error:", e);
            }
            return "";
        })()

    // Compute icon base dynamically. If userHome couldn't be derived, iconBase
    // will be empty and we fall back to image provider icons.
    property string iconBase: (function () {
            try {
                if (userHome && userHome.length > 0) {
                    return "file://" + userHome + "/.icons/phosphor-core/assets/duotone";
                }
                // As a last-ditch attempt, if Quickshell.shellDir exists and includes a home path,
                // try to synthesize one similarly (this is redundant with userHome but kept defensive).
                if (typeof Quickshell !== "undefined" && Quickshell.shellDir) {
                    var sd2 = Quickshell.shellDir.toString();
                    if (sd2.indexOf("file://") === 0)
                        sd2 = sd2.replace("file://", "");
                    var p2 = sd2.split("/");
                    if (p2.length >= 3 && p2[1] === "home")
                        return "file://" + "/" + p2[1] + "/" + p2[2] + "/.icons/phosphor-core/assets/duotone";
                }
            } catch (e) {
                console.log("OsdWindow: iconBase derivation error:", e);
            }
            return "";
        })()

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

                // layer.enabled: true
                // layer.effect: ColorOverlay {
                //     color: Theme.textDark
                // }

                source: {
                    var src = "";
                    // If iconBase is available, prefer the installed phosphor svg files,
                    // otherwise fall back to the platform image provider so we always have something.
                    var haveIconBase = (iconBase && iconBase.length > 0);

                    if (osdType === "volume") {
                        if (osdMuted || osdValue === 0) {
                            src = iconBase + "/speaker-x-duotone.svg";
                        } else if (osdValue < 30) {
                            src = iconBase + "/speaker-none-duotone.svg";
                        } else if (osdValue < 60) {
                            src = iconBase + "/speaker-low-duotone.svg";
                        } else {
                            src = iconBase + "/speaker-high-duotone.svg";
                        }
                    } else {
                        // For brightness, use system symbolic icons (these are usually available)
                        if (osdValue < 50)
                            src = iconBase + "/sun-dim-duotone.svg";
                        else
                            src = iconBase + "/sun-duotone.svg";
                    }
                    return src;
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
