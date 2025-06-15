import { exec, execAsync, writeFile, writeFileAsync } from "astal";
import { currentTheme, currentMode } from "./Settings";
const { GLib } = imports.gi;

export class StarshipService {
  private static generateConfig(colors: {
    primary: string;
    secondary: string;
    tertiary: string;
  }) {
    return `format = """
[◖](fg:#${colors.secondary})\
$os\
$username\
[◗](bg:#${colors.secondary} fg:#${colors.secondary})\
$directory\
[◗](fg:#${colors.secondary} bg:#${colors.primary})\
$git_branch\
$git_status\
[◗](fg:#${colors.primary} bg:#${colors.primary})\
$c\
$elixir\
$elm\
$golang\
$gradle\
$haskell\
$java\
$julia\
$nodejs\
$nim\
$rust\
$scala\
[◗](fg:#${colors.primary} bg:#${colors.primary})\
$docker_context\
[◗](fg:#${colors.primary} bg:#${colors.primary})\
$time\
[◗ ](fg:#${colors.primary})\
"""

[username]
show_always = true
style_user = "bg:#${colors.secondary}"
style_root = "bg:#${colors.secondary}"
format = '[$user ]($style)'
disabled = false

[os]
style = "bg:#${colors.secondary}"
disabled = true

[directory]
style = "bg:#${colors.secondary}"
format = "[ $path ]($style)"
truncation_length = 3
truncation_symbol = "…/"

[directory.substitutions]
"Documents" = "󰈙 "
"Downloads" = " "
"Music" = " "
"Pictures" = " "

[c]
symbol = " "
style = "bg:#${colors.tertiary}"
format = '[ $symbol ($version) ]($style)'

[docker_context]
symbol = " "
style = "bg:#${colors.tertiary}"
format = '[ $symbol $context ]($style)'

[elixir]
symbol = " "
style = "bg:#${colors.tertiary}"
format = '[ $symbol ($version) ]($style)'

[elm]
symbol = " "
style = "bg:#${colors.tertiary}"
format = '[ $symbol ($version) ]($style)'

[git_branch]
symbol = ""
style = "bg:#${colors.primary}"
format = '[ $symbol $branch ]($style)'

[git_status]
style = "bg:#${colors.primary}"
format = '[$all_status$ahead_behind ]($style)'

[golang]
symbol = " "
style = "bg:#${colors.tertiary}"
format = '[ $symbol ($version) ]($style)'

[gradle]
style = "bg:#${colors.tertiary}"
format = '[ $symbol ($version) ]($style)'

[haskell]
symbol = " "
style = "bg:#${colors.tertiary}"
format = '[ $symbol ($version) ]($style)'

[java]
symbol = " "
style = "bg:#${colors.tertiary}"
format = '[ $symbol ($version) ]($style)'

[julia]
symbol = " "
style = "bg:#${colors.tertiary}"
format = '[ $symbol ($version) ]($style)'

[nodejs]
symbol = ""
style = "bg:#${colors.tertiary}"
format = '[ $symbol ($version) ]($style)'

[nim]
symbol = "󰆥 "
style = "bg:#${colors.tertiary}"
format = '[ $symbol ($version) ]($style)'

[rust]
symbol = ""
style = "bg:#${colors.tertiary}"
format = '[ $symbol ($version) ]($style)'

[scala]
symbol = " "
style = "bg:#${colors.tertiary}"
format = '[ $symbol ($version) ]($style)'

[time]
disabled = false
time_format = "%R"
style = "bg:#${colors.primary}"
format = '[ ♥ $time ]($style)'
#This config was auto generated!`;
  }

  private static async getThemeColors(): Promise<{
    primary: string;
    secondary: string;
    tertiary: string;
  }> {
    const homeDir = GLib.get_home_dir();
    const theme = currentTheme.get();
    const mode = currentMode.get();
    const scssFile = `${homeDir}/.config/ags/style/${theme}${mode}/main.scss`;

    try {
      // Read SCSS file content and extract color variables
      const result = await execAsync(
        `grep -E '\\$primary|\\$secondary|\\$tertiary' "${scssFile}"`,
      );
      const colors = {
        primary: "EB308F", // Default fallback
        secondary: "3179EB", // Default fallback
        tertiary: "86BBD8", // Default fallback
      };

      // Parse SCSS variables
      const lines = result.split("\n");
      lines.forEach((line) => {
        if (line.includes("$primary:")) {
          colors.primary =
            line.split("#")[1]?.trim().slice(0, 6) || colors.accent;
        } else if (line.includes("$secondary:")) {
          colors.secondary =
            line.split("#")[1]?.trim().slice(0, 6) || colors.secondary;
        } else if (line.includes("$tertiary:")) {
          colors.tertiary =
            line.split("#")[1]?.trim().slice(0, 6) || colors.tertiary;
        }
      });

      return colors;
    } catch (error) {
      console.error("Error reading theme colors:", error);
      // Return default colors if there's an error
      return {
        primary: "EB308F",
        secondary: "3179EB",
        tertiary: "86BBD8",
      };
    }
  }

  public static async updateConfig() {
    const colors = await this.getThemeColors();
    const config = this.generateConfig(colors);
    const homeDir = GLib.get_home_dir();

    try {
      // await execAsync(`echo '${config}' > "${homeDir}/.config/starship.toml"`);
      await writeFileAsync(`${homeDir}/.config/starship.toml`, config);
      await execAsync(
        `fish --command "source ${homeDir}/.config/fish/config.fish"`,
      );

      console.log("Starship config updated successfully");
    } catch (error) {
      console.error("Error updating starship config:", error);
    }
  }
}

// Export the service
export default StarshipService;
