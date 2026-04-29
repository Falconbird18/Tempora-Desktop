pragma Singleton
import QtQuick 2.0

QtObject {
    /*
     * Helpers.qml
     *
     * Exposes helper functions for deriving the user's home directory and
     * producing icon file:// paths that other QML components can reuse.
     *
     * Functions:
     *  - userHome(shellDir) -> string
     *      Attempts to derive the user's home directory (e.g. "/home/username")
     *      from an optional `shellDir` value or the current QML resolved URL.
     *      Returns empty string if no plausible home directory could be found.
     *
     *  - iconBase(shellDir) -> string
     *      Returns the canonical icon base directory as a file:// URL for the
     *      Phosphor icons installed in the user's home (~/.icons/phosphor-core/...).
     *      Returns empty string if userHome could not be derived.
     *
     *  - iconPath(iconFilename, shellDir) -> string
     *      Returns a file:// path to the requested icon filename under the
     *      duotone assets folder of phosphor-core, or an empty string if userHome
     *      could not be derived.
     *
     *  - iconOrFallback(iconFilename, shellDir, fallbackProvider)
     *      Produces either a filesystem file:// path (if available via iconBase),
     *      or a fallback image provider string such as "image://icon/<fallbackProvider>".
     *
     * Note: This module only constructs and returns candidate paths. If you need
     * to verify that a file actually exists, use your project's IO utilities (for
     * example Quickshell.Io) from the caller and react accordingly.
     */

    // Try to derive the user's home directory from shellDir or the QML resolved URL.
    // Heuristics are intentionally conservative.
    function userHome(shellDir) {
        try {
            var sd = "";

            if (typeof shellDir === "string" && shellDir.length > 0) {
                sd = shellDir.toString();
            } else if (typeof Quickshell !== "undefined" && Quickshell.shellDir) {
                sd = Quickshell.shellDir.toString();
            } else {
                sd = Qt.resolvedUrl(".").toString();
            }

            // Remove file:// prefix if present
            if (sd.indexOf("file://") === 0) {
                sd = sd.replace("file://", "");
            }

            // Normalize trailing slashes
            while (sd.length > 1 && sd.endsWith("/"))
                sd = sd.slice(0, -1);

            // Quick /home/<user> detection
            var parts = sd.split("/");
            if (parts.length >= 3 && parts[1] === "home") {
                return "/" + parts[1] + "/" + parts[2];
            }

            // Look for any 'home' segment in the path
            for (var i = 0; i < parts.length - 1; ++i) {
                if (parts[i] === "home" && (i + 1) < parts.length) {
                    return "/" + parts[i] + "/" + parts[i + 1];
                }
            }

            // On some systems user folders are under /users/<user>
            if (parts.length >= 3 && parts[1] === "users") {
                return "/" + parts[1] + "/" + parts[2];
            }
        } catch (e) {
            console.log("Helpers.userHome: error deriving userHome:", e);
        }
        return "";
    }

    // Build an icon base file:// URL based on the user's home folder.
    // Example return: "file:///home/username/.icons/phosphor-core/assets/duotone"
    function iconBase(shellDir) {
        try {
            var home = userHome(shellDir);
            if (home && home.length > 0) {
                // ensure no trailing slash, then produce file:// prefix
                var normalized = home;
                while (normalized.length > 1 && normalized.endsWith("/"))
                    normalized = normalized.slice(0, -1);
                return "file://" + normalized + "/.icons/phosphor-core/assets/duotone";
            }
        } catch (e) {
            console.log("Helpers.iconBase: error computing icon base:", e);
        }
        return "";
    }

    // Returns the full file:// path to an icon filename under the duotone assets,
    // or an empty string if no user home could be derived.
    // iconFilename: e.g. "speaker-high-duotone.svg" or "speaker-x-duotone.svg"
    function iconPath(iconFilename, shellDir) {
        try {
            if (!iconFilename || iconFilename.length === 0)
                return "";
            var base = iconBase(shellDir);
            if (base && base.length > 0) {
                // sanitize filename (basic)
                var name = iconFilename;
                // remove any leading slashes in provided filename
                while (name.length > 0 && name[0] === "/")
                    name = name.substring(1);
                return base + "/" + name;
            }
        } catch (e) {
            console.log("Helpers.iconPath: error building icon path:", e);
        }
        return "";
    }

    // Returns either a filesystem path (file://...) or a fallback image provider string.
    // fallbackProvider is optional and will be appended to "image://icon/" if used.
    // Example: iconOrFallback("speaker-high-duotone.svg", shellDir, "audio-card")
    // => "file:///home/user/.icons/..." or "image://icon/audio-card"
    function iconOrFallback(iconFilename, shellDir, fallbackProvider) {
        try {
            var p = iconPath(iconFilename, shellDir);
            if (p && p.length > 0) {
                return p;
            }
        } catch (e) {
            console.log("Helpers.iconOrFallback: error using iconPath:", e);
        }

        // fallback to image provider
        if (fallbackProvider && fallbackProvider.length > 0) {
            return "image://icon/" + fallbackProvider;
        }
        // generic fallback
        return "image://icon/dialog-information";
    }

    // Convenience helper: choose the correct speaker icon name based on value/muted
    // Returns the icon filename (not a full path).
    function speakerIconFilename(value, muted) {
        try {
            if (muted || value === 0)
                return "speaker-x-duotone.svg";
            if (value < 30)
                return "speaker-none-duotone.svg";
            if (value < 60)
                return "speaker-low-duotone.svg";
            return "speaker-high-duotone.svg";
        } catch (e) {
            console.log("Helpers.speakerIconFilename error:", e);
        }
        return "speaker-high-duotone.svg";
    }

    /*
     * Screen / geometry helpers
     *
     * These functions determine screen width/height. They accept an optional
     * `win` (Window/Item) parameter for multi-monitor setups.
     *
     * If `win` is provided, the helpers will read the screen of the window to
     * detect the dimensions of the current monitor it's on (useful for multi-monitor
     * setups with different sized screens).
     *
     * Otherwise they attempt several fallbacks (global Screen object, primary screen).
     *
     * Use examples:
     *  import "Helpers.qml" as Helpers
     *  margins { top: Helpers.heightPercent(25) }   // 25% of detected screen height
     *  margins { top: Helpers.heightPercent(25, appLauncher) }  // for multi-monitor accuracy
     */

    function screenSize(win) {
        try {
            // 1) If a window-like object is provided, use its screen property to get
            //    the dimensions of the current monitor it's displayed on.
            if (win && typeof win.screen !== "undefined") {
                var scr = win.screen;
                if (scr && typeof scr.width === "number" && typeof scr.height === "number") {
                    return {
                        width: scr.width,
                        height: scr.height
                    };
                }
            }

            // 2) Try the global Screen object if available (common in QtQuick.Window)
            if (typeof Screen !== "undefined" && typeof Screen.width === "number" && typeof Screen.height === "number") {
                return {
                    width: Screen.width,
                    height: Screen.height
                };
            }

            // 3) Try Qt.primaryScreen / Qt.application.primaryScreen (some Qt versions)
            if (typeof Qt !== "undefined" && Qt.primaryScreen && typeof Qt.primaryScreen.width === "number" && typeof Qt.primaryScreen.height === "number") {
                return {
                    width: Qt.primaryScreen.width,
                    height: Qt.primaryScreen.height
                };
            }
            if (typeof Qt !== "undefined" && Qt.application && Qt.application.primaryScreen && typeof Qt.application.primaryScreen.width === "number") {
                return {
                    width: Qt.application.primaryScreen.width,
                    height: Qt.application.primaryScreen.height
                };
            }

            // 4) Try Qt.application.activeWindow (available in some Qt builds)
            if (typeof Qt !== "undefined" && Qt.application && Qt.application.activeWindow) {
                var aw = Qt.application.activeWindow;
                if (aw && typeof aw.width === "number" && typeof aw.height === "number") {
                    return {
                        width: aw.width,
                        height: aw.height
                    };
                }
            }
        } catch (e) {
            console.log("Helpers.screenSize: error determining screenSize:", e);
        }
        // Fallback
        return {
            width: 0,
            height: 0
        };
    }

    function screenWidth(win) {
        return screenSize(win).width;
    }

    function screenHeight(win) {
        return screenSize(win).height;
    }

    // Compute n% of the screen height/width (0-100). Returns integer pixels.
    // If percent is out of range, it's clamped.
    // Optional: pass a window object to get accurate dimensions for that window's current monitor.
    // Example: heightPercent(25, appLauncher)  // for multi-monitor setups
    function heightPercent(percent, win) {
        try {
            var p = Math.max(0, Math.min(100, Number(percent) || 0));
            var h = screenHeight(win);
            return Math.round(h * (p / 100));
        } catch (e) {
            console.log("Helpers.heightPercent error:", e);
        }
        return 0;
    }

    function widthPercent(percent, win) {
        try {
            var p = Math.max(0, Math.min(100, Number(percent) || 0));
            var w = screenWidth(win);
            return Math.round(w * (p / 100));
        } catch (e) {
            console.log("Helpers.widthPercent error:", e);
        }
        return 0;
    }
}
