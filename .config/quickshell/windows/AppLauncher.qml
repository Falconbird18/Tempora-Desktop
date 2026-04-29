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
    implicitWidth: Theme.spacingSixtyFour * 12
    implicitHeight: Theme.spacingSixtyFour * 8
    color: "transparent"
    visible: false

    focusable: visible
    exclusionMode: ExclusionMode.Ignore

    anchors {
        top: true
    }
    margins {
        top: Helpers.heightPercent(38.2, appLauncher) // Golden ratio for vertical placement
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
        spacing: Theme.spacingSixteen

        RowLayout {
            Layout.fillWidth: true
            height: Theme.spacingSixtyFour
            spacing: Theme.spacingSixteen

            Rectangle {
                anchors.fill: parent
                color: Qt.alpha(Theme.primaryBackground, Theme.primaryAlpha)
                radius: Theme.primaryRadius
                border.color: Theme.primaryBorderColor
                border.width: Theme.primaryBorderWidth
            }

            Components.IconButton {
                icon: "magnifying-glass-duotone.svg"
                size: Theme.iconSize
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

        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            visible: searchInput.text.length === 0
            color: Qt.alpha(Theme.primaryBackground, Theme.primaryAlpha)
            radius: Theme.primaryRadius
            border.color: Theme.primaryBorderColor
            border.width: Theme.primaryBorderWidth

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: Theme.spacingSixteen
                spacing: Theme.spacingSixteen

                RowLayout {
                    Layout.fillWidth: true
                    spacing: Theme.spacingSixteen

                    Text {
                        text: "Recent projects"
                        color: Theme.textDark
                        font.family: Theme.headingTwoFamily
                        font.pixelSize: Theme.headingTwoSize
                        font.weight: Theme.headingTwoWeight
                        Layout.fillWidth: true
                    }

                    Components.IconButton {
                        icon: "arrow-right-duotone.svg"
                        size: Theme.iconSize
                    }
                }

                ListView {
                    id: projectList
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    orientation: ListView.Horizontal
                    spacing: Theme.spacingSixteen
                    clip: true
                    model: ListModel {
                        id: projectModel
                    }

                    delegate: Rectangle {
                        width: (ListView.view.width - (Theme.spacingSixteen * 2)) / 3
                        height: ListView.view.height
                        color: "transparent"

                        Rectangle {
                            anchors.fill: parent
                            color: projMouse.containsMouse ? Qt.alpha(Theme.secondaryBackground, Theme.secondaryAlpha) : "transparent"
                            radius: Theme.secondaryRadius
                            border.color: projMouse.containsMouse ? Theme.secondary : "transparent"
                            border.width: Theme.primaryBorderWidth

                            MouseArea {
                                id: projMouse
                                anchors.fill: parent
                                hoverEnabled: true
                                cursorShape: Qt.PointingHandCursor
                                onClicked: launchApp(model.exec ? model.exec : "xdg-open '" + model.path + "'")
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
                                        anchors.margins: Theme.spacingSixteen
                                        source: model.thumb ? "file://" + model.thumb + "?m=" + Date.now() : (model.file_type && model.file_type.indexOf("image") !== -1 ? "file://" + model.path + "?m=" + Date.now() : (model.icon ? "image://icon/" + model.icon : "image://icon/text-x-generic"))
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
                                        width: Theme.iconSize
                                        height: Theme.iconSize
                                        anchors.top: parent.top
                                        anchors.left: parent.left
                                        anchors.margins: Theme.spacingSixteen
                                    }
                                }

                                Item {
                                    Layout.fillWidth: true
                                    Layout.fillHeight: true

                                    ColumnLayout {
                                        anchors.fill: parent
                                        anchors.margins: Theme.spacingSixteen
                                        spacing: Theme.spacingEight

                                        // Title
                                        Text {
                                            text: model.name
                                            color: Theme.textDark
                                            font.family: Theme.headingThreeFamily
                                            font.pixelSize: Theme.headingThreeSize
                                            font.weight: Theme.headingThreeWeight
                                            Layout.fillWidth: true
                                            elide: Text.ElideRight
                                        }

                                        RowLayout {
                                            Layout.fillWidth: true
                                            spacing: Theme.spacingEight

                                            Rectangle {
                                                color: Qt.alpha(Theme.secondary, Theme.paleAlpha)
                                                border.color: Theme.primary
                                                border.width: Theme.primaryBorderWidth
                                                radius: Theme.secondaryRadius
                                                Layout.preferredWidth: timeText.width + Theme.spacingSixteen
                                                Layout.preferredHeight: Theme.spacingThirtyTwo

                                                Text {
                                                    id: timeText
                                                    text: model.time ? model.time : ""
                                                    color: Theme.textDark
                                                    font.family: Theme.paragraphOneFamily
                                                    font.pixelSize: Theme.paragraphOneSize
                                                    font.weight: Theme.paragraphOneWeight
                                                    anchors.centerIn: parent
                                                }
                                            }

                                            Rectangle {
                                                color: Qt.alpha(Theme.primary, Theme.paleAlpha)
                                                border.color: Theme.primary
                                                border.width: Theme.primaryBorderWidth
                                                radius: Theme.secondaryRadius
                                                Layout.preferredWidth: typeText.width + Theme.spacingSixteen
                                                Layout.preferredHeight: Theme.spacingThirtyTwo

                                                Text {
                                                    id: typeText
                                                    text: model.file_type ? model.file_type : ""
                                                    color: Theme.textDark
                                                    font.family: Theme.paragraphOneFamily
                                                    font.pixelSize: Theme.paragraphOneSize
                                                    font.weight: Theme.paragraphOneWeight
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
        }

        Rectangle {
            id: list
            Layout.fillWidth: true
            Layout.fillHeight: true
            visible: searchInput.text.length > 0
            color: Qt.alpha(Theme.primaryBackground, Theme.primaryAlpha)
            radius: Theme.primaryRadius
            border.color: Theme.primaryBorderColor
            border.width: Theme.primaryBorderWidth

            ListView {
                anchors.fill: parent
                model: ListModel {
                    id: appModel
                }
                clip: true
                spacing: Theme.spacingEight

                delegate: ItemDelegate {
                    id: del
                    width: ListView.view.width
                    implicitHeight: Theme.spacingSixtyFour

                    background: Rectangle {
                        anchors.fill: parent
                        color: del.hovered ? Qt.alpha(Theme.secondaryBackground, Theme.secondaryAlpha) : "transparent"
                        radius: Theme.secondaryRadius
                    }

                    contentItem: Row {
                        anchors.fill: parent
                        anchors.margins: Theme.spacingSixteen
                        spacing: Theme.spacingSixteen

                        Image {
                            source: model.icon ? (model.icon.startsWith("/") ? "file://" + model.icon : "image://icon/" + model.icon) : ""
                            sourceSize: Qt.size(Theme.iconSize, Theme.iconSize)
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
                            font.family: Theme.paragraphOneFamily
                            font.pixelSize: Theme.paragraphOneSize
                            font.weight: Theme.paragraphOneWeight
                            anchors.verticalCenter: parent.verticalCenter
                            elide: Text.ElideRight
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
