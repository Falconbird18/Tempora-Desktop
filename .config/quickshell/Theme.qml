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
    property color bgDark: "#11111b"
    property color fg: "#cdd6f4"
    property color fgMuted: "#a6adc8"
    property color border: "#313244"
    property color hover: "#45475a"

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
    property string headingOneFamily: "Open Sans"
    property real headingOneSize: 16.0
    property string headingOneWeight: "Black"
    property string headingTwoFamily: "Open Sans"
    property real headingTwoSize: 45.0
    property string headingTwoWeight: "Light"
    property string paragraphFamily: "Open Sans"
    property real paragraphSize: 16.0
    property string paragraphWeight: "Black"
    property real fontSmall: 12.0
    property real fontLarge: 18.0
}
