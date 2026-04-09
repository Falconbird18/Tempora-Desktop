import QtQuick
import Quickshell
import "windows" as Windows

ShellRoot {
    Windows.TopBar {
        id: topBarWindow
        launcherRef: mainLauncher
        quickSettingsRef: quickSettings
    }

    Windows.AppLauncher {
        id: mainLauncher
    }

    Windows.QuickSettings {
        id: quickSettings
    }
}
