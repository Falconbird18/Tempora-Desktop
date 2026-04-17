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
    implicitWidth: 380
    implicitHeight: 480
    color: "transparent"
    visible: false

    property var authPromptRef
    property var settingsWindowRef

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
            getVolume.running = true;
            getBrightness.running = true;
        }
    }

    Process {
        id: setVolume
        property int volumeTarget: 50
        command: ["wpctl", "set-volume", "@DEFAULT_AUDIO_SINK@", (volumeTarget / 100).toFixed(2)]
    }

    Process {
        id: getVolume
        command: ["sh", "-c", "wpctl get-volume @DEFAULT_AUDIO_SINK@ | awk '{print int($2 * 100)}'"]
        stdout: SplitParser {
            onRead: data => {
                let val = parseInt(data.trim());
                if (!isNaN(val)) {
                    volumeSlider.value = val;
                }
            }
        }
    }

    Process {
        id: setBrightness
        property int brightnessTarget: 50
        command: ["brightnessctl", "s", brightnessTarget + "%"]
    }

    Process {
        id: getBrightness
        command: ["sh", "-c", "brightnessctl -m | awk -F, '{print int($4)}'"]
        stdout: SplitParser {
            onRead: data => {
                let val = parseInt(data.trim());
                if (!isNaN(val)) {
                    brightnessSlider.value = val;
                }
            }
        }
    }

    Process {
        id: toggleCaffeineOn
        command: ["systemctl", "mask", "sleep.target", "suspend.target", "hibernate.target", "hybrid-sleep.target"]
    }

    Process {
        id: toggleCaffeineOff
        command: ["systemctl", "unmask", "sleep.target", "suspend.target", "hibernate.target", "hybrid-sleep.target"]
    }

    Process {
        id: toggleDnd
        command: ["dunstctl", "set-paused", "toggle"]
    }

    Process {
        id: nightLightOn
        command: ["gammastep", "-O", "4500"]
    }

    Process {
        id: nightLightOff
        command: ["pkill", "gammastep"]
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
            anchors.margins: 20
            spacing: 15
            visible: true

            RowLayout {
                Layout.fillWidth: true
                Text {
                    text: "Quick Settings"
                    color: Theme.textDark
                    font.family: Theme.headingTwoFamily !== undefined ? Theme.headingTwoFamily : "Open Sans"
                    font.pixelSize: Theme.headingTwoSize !== undefined ? Theme.headingTwoSize : 45
                    font.weight: Theme.headingTwoWeight !== undefined ? Theme.headingTwoWeight : 300
                    font.bold: true
                    Layout.fillWidth: true
                }

                Image {
                    source: "image://icon/preferences-system"
                    Layout.preferredWidth: 24
                    Layout.preferredHeight: 24
                    Layout.alignment: Qt.AlignVCenter

                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: {
                            console.log("Settings icon clicked! settingsWindowRef:", quickSettings.settingsWindowRef);
                            if (quickSettings.settingsWindowRef) {
                                quickSettings.settingsWindowRef.toggle();
                                quickSettings.visible = false;
                            }
                        }
                    }
                }
            }

            Rectangle {
                Layout.fillWidth: true
                height: 1
                color: "#4c566a"
            }

            ColumnLayout {
                Layout.fillWidth: true
                spacing: 10

                RowLayout {
                    Layout.fillWidth: true
                    spacing: 10
                    Text {
                        text: "Vol"
                        color: Theme.textDark
                        font.family: Theme.paragraphOneFamily !== undefined ? Theme.paragraphOneFamily : "Open Sans"
                        font.pixelSize: Theme.paragraphOneSize !== undefined ? Theme.paragraphOneSize : 16
                        font.bold: true
                        Layout.preferredWidth: 40
                    }
                    Slider {
                        id: volumeSlider
                        from: 0
                        to: 100
                        value: 50
                        Layout.fillWidth: true
                        onMoved: {
                            setVolume.volumeTarget = value;
                            setVolume.running = true;
                        }
                    }
                    Text {
                        text: Math.round(volumeSlider.value) + "%"
                        color: Theme.textDark
                        font.family: Theme.paragraphOneFamily !== undefined ? Theme.paragraphOneFamily : "Open Sans"
                        font.pixelSize: 12
                        Layout.preferredWidth: 30
                        horizontalAlignment: Text.AlignRight
                    }
                }

                RowLayout {
                    Layout.fillWidth: true
                    spacing: 10
                    Text {
                        text: "Brt"
                        color: Theme.textDark
                        font.family: Theme.paragraphOneFamily !== undefined ? Theme.paragraphOneFamily : "Open Sans"
                        font.pixelSize: Theme.paragraphOneSize !== undefined ? Theme.paragraphOneSize : 16
                        font.bold: true
                        Layout.preferredWidth: 40
                    }
                    Slider {
                        id: brightnessSlider
                        from: 0
                        to: 100
                        value: 50
                        Layout.fillWidth: true
                        onMoved: {
                            setBrightness.brightnessTarget = value;
                            setBrightness.running = true;
                        }
                    }
                    Text {
                        text: Math.round(brightnessSlider.value) + "%"
                        color: Theme.textDark
                        font.family: Theme.paragraphOneFamily !== undefined ? Theme.paragraphOneFamily : "Open Sans"
                        font.pixelSize: 12
                        Layout.preferredWidth: 30
                        horizontalAlignment: Text.AlignRight
                    }
                }
            }

            Rectangle {
                Layout.fillWidth: true
                height: 1
                color: "#4c566a"
            }

            GridLayout {
                Layout.fillWidth: true
                columns: 2
                rowSpacing: 10
                columnSpacing: 10

                Components.Button {
                    text: "Wi-Fi"
                    Layout.fillWidth: true
                    onClicked: {
                        mainView.visible = false;
                        wifiPage.visible = true;
                        wifiPage.refresh();
                    }
                }

                Components.Button {
                    text: "Bluetooth"
                    Layout.fillWidth: true
                    onClicked: {
                        mainView.visible = false;
                        bluetoothPage.visible = true;
                        bluetoothPage.refresh();
                    }
                }

                Components.Button {
                    id: caffeineBtn
                    property bool isActive: false
                    text: isActive ? "Caffeine: ON" : "Caffeine: OFF"
                    Layout.fillWidth: true
                    onClicked: {
                        isActive = !isActive;
                        if (isActive) {
                            toggleCaffeineOn.running = true;
                        } else {
                            toggleCaffeineOff.running = true;
                        }
                    }
                }

                Components.Button {
                    text: "Do Not Disturb"
                    Layout.fillWidth: true
                    onClicked: {
                        toggleDnd.running = true;
                    }
                }

                Components.Button {
                    id: nightLightBtn
                    property bool isActive: false
                    text: isActive ? "Night Light: ON" : "Night Light: OFF"
                    Layout.fillWidth: true
                    onClicked: {
                        isActive = !isActive;
                        if (isActive) {
                            nightLightOn.running = true;
                        } else {
                            nightLightOff.running = true;
                        }
                    }
                }

                Components.Button {
                    id: airplaneBtn
                    property bool isActive: false
                    text: isActive ? "Airplane: ON" : "Airplane: OFF"
                    Layout.fillWidth: true
                    onClicked: {
                        isActive = !isActive;
                        console.log("Toggled Airplane mode to " + isActive);
                    }
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
            anchors.margins: 20
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
            anchors.margins: 20
            visible: false
            onBackRequested: {
                bluetoothPage.visible = false;
                mainView.visible = true;
            }
        }
    }
}
