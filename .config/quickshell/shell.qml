import QtQuick
import Quickshell
import "windows" as Windows

ShellRoot {
    Windows.AppLauncher {
        id: mainLauncher
    }

    Windows.TopBar {
        launcherRef: mainLauncher
    }
}
