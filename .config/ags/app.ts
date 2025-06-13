import { App, Gdk, Gtk } from "astal/gtk3";
import { exec, execAsync } from "astal";
const { GLib } = imports.gi;
import { currentTheme, currentMode } from "./widget/ControlCenter/pages/Themes";
import { transparentItems } from "./widget/ControlCenter/pages/AdvancedThemes";
import Bar from "./widget/Bar";
import TaskBar from "./widget/TaskBar";
import ControlCenter from "./widget/ControlCenter";
import AppLauncher from "./widget/AppLauncher";
import NotificationsPopup from "./widget/Notifications/NotificationsPopup";
import Weather from "./widget/Weather/Weather";
import Media from "./widget/media/Media";
import SideBar from "./widget/SideBar/SideBar";
import Keybinds from "./widget/Popups/menus/Keybinds";
import Clipboard from "./widget/Popups/menus/Clipboard";
import Screenshot from "./widget/Screenshot/Screenshot";
import Notifications from "./widget/Notifications";
import OSD from "./widget/OSD";
import { toggleWindow } from "./lib/utils";
import Scrim from "./widget/Scrims/Scrim";
import SinkMenu from "./widget/Popups/menus/Sink";
import MixerMenu from "./widget/Popups/menus/Mixer";
import Verification from "./widget/Powermenu/Verification";
import Powermenu from "./widget/Powermenu";
import ScreenRecordService from "./service/ScreenRecord";
import Dashboard from "./widget/Dashboard";
import { initBingImageService } from "./lib/bing";
import StarshipService from "./service/starship";
import HyprlockService from "./service/hyprlock";
import KittyThemesService from "./service/KittyThemes";

const applyTheme = async () => {
  const homeDir = GLib.get_home_dir();
  const theme = currentTheme.get();
  const mode = currentMode.get();
  const spicetifyPathScss = `${homeDir}/.config/ags/style/${theme}${mode}/spicetify.scss`;

  // Update hyprlock config when theme changes
  await HyprlockService.updateConfig();
  const spicetifyPathCss = `${homeDir}/.config/spicetify/Themes/Frolic/user.css`;

  try {
    const homeDir = GLib.get_home_dir();
    const theme = currentTheme.get();
    const mode = currentMode.get();
    const themePathCss = `${homeDir}/.config/ags/style/${theme}${mode}/main.css`;
    const themePathScss = `${homeDir}/.config/ags/style/${theme}${mode}/main.scss`;
    const hyprThemeConfSource = `${homeDir}/.config/hypr/hyprland/${theme}${mode}/theme.conf`;
    const hyprThemeConfDest = `${homeDir}/.config/hypr/hyprland/theme.conf`;
    const ghosttySource = `${homeDir}/.config/ghostty/${theme}${mode}/config`;
    const ghosttyDest = `${homeDir}/.config/ghostty/config`;
    const hyprctl = "hyprctl reload";
    const spicetify = "spicetify update";
    const kittyCommand = `kitten themes --reload-in=all ${theme}${mode}`;

    console.log("Theme Path CSS:", themePathCss);
    console.log("Theme Path Scss:", themePathScss);
    console.log("Hypr Theme Conf Source:", hyprThemeConfSource);
    console.log("Hypr Theme Conf Destination:", hyprThemeConfDest);
    console.log("Ghostty Source:", ghosttySource);
    console.log("Ghostty Destination:", ghosttyDest);

    await execAsync(`rm -f ${hyprThemeConfDest}`);
    await execAsync(`rm -f ${ghosttyDest}`);
    await execAsync(`cp "${hyprThemeConfSource}" "${hyprThemeConfDest}"`);
    await execAsync(`cp -r "${ghosttySource}" "${ghosttyDest}"`);
    console.log("Config files copied");
    await execAsync(`sass "${themePathScss}" "${themePathCss}"`);
    await execAsync(`sass "${spicetifyPathScss}" "${spicetifyPathCss}"`);
    console.log("Scss compiled");
    App.reset_css();
    App.apply_css(themePathCss);
    console.log("Css applied");
    await execAsync(hyprctl);
    console.log("Hyprland reloaded");
    await execAsync(spicetify);
    console.log("Spicetify reloaded");
    await execAsync(kittyCommand);
    console.log("Kitty reloaded");
    await StarshipService.updateConfig();
    console.log("Starship config updated");
    await KittyThemesService.generateAllThemes();
    console.log("Kitty themes generated");
  } catch (error: unknown) {
    console.error("Error applying theme:", error);
    if (error instanceof Gio.IOError) {
      if (error instanceof Error) {
        console.error("Gio.IOError:", error.message);
      }
    }
  }
};

async function main() {
  const bars = new Map<Gdk.Monitor, Gtk.Widget>();
  const taskBars = new Map<Gdk.Monitor, Gtk.Widget>();
  const notificationsPopups = new Map<Gdk.Monitor, Gtk.Widget>();
  const osds = new Map<Gdk.Monitor, Gtk.Widget>();

  Notifications();
  Weather();
  Media();
  SideBar();
  Clipboard();
  Screenshot();
  ControlCenter();
  Scrim({ scrimType: "opaque", className: "scrim" });
  Scrim({ scrimType: "transparent", className: "transparent-scrim" });
  SinkMenu();
  MixerMenu();
  Verification();
  Powermenu();
  Dashboard();
  AppLauncher();

  for (const gdkmonitor of App.get_monitors()) {
    bars.set(gdkmonitor, Bar(gdkmonitor));
    taskBars.set(gdkmonitor, TaskBar(gdkmonitor));
    notificationsPopups.set(gdkmonitor, NotificationsPopup(gdkmonitor));
    osds.set(gdkmonitor, OSD(gdkmonitor));
  }

  App.connect("monitor-added", (_: unknown, gdkmonitor: Gdk.Monitor) => {
    bars.set(gdkmonitor, Bar(gdkmonitor));
    taskBars.set(gdkmonitor, TaskBar(gdkmonitor));
    notificationsPopups.set(gdkmonitor, NotificationsPopup(gdkmonitor));
    osds.set(gdkmonitor, OSD(gdkmonitor));
  });

  App.connect("monitor-removed", (_: unknown, gdkmonitor: Gdk.Monitor) => {
    bars.get(gdkmonitor)?.destroy();
    taskBars.get(gdkmonitor)?.destroy();
    notificationsPopups.get(gdkmonitor)?.destroy();
    osds.get(gdkmonitor)?.destroy();
    bars.delete(gdkmonitor);
    notificationsPopups.delete(gdkmonitor);
    osds.delete(gdkmonitor);
  });

  await KittyThemesService.generateAllThemes();
  applyTheme();
  initBingImageService();

  currentTheme.subscribe(applyTheme);
  currentMode.subscribe(applyTheme);
  transparentItems.subscribe(applyTheme);
}

App.start({
  main: main,
  requestHandler(request: string, res: (response: any) => void) {
    const args = request.split(" ");
    if (args[0] == "toggle") {
      toggleWindow(args[1]);
      res("ok");
    } else if (args[0] == "record") {
      if (args[1] == "start") {
        ScreenRecordService.start();
        res("Record started");
      } else if (args[1] == "stop") {
        ScreenRecordService.stop();
        res("Record stopped");
      }
      return res("unknown command");
    } else {
      res("unknown command");
    }
  },
});
