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
            color: Theme.bgDark
            border.color: Theme.border
            border.width: Theme.borderWidth
            radius: Theme.radius

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 25
                spacing: 15

                Text {
                    text: authPrompt.promptText
                    color: Theme.fg
                    font.pointSize: Theme.fontLarge
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
                    font.pointSize: Theme.fontSize
                    
                    background: Rectangle {
                        color: Theme.hover
                        radius: Theme.innerRadius
                        border.color: passwordInput.activeFocus ? Theme.primary : Theme.border
                        border.width: 1
                    }
                    color: Theme.fg

                    onAccepted: {
                        var pwd = text;
                        authPrompt.visible = false;
                        if (acceptCallback) acceptCallback(pwd);
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
                            if (cancelCallback) cancelCallback();
                        }
                    }
                    
                    Components.Button {
                        text: "Authenticate"
                        Layout.fillWidth: true
                        onClicked: {
                            var pwd = passwordInput.text;
                            authPrompt.visible = false;
                            if (acceptCallback) acceptCallback(pwd);
                        }
                    }
                }
            }
        }
    }
}
