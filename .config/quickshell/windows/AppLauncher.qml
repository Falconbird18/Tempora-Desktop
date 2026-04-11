import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import Quickshell.Hyprland
import "../components" as Components
import "../"

PanelWindow {
    id: appLauncher
    implicitWidth: 700
    implicitHeight: 500
    color: "transparent"
    visible: false

    focusable: visible
    exclusionMode: ExclusionMode.Ignore

    anchors {
        top: true
    }
    margins {
        top: 250
    }

    property var allApps: []

    GlobalShortcut {
        name: "toggle-launcher"
        description: "Toggle app launcher"

        onPressed: {
            appLauncher.toggle();
        }
    }

    function toggle() {
        visible = !visible;
        if (visible) {
            searchInput.forceActiveFocus();
            searchInput.text = "";
        }
    }

    function launchApp(execCmd) {
        var p = Qt.createQmlObject('import Quickshell.Io; Process {}', appLauncher);
        p.command = ["bash", "-c", execCmd];
        p.startDetached();
        appLauncher.visible = false;
    }

    Rectangle {
        anchors.fill: parent
        color: Qt.alpha(Theme.primaryBackground, Theme.primaryAlpha)
        border.color: "#4c566a"
        border.width: 2
        radius: 8

        focus: true
        Keys.onEscapePressed: appLauncher.visible = false
        onActiveFocusChanged: {
            if (!activeFocus && appLauncher.visible) {
                appLauncher.visible = false;
            }
        }

        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 15
            spacing: 10

            Text {
                text: "Applications"
                color: "#eceff4"
                font.pointSize: 16
                font.bold: true
            }

            Rectangle {
                Layout.fillWidth: true
                height: 1
                color: "#4c566a"
            }

            TextField {
                id: searchInput
                focus: true
                Layout.fillWidth: true
                placeholderText: "Search apps..."
                color: "#eceff4"
                font.pixelSize: 14
                background: Rectangle {
                    color: "#3b4252"
                    radius: 5
                    border.color: searchInput.activeFocus ? "#88c0d0" : "transparent"
                    border.width: 1
                }
                onTextChanged: {
                    appModel.clear();
                    var term = text.toLowerCase();
                    for (var i = 0; i < appLauncher.allApps.length; i++) {
                        if (appLauncher.allApps[i].name.toLowerCase().indexOf(term) !== -1) {
                            appModel.append(appLauncher.allApps[i]);
                        }
                    }
                }
                Keys.onReturnPressed: {
                    if (appModel.count > 0) {
                        launchApp(appModel.get(0).exec);
                    }
                }
            }

            ListView {
                id: list
                Layout.fillWidth: true
                Layout.fillHeight: true
                model: ListModel {
                    id: appModel
                }
                clip: true
                spacing: 4

                delegate: ItemDelegate {
                    id: del
                    width: ListView.view.width
                    height: 48

                    background: Rectangle {
                        color: del.hovered ? "#4c566a" : "transparent"
                        radius: 6
                    }

                    contentItem: Row {
                        spacing: 12
                        Image {
                            source: model.icon ? (model.icon.startsWith("/") ? "file://" + model.icon : "image://icon/" + model.icon) : ""
                            sourceSize: Qt.size(28, 28)
                            anchors.verticalCenter: parent.verticalCenter

                            onStatusChanged: {
                                if (status === Image.Error) {
                                    source = "image://icon/application-x-executable";
                                }
                            }
                        }
                        Text {
                            text: model.name
                            color: "#eceff4"
                            font.pixelSize: 14
                            anchors.verticalCenter: parent.verticalCenter
                        }
                    }

                    onClicked: launchApp(model.exec)
                }
            }
        }
    }

    Process {
        id: proc
        command: ["python3", Quickshell.shellDir + "/scripts/list_apps.py"]
        running: true
        stdout: SplitParser {
            onRead: data => {
                var arr = JSON.parse(data);
                appLauncher.allApps = arr;
                for (var i = 0; i < arr.length; i++)
                    appModel.append(arr[i]);
            }
        }
    }
}
