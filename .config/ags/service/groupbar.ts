import { exec, execAsync, writeFileAsync } from "astal";
import { currentTheme, currentMode } from "./Settings";
const { GLib } = imports.gi;

export class HyprlockService {
  private static generateConfig(colors: {
    border_radius: string;
    primary: string;
    secondary: string;
    text: string;
    h1_font: string;
    font_size: string;
  }) {
    return `
    group {
        groupbar {
            enabled = true
            font_family = ${colors.h1_font}
            font_size = ${colors.font_size}
            font_weight_active = normal
            font_weight_inactive = light
            text_color = rgb(${colors.text})
            height = 16
            indicator_gap = 3
            indicator_height = 3
            rounding = ${colors.border_radius}
            col.active = rgb(${colors.primary})
            col.inactive = rgb(${colors.secondary})
        }
    }`;
  }

  private static async getThemeColors(): Promise<{
    border_radius: string;
    primary: string;
    secondary: string;
    text: string;
    h1_font: string;
    font_size: string;
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
        border_radius: "5",
        primary: "562f10",
        secondary: "F0EDEA",
        text: "FF0000",
        h1_font: "Monaspace Radon",
        font_size: "14",
      };

      // Parse SCSS variables
      const colorLines = colorResult.split("\n");
      colorLines.forEach((line: string) => {
        if (line.includes("$primary:")) {
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
        } else if (line.includes("$h2_size:")) {
          colors.font_size =
            line.split(":")[1]?.trim().replace(/px;$/, "").replace(/"/g, "") ||
            colors.font_size;
        } else if (line.includes("$primary-radius:")) {
          colors.border_radius =
            line.split(":")[1]?.trim().replace(/px;$/, "").replace(/"/g, "") ||
            colors.border_radius;
        }
      });

      return colors;
    } catch (error) {
      console.error("Error reading theme colors:", error);
      // Return default colors if there's an error
      return {
        border_radius: "5",
        primary: "562f10",
        secondary: "F0EDEA",
        text: "FF0000",
        h1_font: "Monaspace Radon",
        font_size: "14",
      };
    }
  }

  public static async updateConfig() {
    const colors = await this.getThemeColors();
    const config = this.generateConfig(colors);
    const homeDir = GLib.get_home_dir();

    try {
      await writeFileAsync(
        `${homeDir}/.config/hypr/hyprland/groupbar.conf`,
        config,
      );
      console.log("Group config updated successfully");
    } catch (error) {
      console.error("Error updating group config:", error);
    }
  }
}

// Export the service
export default HyprlockService;
