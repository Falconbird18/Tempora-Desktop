import { exec, execAsync, writeFileAsync } from "astal";
import { currentTheme, currentMode, useBing } from "./Settings";
const { GLib } = imports.gi;

export class HyprlockService {
  private static generateConfig(colors: {
    background: string;
    primary: string;
    secondary: string;
    text: string;
    h1_font: string;
    paragraph_font: string;
  }) {
    const homeDir = GLib.get_home_dir();
    const wallpaperPath = useBing()
      ? `${homeDir}/.config/ags/bing.jpg`
      : `${homeDir}/.config/ags/wallpaper.jpg`;

    return `$text_color = rgb(${colors.text})
$background = rgb(${colors.background})
$entry_border_color = rgb(${colors.secondary})
$font_family = ${colors.paragraph_font}
$font_family_clock = ${colors.h1_font}
$font_material_symbols = Frolic-Filled

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
    inner_color = $background
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
}`;
  }

  private static async getThemeColors(): Promise<{
    background: string;
    primary: string;
    secondary: string;
    text: string;
    h1_font: string;
    paragraph_font: string;
  }> {
    const homeDir = GLib.get_home_dir();
    const theme = currentTheme.get();
    const mode = currentMode.get();
    const scssFile = `${homeDir}/.config/ags/style/${theme}${mode}/main.scss`;
    const fontScssFile = `${homeDir}/.config/ags/style/${theme.toLowerCase()}.scss`;

    try {
      // Read SCSS file content and extract color variables
      const colorResult = await execAsync(
        `grep -E '$background:|\\$primary:|\\$secondary:|\\$text:|' "${scssFile}"`,
      );
      const fontResult = await execAsync(
        `grep -E '$h1-font:|\\$p-font:|' "${fontScssFile}"`,
      );

      const colors = {
        background: "00FF00",
        primary: "562f10",
        secondary: "F0EDEA",
        text: "FF0000",
        h1_font: "Monaspace Radon",
        paragraph_font: "Monaspace Xenon",
      };

      // Parse SCSS variables
      const colorLines = colorResult.split("\n");
      colorLines.forEach((line: string) => {
        if (line.includes("$background:")) {
          colors.background =
            line.split("#")[1]?.trim().slice(0, 6) || colors.background;
        } else if (line.includes("$primary:")) {
          colors.primary =
            line.split("#")[1]?.trim().slice(0, 6) || colors.primary;
        } else if (line.includes("$secondary:")) {
          colors.secondary =
            line.split("#")[1]?.trim().slice(0, 6) || colors.secondary;
        } else if (line.includes("$text:")) {
          colors.text = line.split("#")[1]?.trim().slice(0, 6) || colors.text;
        }
      });

      // Parse font variables
      const fontLines = fontResult.split("\n");
      fontLines.forEach((line: string) => {
        if (line.includes("$h1_font:")) {
          colors.h1_font =
            line.split(":")[1]?.trim().replace(/;$/, "").replace(/"/g, "") ||
            colors.h1_font;
        } else if (line.includes("$paragraph_font:")) {
          colors.paragraph_font =
            line.split(":")[1]?.trim().replace(/;$/, "").replace(/"/g, "") ||
            colors.paragraph_font;
        }
      });

      return colors;
    } catch (error) {
      console.error("Error reading theme colors:", error);
      // Return default colors if there's an error
      return {
        background: "00FF00",
        primary: "562f10",
        secondary: "F0EDEA",
        text: "FF0000",
        h1_font: "Monaspace Radon",
        paragraph_font: "Monaspace Xenon",
      };
    }
  }

  public static async updateConfig() {
    const colors = await this.getThemeColors();
    const config = this.generateConfig(colors);
    const homeDir = GLib.get_home_dir();

    try {
      await writeFileAsync(`${homeDir}/.config/hypr/hyprlock.conf`, config);
      console.log("Hyprlock config updated successfully");
    } catch (error) {
      console.error("Error updating hyprlock config:", error);
    }
  }
}

// Export the service
export default HyprlockService;
