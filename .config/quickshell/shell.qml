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
        }
    }

    Windows.AppLauncher {
        id: mainLauncher
    }

    Windows.QuickSettings {
        id: quickSettings
        authPromptRef: authPrompt
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
