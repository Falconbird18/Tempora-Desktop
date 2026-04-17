import QtQuick
import Quickshell
import "windows" as Windows

ShellRoot {
    Instantiator {
        model: Quickshell.screens

        delegate: Windows.TopBar {
            screen: modelData
            launcherRef: mainLauncher
            quickSettingsRef: quickSettings
            mediaControllerRef: mediaController
        }
    }

    Windows.AppLauncher {
        id: mainLauncher
    }

    Windows.MediaController {
        id: mediaController
    }

    Windows.QuickSettings {
        id: quickSettings
        authPromptRef: authPrompt
        settingsWindowRef: settingsWindow
    }

    Windows.SettingsWindow {
        id: settingsWindow
    }

    Windows.AuthPromptWindow {
        id: authPrompt
    }

    Windows.OsdWindow {
        id: osdWindow
    }

    Windows.NotificationPopup {
        id: notificationPopup
    }

    Windows.ScreenshotPopup {
        id: screenshotPopup
    }
}
