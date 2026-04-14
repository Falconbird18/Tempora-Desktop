pragma Singleton
import QtQuick

QtObject {
    // Colors (Catppuccin Mocha palette)
    property color primary: "#7D13CE"
    property color secondary: "#CE1313"
    property color primaryBackground: "#D0B1E7"
    property color secondaryBackground: "#D0B1E7"
    property color tertiaryBackground: "#CE1313"
    property color textDark: "#220538"

    // Alpha
    property real primaryAlpha: 0.5
    property real secondaryAlpha: 0.8
    property real tertiaryAlpha: 0.5

    // Geometry
    property real primaryRadius: 16.0
    property real secondaryRadius: 8.0
    property real innerRadius: 8.0
    property real borderWidth: 2.0

    // Height
    property real normalHeight: 32

    // Spacing
    property real mediumPadding: 8.0
    property real padding: 12.0
    property real spacing: 8.0

    // Fonts
    property string headingOneFamily: "Baskervville"
    property real headingOneSize: 73
    property string headingOneWeight: "Normal"
    property string headingTwoFamily: "Open Sans"
    property real headingTwoSize: 45.0
    property string headingTwoWeight: "Light"
    property string headingThreeFamily: "Open Sans"
    property real headingThreeSize: 31
    property string headingThreeWeight: "Light"
    property string headingFourFamily: "Black"
    property real headingFourSize: 22.5
    property string headingFourWeight: "Light"
    property string paragraphFamily: "Open Sans"
    property real paragraphSize: 16.0
    property string paragraphWeight: "Normal"
}
