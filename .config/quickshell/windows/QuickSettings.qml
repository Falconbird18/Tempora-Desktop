import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import Quickshell.Hyprland
import "../components" as Components
import "../"

PanelWindow {
    id: quickSettings
    implicitWidth: 350
    implicitHeight: 250
    color: "transparent"
    visible: false

    property var authPromptRef

    focusable: visible
    exclusionMode: ExclusionMode.Ignore

    anchors {
        top: true
        right: true
    }
    margins {
        top: 40
        right: 10
    }

    GlobalShortcut {
        name: "toggle-quick-settings"
        description: "Toggle quick settings"
        onPressed: quickSettings.toggle()
    }

    function toggle() {
        visible = !visible;
        if (visible) {
            mainRect.forceActiveFocus();
        }
    }

    FocusScope {
        id: mainRect
        anchors.fill: parent
        focus: true
        Keys.onEscapePressed: quickSettings.visible = false

        onActiveFocusChanged: {
            if (!activeFocus && quickSettings.visible) {
                quickSettings.visible = false;
            }
        }

        Rectangle {
            anchors.fill: parent
            color: Qt.alpha(Theme.primaryBackground, Theme.primaryAlpha)
            radius: Theme.secondaryRadius
        }

        ColumnLayout {
            id: mainView
            anchors.fill: parent
            anchors.margins: 15
            spacing: 10
            visible: true

            Text {
                text: "Quick Settings"
                color: Theme.textDark
                font.family: Theme.headingTwoFamily
                font.pixelSize: Theme.headingTwoSize
                font.weight: Theme.headingTwoWeight
                font.bold: true
            }

            Rectangle {
                Layout.fillWidth: true
                height: 1
                color: "#4c566a"
            }

            RowLayout {
                Layout.fillWidth: true
                spacing: 15

                Components.Button {
                    text: "Wi-Fi"
                    Layout.fillWidth: true
                    onClicked: {
                        console.log("Wi-Fi button clicked!");
                        mainView.visible = false;
                        wifiPage.visible = true;
                        wifiPage.refresh();
                    }
                }

                Components.Button {
                    text: "Bluetooth"
                    Layout.fillWidth: true
                    onClicked: {
                        console.log("Bluetooth button clicked!");
                        mainView.visible = false;
                        bluetoothPage.visible = true;
                        bluetoothPage.refresh();
                    }
                }
            }

            RowLayout {
                Layout.fillWidth: true
                spacing: 15

                Components.Button {
                    text: "Audio"
                    Layout.fillWidth: true
                }

                Components.Button {
                    text: "Display"
                    Layout.fillWidth: true
                }
            }

            Item {
                Layout.fillHeight: true
            }
        }

        Components.WifiPage {
            id: wifiPage
            authPromptRef: quickSettings.authPromptRef
            anchors.fill: parent
            anchors.margins: 15
            visible: false
            onBackRequested: {
                wifiPage.visible = false;
                mainView.visible = true;
            }
        }

        Components.BluetoothPage {
            id: bluetoothPage
            authPromptRef: quickSettings.authPromptRef
            anchors.fill: parent
            anchors.margins: 15
            visible: false
            onBackRequested: {
                bluetoothPage.visible = false;
                mainView.visible = true;
            }
        }
    }
}
