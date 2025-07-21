import { execAsync, writeFileAsync } from "astal";
const { GLib } = imports.gi;

export class KittyThemesService {
  private static generateConfig(
    theme: string,
    mode: string,
    colors: {
      background: string;
      primary: string;
      secondary: string;
      text: string;
    },
  ) {
    return `# vim:ft=kitty

## name: ${theme}${mode}
## author: Austin Tallent
## license: MIT
## upstream: None
## blurb: Auto-generated ${theme} ${mode} theme for Kitty terminal

#: The basic colors

foreground                      #${colors.text}
background                      #${colors.background}
selection_foreground           #${colors.secondary}
selection_background           #${colors.primary}
background_opacity             ${theme === "Glaciara" ? 0.16 : 1.0}

#: Cursor colors

cursor                          #${colors.text}
cursor_text_color              #${colors.background}

#: URL underline color when hovering with mouse

url_color                       #${colors.secondary}

#: kitty window border colors and terminal bell colors

active_border_color             #${colors.primary}
inactive_border_color          #${colors.secondary}
bell_border_color              #${colors.primary}
visual_bell_color              none

#: OS Window titlebar colors

wayland_titlebar_color         system
macos_titlebar_color          system

#: Tab bar colors

active_tab_foreground         #${colors.text}
active_tab_background         #${colors.background}
inactive_tab_foreground       #${colors.secondary}
inactive_tab_background       #${colors.background}
tab_bar_background           none
tab_bar_margin_color         none

#: The basic 16 colors

#: black
color0 #${colors.background}
color8 #${colors.primary}

#: red
color1 #${colors.primary}
color9 #${colors.primary}

#: green
color2  #${colors.secondary}
color10 #${colors.secondary}

#: yellow
color3  #${colors.text}
color11 #${colors.text}

#: blue
color4  #${colors.primary}
color12 #${colors.primary}

#: magenta
color5  #${colors.secondary}
color13 #${colors.secondary}

#: cyan
color6  #${colors.text}
color14 #${colors.text}

#: white
color7  #${colors.text}
color15 #${colors.text}`;
  }

  private static async getThemeColors(
    theme: string,
    mode: string,
  ): Promise<{
    background: string;
    primary: string;
    secondary: string;
    text: string;
  }> {
    const homeDir = GLib.get_home_dir();
    const scssFile = `${homeDir}/.config/ags/style/${theme}${mode}/main.scss`;

    try {
      const colorResult = await execAsync(
        `grep -E '\\$background:|\\$primary:|\\$secondary:|\\$text:' "${scssFile}"`,
      );

      const colors = {
        background: "000000",
        primary: "562f10",
        secondary: "F0EDEA",
        text: "FFFFFF",
      };

      // Parse SCSS variables
      const colorLines = colorResult.split("\n");
      colorLines.forEach((line: string) => {
        if (line.includes("$background:")) {
          const match = line.match(/#([A-Fa-f0-9]{6})/);
          if (match && match[1]) colors.background = match[1];
        } else if (line.includes("$primary:")) {
          const match = line.match(/#([A-Fa-f0-9]{6})/);
          if (match && match[1]) colors.primary = match[1];
        } else if (line.includes("$secondary:")) {
          const match = line.match(/#([A-Fa-f0-9]{6})/);
          if (match && match[1]) colors.secondary = match[1];
        } else if (line.includes("$text:")) {
          const match = line.match(/#([A-Fa-f0-9]{6})/);
          if (match && match[1]) colors.text = match[1];
        }
      });

      return colors;
    } catch (error) {
      console.error(`Error reading theme colors for ${theme}${mode}:`, error);
      throw error;
    }
  }

  public static async generateAllThemes() {
    const homeDir = GLib.get_home_dir();
    const themes = ["Glaciara", "Frolic", "Verdant", "Zephyr"];
    const modes = ["Light", "Dark"];
    const themeDir = `${homeDir}/.config/kitty/themes`;

    try {
      // Create themes directory if it doesn't exist
      await execAsync(`mkdir -p "${themeDir}"`);

      // Generate all themes
      const themePromises = themes.flatMap((theme) =>
        modes.map(async (mode) => {
          try {
            const colors = await this.getThemeColors(theme, mode);
            const config = this.generateConfig(theme, mode, colors);
            const themePath = `${themeDir}/${theme}${mode}.conf`;

            await writeFileAsync(themePath, config);
          } catch (error) {
            console.error(`Failed to generate theme ${theme}${mode}:`, error);
          }
        }),
      );

      await Promise.all(themePromises);
      console.log("All Kitty themes generated successfully");
    } catch (error) {
      console.error("Error in generateAllThemes:", error);
      throw error; // Re-throw to be caught by the caller
    }
  }
}

// Export the service
export default KittyThemesService;
