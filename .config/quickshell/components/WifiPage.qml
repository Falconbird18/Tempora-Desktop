import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import "../"
import "." as Components

Item {
    id: root
    signal backRequested()
    property var authPromptRef

    ListModel {
        id: wifiModel
    }

    Process {
        id: scanProcess
        command: ["nmcli", "-t", "-f", "SSID,SECURITY,SIGNAL,ACTIVE", "dev", "wifi"]
        stdout: SplitParser {
            onRead: (data) => {
                let line = data.trim();
                if (line === "")
                    return;

                let parts = line.split(":");
                if (parts.length >= 4) {
                    let ssid = parts[0];
                    let security = parts[1];
                    let signal = parts[2];
                    let active = parts[3] === "yes";
                    if (ssid !== "") {
                        // Check if already in model
                        let found = false;
                        for (let i = 0; i < wifiModel.count; i++) {
                            if (wifiModel.get(i).ssid === ssid) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            wifiModel.append({
                                "ssid": ssid,
                                "security": security,
                                "signal": signal,
                                "active": active
                            });
                        }
                    }
                }
            }
        }
    }

    Process {
        id: connectProcess
        property string ssid: ""
        property string password: ""

        command: {
            if (password === "") {
                return ["nmcli", "dev", "wifi", "connect", ssid];
            } else {
                return ["nmcli", "dev", "wifi", "connect", ssid, "password", password];
            }
        }

        onExited: (code) => {
            console.log("Connect exited with code: " + code);
            refresh();
        }
    }

    function refresh() {
        wifiModel.clear();
        scanProcess.running = true;
    }

    Component.onCompleted: {
        refresh();
    }

    ColumnLayout {
        anchors.fill: parent
        spacing: 10

        RowLayout {
            Layout.fillWidth: true
            Components.Button {
                text: "< Back"
                onClicked: root.backRequested()
            }
            Text {
                text: "Wi-Fi Networks"
                color: "#eceff4"
                font.pointSize: 14
                font.bold: true
                Layout.fillWidth: true
                horizontalAlignment: Text.AlignRight
            }
        }

        Rectangle {
            Layout.fillWidth: true
            height: 1
            color: "#4c566a"
        }

        ScrollView {
            Layout.fillWidth: true
            Layout.fillHeight: true
            clip: true

            ListView {
                id: listView
                model: wifiModel
                spacing: 5
                delegate: Rectangle {
                    width: listView.width
                    height: 40
                    color: model.active ? "#3b4252" : (mouseArea.containsMouse ? "#434c5e" : "transparent")
                    radius: 4

                    RowLayout {
                        anchors.fill: parent
                        anchors.margins: 10
                        Text {
                            text: model.ssid
                            color: model.active ? "#a3be8c" : "#eceff4"
                            font.pointSize: 12
                            Layout.fillWidth: true
                        }
                        Text {
                            text: model.security === "" || model.security === "--" ? "Open" : "Secured"
                            color: "#d8dee9"
                            font.pointSize: 10
                        }
                        Text {
                            text: model.signal + "%"
                            color: "#d8dee9"
                            font.pointSize: 10
                        }
                    }

                    MouseArea {
                        id: mouseArea
                        anchors.fill: parent
                        hoverEnabled: true
                        onClicked: {
                            console.log("Clicked network:", model.ssid, "Active:", model.active, "Security:", model.security);
                            if (!model.active) {
                                if (model.security === "" || model.security === "--") {
                                    console.log("Connecting to open network:", model.ssid);
                                    connectProcess.ssid = model.ssid;
                                    connectProcess.password = "";
                                    connectProcess.running = true;
                                } else {
                                    console.log("Connecting to secured network. Auth prompt ref:", root.authPromptRef);
                                    if (root.authPromptRef) {
                                        root.authPromptRef.requestAuth("Password for " + model.ssid, function (pwd) {
                                            console.log("Password entered for", model.ssid);
                                            connectProcess.ssid = model.ssid;
                                            connectProcess.password = pwd;
                                            connectProcess.running = true;
                                        }, function () {
                                            console.log("Auth cancelled");
                                        });
                                    } else {
                                        console.error("Auth prompt reference is missing!");
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
