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
    property real paddingFour: 4.0
    property real mediumEight: 8.0
    property real mediumSixteen: 16.0
    property real mediumThirtyTwo: 32.0
    property real padding: 12.0
    property real spacing: 8.0

    // Fonts
    property string headingOneFamily: "Baskervville"
    property real headingOneSize: 73
    property int headingOneWeight: 400
    property string headingTwoFamily: "Open Sans"
    property real headingTwoSize: 45.0
    property int headingTwoWeight: 300
    property string headingThreeFamily: "Open Sans"
    property real headingThreeSize: 31
    property int headingThreeWeight: 300
    property string headingFourFamily: "Black"
    property real headingFourSize: 22.5
    property int headingFourWeight: 300
    property string paragraphOneFamily: "Open Sans"
    property real paragraphOneSize: 16.0
    property int paragraphOneWeight: 400
    property string paragraphTwoFamily: "Open Sans"
    property real paragraphTwoSize: 16.0
    property int paragraphTwoWeight: 400
    property string paragraphFont: "Open Sans"

    // Extra properties
    property color bgDark: "#1E1E2E"
    property color border: "#313244"
    property real radius: 12.0
    property color fg: "#CDD6F4"
    property real fontLarge: 24.0
    property real fontSize: 14.0
    property color hover: "#45475A"
}
