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
        id: btModel
    }

    Process {
        id: scanProcess
        command: ["bluetoothctl", "devices"]
        stdout: SplitParser {
            onRead: (data) => {
                let line = data.trim();
                if (line === "")
                    return;

                // Format typically is "Device XX:XX:XX:XX:XX:XX Name of Device"
                if (line.startsWith("Device ")) {
                    let parts = line.split(" ");
                    if (parts.length >= 3) {
                        let mac = parts[1];
                        let name = parts.slice(2).join(" ");

                        // Check if already in model
                        let found = false;
                        for (let i = 0; i < btModel.count; i++) {
                            if (btModel.get(i).mac === mac) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            btModel.append({
                                "mac": mac,
                                "name": name
                            });
                        }
                    }
                }
            }
        }
    }

    Process {
        id: connectProcess
        property string mac: ""

        command: ["bluetoothctl", "connect", mac]

        onExited: (code) => {
            console.log("Bluetooth Connect exited with code: " + code);
            refresh();
        }
    }

    function refresh() {
        btModel.clear();
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
                text: "Bluetooth Devices"
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
                model: btModel
                spacing: 5
                delegate: Rectangle {
                    width: listView.width
                    height: 40
                    color: mouseArea.containsMouse ? "#434c5e" : "transparent"
                    radius: 4

                    RowLayout {
                        anchors.fill: parent
                        anchors.margins: 10
                        Text {
                            text: model.name
                            color: "#eceff4"
                            font.pointSize: 12
                            Layout.fillWidth: true
                        }
                        Text {
                            text: model.mac
                            color: "#d8dee9"
                            font.pointSize: 10
                        }
                    }

                    MouseArea {
                        id: mouseArea
                        anchors.fill: parent
                        hoverEnabled: true
                        onClicked: {
                            console.log("Clicked BT device:", model.name, "MAC:", model.mac);
                            connectProcess.mac = model.mac;
                            connectProcess.running = true;
                        }
                    }
                }
            }
        }
    }
}
