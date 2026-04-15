import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import "../components" as Components
import "../"

PanelWindow {
    id: authPrompt
    color: "transparent"
    visible: false
    focusable: visible

    // Cover the entire screen
    anchors {
        top: true
        bottom: true
        left: true
        right: true
    }

    // Ignore exclusive zone so it overlays everything
    exclusionMode: ExclusionMode.Ignore

    property string promptText: "Authentication Required"
    property var acceptCallback: null
    property var cancelCallback: null

    function requestAuth(text, onAccept, onCancel) {
        promptText = text;
        acceptCallback = onAccept;
        cancelCallback = onCancel;
        passwordInput.text = "";
        visible = true;
        passwordInput.forceActiveFocus();
    }

    Rectangle {
        anchors.fill: parent
        color: Qt.rgba(0, 0, 0, 0.6)

        // Block clicks from passing through
        MouseArea {
            anchors.fill: parent
            hoverEnabled: true
        }

        Rectangle {
            anchors.centerIn: parent
            width: 400
            height: 200
            color: Theme.bgDark !== undefined ? Theme.bgDark : "#1E1E2E"
            border.color: Theme.border !== undefined ? Theme.border : "#313244"
            border.width: Theme.borderWidth !== undefined ? Theme.borderWidth : 2
            radius: Theme.radius !== undefined ? Theme.radius : 12

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 25
                spacing: 15

                Text {
                    text: authPrompt.promptText
                    color: Theme.fg !== undefined ? Theme.fg : "#CDD6F4"
                    font.pointSize: Theme.fontLarge !== undefined ? Theme.fontLarge : 24
                    font.bold: true
                    Layout.fillWidth: true
                    wrapMode: Text.Wrap
                    horizontalAlignment: Text.AlignHCenter
                }

                TextField {
                    id: passwordInput
                    echoMode: TextInput.Password
                    Layout.fillWidth: true
                    placeholderText: "Password"
                    font.pointSize: Theme.fontSize !== undefined ? Theme.fontSize : 14

                    background: Rectangle {
                        color: Theme.hover !== undefined ? Theme.hover : "#45475A"
                        radius: Theme.innerRadius !== undefined ? Theme.innerRadius : 8
                        border.color: passwordInput.activeFocus ? (Theme.primary !== undefined ? Theme.primary : "#7D13CE") : (Theme.border !== undefined ? Theme.border : "#313244")
                        border.width: 1
                    }
                    color: Theme.fg !== undefined ? Theme.fg : "#CDD6F4"

                    onAccepted: {
                        var pwd = text;
                        authPrompt.visible = false;
                        if (acceptCallback)
                            acceptCallback(pwd);
                    }
                }

                RowLayout {
                    Layout.fillWidth: true
                    spacing: 15

                    Components.Button {
                        text: "Cancel"
                        Layout.fillWidth: true
                        onClicked: {
                            authPrompt.visible = false;
                            if (cancelCallback)
                                cancelCallback();
                        }
                    }

                    Components.Button {
                        text: "Authenticate"
                        Layout.fillWidth: true
                        onClicked: {
                            var pwd = passwordInput.text;
                            authPrompt.visible = false;
                            if (acceptCallback)
                                acceptCallback(pwd);
                        }
                    }
                }
            }
        }
    }
}
