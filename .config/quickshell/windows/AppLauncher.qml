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
            projectsProc.running = true;
        }
    }

    function launchApp(execCmd) {
        var p = Qt.createQmlObject('import Quickshell.Io; Process {}', appLauncher);
        p.command = ["bash", "-c", execCmd];
        p.startDetached();
        appLauncher.visible = false;
    }

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: Theme.spacingSixteen
        spacing: Theme.spacingSixteen

        RowLayout {
            Layout.fillWidth: true

            Rectangle {
                anchors.fill: parent
                color: Qt.alpha(Theme.primaryBackground, Theme.primaryAlpha)
                radius: Theme.primaryRadius
                // border.color: Theme.primaryBorderColor
            }

            Components.IconButton {
                icon: "magnifying-glass-duotone.svg"
                size: 32
                isButton: false
            }

            TextField {
                id: searchInput
                focus: true
                Layout.fillWidth: true
                placeholderText: "Type to search..."
                color: Theme.textDark
                font.family: Theme.paragraphTwoFamily
                font.pixelSize: Theme.paragraphTwoSize
                font.weight: Theme.paragraphTwoWeight
                background: Rectangle {
                    color: "transparent"
                }
                topPadding: Theme.spacingEight
                bottomPadding: Theme.spacingEight
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
        }

        ColumnLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            visible: searchInput.text.length === 0
            spacing: 15

            RowLayout {
                Layout.fillWidth: true

                Text {
                    text: "Recent projects"
                    color: Theme.textDark
                    font.family: Theme.headingTwoFamily !== undefined ? Theme.headingTwoFamily : "Open Sans"
                    font.pixelSize: 36
                    font.weight: Theme.headingTwoWeight !== undefined ? Theme.headingTwoWeight : 300
                    Layout.fillWidth: true
                }

                Components.IconButton {
                    icon: "arrow-right-duotone.svg"
                    size: 32
                }
            }

            ListView {
                id: projectList
                Layout.fillWidth: true
                Layout.fillHeight: true
                orientation: ListView.Horizontal
                spacing: 15
                clip: true
                model: ListModel {
                    id: projectModel
                }

                delegate: Rectangle {
                    width: 220
                    height: ListView.view.height
                    color: "transparent"

                    Rectangle {
                        anchors.fill: parent
                        color: Qt.alpha(Theme.secondaryBackground, Theme.secondaryAlpha)
                        radius: Theme.secondaryRadius
                        border.color: projMouse.containsMouse ? "#d74141" : "transparent"
                        border.width: 1

                        MouseArea {
                            id: projMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: launchApp("xdg-open '" + model.path + "'")
                        }

                        ColumnLayout {
                            anchors.fill: parent
                            spacing: 0

                            Item {
                                Layout.fillWidth: true
                                Layout.preferredHeight: parent.height * 0.65

                                Image {
                                    id: thumb
                                    anchors.fill: parent
                                    anchors.margins: 10
                                    source: model.file_type && model.file_type.indexOf("image") !== -1 ? "file://" + model.path + "?m=" + Date.now() : (model.icon ? "image://icon/" + model.icon : "image://icon/text-x-generic")
                                    onStatusChanged: {
                                        if (status === Image.Error) {
                                            source = "image://icon/text-x-generic";
                                        }
                                    }
                                    fillMode: Image.PreserveAspectCrop
                                    clip: true
                                    asynchronous: true
                                    cache: false
                                    sourceSize: Qt.size(300, 300)
                                }

                                Image {
                                    source: model.icon ? "image://icon/" + model.icon : ""
                                    onStatusChanged: {
                                        if (status === Image.Error) {
                                            source = "image://icon/application-x-executable";
                                        }
                                    }
                                    width: 24
                                    height: 24
                                    anchors.top: parent.top
                                    anchors.left: parent.left
                                    anchors.margins: 15
                                }
                            }

                            Item {
                                Layout.fillWidth: true
                                Layout.fillHeight: true

                                ColumnLayout {
                                    anchors.fill: parent
                                    anchors.margins: 10
                                    spacing: 5

                                    Text {
                                        text: model.name
                                        color: Theme.textDark
                                        font.family: Theme.paragraphOneFamily !== undefined ? Theme.paragraphOneFamily : "Open Sans"
                                        font.pixelSize: 20
                                        font.weight: Theme.paragraphOneWeight !== undefined ? Theme.paragraphOneWeight : 400
                                        Layout.fillWidth: true
                                        elide: Text.ElideRight
                                    }

                                    RowLayout {
                                        Layout.fillWidth: true
                                        spacing: 8

                                        Rectangle {
                                            color: Qt.rgba(215 / 255, 65 / 255, 65 / 255, 0.15)
                                            border.color: "#d74141"
                                            radius: 12
                                            Layout.preferredWidth: timeText.width + 16
                                            Layout.preferredHeight: 24

                                            Text {
                                                id: timeText
                                                text: model.time ? model.time : ""
                                                color: "#d74141"
                                                font.pixelSize: 12
                                                anchors.centerIn: parent
                                            }
                                        }

                                        Rectangle {
                                            color: Qt.rgba(138 / 255, 43 / 255, 226 / 255, 0.15)
                                            border.color: "#8a2be2"
                                            radius: 12
                                            Layout.preferredWidth: typeText.width + 16
                                            Layout.preferredHeight: 24

                                            Text {
                                                id: typeText
                                                text: model.file_type ? model.file_type : ""
                                                color: "#8a2be2"
                                                font.pixelSize: 12
                                                anchors.centerIn: parent
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

        ListView {
            id: list
            Layout.fillWidth: true
            Layout.fillHeight: true
            visible: searchInput.text.length > 0
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
                    color: del.hovered ? Qt.alpha(Theme.secondaryBackground, Theme.secondaryAlpha) : "transparent"
                    radius: Theme.secondaryRadius
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
                        asynchronous: true
                        cache: false
                    }
                    Text {
                        text: model.name
                        color: Theme.textDark
                        font.family: Theme.paragraphOneFamily !== undefined ? Theme.paragraphOneFamily : "Open Sans"
                        font.pixelSize: Theme.paragraphOneSize !== undefined ? Theme.paragraphOneSize : 16
                        font.weight: Theme.paragraphOneWeight !== undefined ? Theme.paragraphOneWeight : 400
                        anchors.verticalCenter: parent.verticalCenter
                    }
                }

                onClicked: launchApp(model.exec)
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

    Process {
        id: projectsProc
        command: ["python3", Quickshell.shellDir + "/scripts/get_projects.py"]
        running: true
        stdout: SplitParser {
            onRead: data => {
                try {
                    var arr = JSON.parse(data);
                    projectModel.clear();
                    for (var i = 0; i < arr.length; i++) {
                        projectModel.append(arr[i]);
                    }
                } catch (e) {
                    console.log("Error parsing projects JSON:", e);
                }
            }
        }
    }
}
