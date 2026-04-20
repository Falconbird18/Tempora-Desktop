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
}
