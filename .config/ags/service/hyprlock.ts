import { exec, execAsync, writeFileAsync } from "astal";
import { currentTheme, currentMode } from "../widget/ControlCenter/pages/Themes";
import { useBing } from "../widget/ControlCenter/pages/Themes";
const { GLib } = imports.gi;

export class HyprlockService {
    private static generateConfig(colors: { primary: string, secondary: string, text: string, background: string }) {
        const homeDir = GLib.get_home_dir();
        const wallpaperPath = useBing()
            ? `${homeDir}/.config/ags/bing.jpg`
            : `${homeDir}/.config/ags/wallpaper.jpg`;

        return `$text_color = rgb(${colors.text})
$entry_background_color = rgba(${colors.background})
$entry_border_color = rgb(${colors.secondary})
$font_family = Monaspace Xenon
$font_family_clock = Monaspace Radon
$font_material_symbols = Frolic-filled

background {
    path = ${wallpaperPath}
    blur_size = 7
    blur_passes = 2
}

input-field {
    monitor =
    size = 300, 50
    outline_thickness = 2
    dots_size = 0.3
    dots_spacing = 0.4
    outer_color = $entry_border_color
    inner_color = $entry_background_color
    font_color = $text_color
    font_family = $font_family
    placeholder_text = Input password

    position = 0, 20
    halign = center
    valign = center
}

label { # Clock
    monitor =
    text = cmd[update:1000] echo "$(date +"%-I:%M%p")"
    color = $text_color
    font_size = 75
    font_family = $font_family_clock

    position = 0, 300
    halign = center
    valign = center
}

label { # Greeting
    monitor =
    text = Hi $USER
    color = $text_color
    font_size = 20
    font_family = $font_family

    position = 0, 220
    halign = center
    valign = center
}

label { # lock icon
    monitor =
    text = system-lock-screen
    shadow_passes = 1
    shadow_boost = 0.5
    color = $text_color
    font_size = 21
    font_family = $font_material_symbols

    position = 0, 65
    halign = center
    valign = bottom
}

label { # "locked" text
    monitor =
    text = locked
    shadow_passes = 1
    shadow_boost = 0.5
    color = $text_color
    font_size = 14
    font_family = $font_family

    position = 0, 45
    halign = center
    valign = bottom
}

label { # Status
    monitor =
    text = cmd[update:5000] ${GLib.get_home_dir()}/.config/hypr/hyprlock/status.sh
    shadow_passes = 1
    shadow_boost = 0.5
    color = $text_color
    font_size = 14
    font_family = $font_family

    position = 30, -30
    halign = left
    valign = top
}`
    }

    private static async getThemeColors(): Promise<{ primary: string, secondary: string, text: string, background: string }> {
        const homeDir = GLib.get_home_dir();
        const theme = currentTheme.get();
        const mode = currentMode.get();
        const scssFile = `${homeDir}/.config/ags/style/${theme}${mode}/main.scss`;

        try {
            // Read SCSS file content and extract color variables
            const result = await execAsync(`grep -E '\\$primary:|\\$secondary:|\\$text:|\\$background:' "${scssFile}"`);
            const colors = {
                primary: '562f10',      // Default fallback
                secondary: 'F0EDEA',    // Default fallback
                text: 'FF0000',     // Default fallback
                background: '00FF00'    // Default fallback
            };

            // Parse SCSS variables
            const lines = result.split('\n');
            lines.forEach(line => {
                if (line.includes('$primary:')) {
                    colors.primary = line.split('#')[1]?.trim().slice(0, 6) || colors.primary;
                } else if (line.includes('$secondary:')) {
                    colors.secondary = line.split('#')[1]?.trim().slice(0, 6) || colors.secondary;
                } else if (line.includes('$text:')) {
                    colors.text = line.split('#')[1]?.trim().slice(0, 6) || colors.text;
                } else if (line.includes('$background:')) {
                    colors.background = line.split('#')[1]?.trim().slice(0, 6) || colors.background;
                }
            });

            return colors;
        } catch (error) {
            console.error('Error reading theme colors:', error);
            // Return default colors if there's an error
            return {
                primary: '562f10',
                secondary: 'F0EDEA',
                text: 'FF0000',
                background: 'F0EDEA'
            };
        }
    }

    public static async updateConfig() {
        const colors = await this.getThemeColors();
        const config = this.generateConfig(colors);
        const homeDir = GLib.get_home_dir();

        try {
            await writeFileAsync(`${homeDir}/.config/hypr/hyprlock.conf`, config);
            console.log('Hyprlock config updated successfully');
            console.log(`colors: ${colors.primary}, ${colors.secondary}, ${colors.text}, ${colors.background}`);
        } catch (error) {
            console.error('Error updating hyprlock config:', error);
        }
    }
}

// Export the service
export default HyprlockService;
