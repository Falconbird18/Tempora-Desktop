pragma Singleton
import QtQuick

QtObject {
    // Colors (Catppuccin Mocha palette)
    property color primary: "#7D13CE"
    property color primaryBackground: "#D0B1E7"
    property color bgDark: "#11111b"
    property color fg: "#cdd6f4"
    property color fgMuted: "#a6adc8"
    property color border: "#313244"
    property color hover: "#45475a"

    // Alpha
    property real primaryAlpha: 0.5

    // Geometry
    property real radius: 12.0
    property real innerRadius: 8.0
    property real borderWidth: 2.0

    // Spacing
    property real margin: 8.0
    property real padding: 12.0
    property real spacing: 8.0

    // Fonts
    property string fontName: "Inter"
    property real fontSize: 14.0
    property real fontSmall: 12.0
    property real fontLarge: 18.0
}
