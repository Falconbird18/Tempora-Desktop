import QtQuick
import "../"
import QtQuick.Window
import QtQuick.Controls
import QtQuick.Layouts
import "../components" as Components

Window {
    id: settingsWindow
    width: 650
    height: 450
    color: "transparent"
    title: "Settings"
    visible: false

    function toggle() {
        visible = !visible;
        if (visible) {
            requestActivate();
        }
    }

    Rectangle {
        anchors.fill: parent
        color: Qt.alpha(Theme.primaryBackground, 0.9)

        RowLayout {
            anchors.fill: parent
            spacing: 0

            // Sidebar
            Rectangle {
                Layout.preferredWidth: 200
                Layout.fillHeight: true
                color: Qt.alpha(Theme.secondaryBackground, Theme.secondaryAlpha)

                ListView {
                    id: sidebarList
                    anchors.fill: parent
                    anchors.margins: 10
                    model: ["Workspaces", "General", "Appearance"]
                    currentIndex: 0

                    delegate: ItemDelegate {
                        width: ListView.view.width
                        height: 40
                        text: modelData
                        highlighted: ListView.isCurrentItem

                        contentItem: Text {
                            text: parent.text
                            font.family: Theme.paragraphOneFamily !== undefined ? Theme.paragraphOneFamily : "Open Sans"
                            font.pixelSize: Theme.paragraphOneSize !== undefined ? Theme.paragraphOneSize : 16
                            color: Theme.textDark
                            verticalAlignment: Text.AlignVCenter
                        }

                        background: Rectangle {
                            color: parent.highlighted ? Qt.alpha(Theme.primary, 0.5) : "transparent"
                            radius: Theme.secondaryRadius !== undefined ? Theme.secondaryRadius : 8
                        }

                        onClicked: sidebarList.currentIndex = index
                    }
                }
            }

            // Divider
            Rectangle {
                Layout.preferredWidth: 1
                Layout.fillHeight: true
                color: Qt.darker(Theme.primaryBackground, 1.2)
            }

            // Content Area
            StackLayout {
                id: contentStack
                Layout.fillWidth: true
                Layout.fillHeight: true
                currentIndex: sidebarList.currentIndex

                // Page 1: Workspaces Settings
                Item {
                    ColumnLayout {
                        anchors.fill: parent
                        anchors.margins: 30
                        spacing: 20

                        Text {
                            text: "Workspaces"
                            font.family: Theme.headingTwoFamily !== undefined ? Theme.headingTwoFamily : "Open Sans"
                            font.pixelSize: 32
                            font.bold: true
                            color: Theme.textDark
                        }

                        RowLayout {
                            Layout.fillWidth: true
                            spacing: 15

                            Text {
                                text: "Workspace Indicator Style"
                                font.family: Theme.paragraphOneFamily !== undefined ? Theme.paragraphOneFamily : "Open Sans"
                                font.pixelSize: 18
                                color: Theme.textDark
                                Layout.fillWidth: true
                            }

                            // Sliding switch
                            Components.SlidingSwitch {
                                id: styleSwitch
                                leftText: "Dots"
                                rightText: "Numbers"
                                checked: Settings.workspaceStyle === "numbers"
                                onToggled: {
                                    Settings.workspaceStyle = checked ? "numbers" : "dots";
                                }
                            }
                        }

                        StackLayout {
                            Layout.fillWidth: true
                            Layout.fillHeight: true
                            currentIndex: Settings.workspaceStyle === "numbers" ? 1 : 0

                            // Dots options
                            Item {
                                ColumnLayout {
                                    anchors.fill: parent
                                    anchors.topMargin: 20
                                    spacing: 15

                                    Text {
                                        text: "Dot Options"
                                        font.family: Theme.paragraphOneFamily !== undefined ? Theme.paragraphOneFamily : "Open Sans"
                                        font.pixelSize: 18
                                        font.bold: true
                                        color: Theme.textDark
                                    }

                                    Text {
                                        text: "• Active dot size\n• Inactive dot size\n• Dot spacing"
                                        font.family: Theme.paragraphOneFamily !== undefined ? Theme.paragraphOneFamily : "Open Sans"
                                        font.pixelSize: 14
                                        color: Theme.textDark
                                    }

                                    Item {
                                        Layout.fillHeight: true
                                    }
                                }
                            }

                            // Numbers options
                            Item {
                                ColumnLayout {
                                    anchors.fill: parent
                                    anchors.topMargin: 20
                                    spacing: 15

                                    Text {
                                        text: "Number Options"
                                        font.family: Theme.paragraphOneFamily !== undefined ? Theme.paragraphOneFamily : "Open Sans"
                                        font.pixelSize: 18
                                        font.bold: true
                                        color: Theme.textDark
                                    }

                                    Text {
                                        text: "• Font size\n• Text color\n• Background shape"
                                        font.family: Theme.paragraphOneFamily !== undefined ? Theme.paragraphOneFamily : "Open Sans"
                                        font.pixelSize: 14
                                        color: Theme.textDark
                                    }

                                    Item {
                                        Layout.fillHeight: true
                                    }
                                }
                            }
                        }
                    }
                }

                // Page 2: General Settings
                Item {
                    Text {
                        anchors.centerIn: parent
                        text: "General Settings Content"
                        font.family: Theme.paragraphOneFamily !== undefined ? Theme.paragraphOneFamily : "Open Sans"
                        font.pixelSize: 24
                        color: Theme.textDark
                    }
                }

                // Page 3: Appearance Settings
                Item {
                    Text {
                        anchors.centerIn: parent
                        text: "Appearance Settings Content"
                        font.family: Theme.paragraphOneFamily !== undefined ? Theme.paragraphOneFamily : "Open Sans"
                        font.pixelSize: 24
                        color: Theme.textDark
                    }
                }
            }
        }
    }
}
