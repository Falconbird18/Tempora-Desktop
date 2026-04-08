import QtQuick
import Quickshell
import "windows" as Windows

ShellRoot {
    Windows.TopBar {
        id: topBarWindow
        launcherRef: mainLauncher
    }

    Windows.AppLauncher {
        id: mainLauncher
    }
}
