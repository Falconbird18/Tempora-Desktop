import { App, Gdk, Gtk } from "astal/gtk3";
import { exec, execAsync, writeFile } from "astal";
const { GLib } = imports.gi;
import {
  loadSettings,
  currentTheme,
  currentMode,
  transparentItems,
  transparentBar,
} from "./service/Settings";

const osds = new Map<Gdk.Monitor, Gtk.Widget>();
import { paddingSize } from "./widget/ControlCenter/pages/AdvancedThemes"; // Import paddingSize
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
import GroupService from "./service/groupbar";

const applyTheme = async () => {
  const homeDir = GLib.get_home_dir();
  loadSettings;
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
    const hyprctl = "hyprctl reload";
    const spicetify = "spicetify update";
    const kittyCommand = `kitten themes --reload-in=all ${theme}${mode}`;
    const hyprThemeConfSource = `${homeDir}/.config/hypr/hyprland/${theme}${mode}/theme.conf`;
    const hyprThemeConfDest = `${homeDir}/.config/hypr/hyprland/theme.conf`;

    // Write padding.scss
    const currentPadding = paddingSize.get();

    writeFile(
      `${homeDir}/.config/ags/style/padding.scss`,
      `$padding: ${currentPadding};`,
    );
    await execAsync(`cp "${hyprThemeConfSource}" "${hyprThemeConfDest}"`);
    await execAsync(`sass "${themePathScss}" "${themePathCss}"`);
    await execAsync(`sass "${spicetifyPathScss}" "${spicetifyPathCss}"`);
    App.reset_css();
    App.apply_css(themePathCss);
    await execAsync(hyprctl);
    await execAsync(spicetify);
    await execAsync(kittyCommand);
    await StarshipService.updateConfig();
    await KittyThemesService.generateAllThemes();
    await GroupService.updateConfig();
    console.log("Theme applied");
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
  transparentBar.subscribe(applyTheme);
  paddingSize.subscribe(applyTheme); // Subscribe applyTheme to paddingSize changes
}

App.start({
  main: main,
  requestHandler(request: string, res: (response: any) => void) {
    const args = request.split(" ");
    if (args[0] == "toggle") {
      if (typeof args[1] === "string") {
        toggleWindow(args[1]);
        res("ok");
      } else {
        console.error("Toggle command requires a window name.");
        res("error: missing window name");
      }
    } else if (args[0] == "record") {
      if (args[1] == "start") {
        ScreenRecordService.start();
        res("Record started");
      } else if (args[1] == "stop") {
        ScreenRecordService.stop();
        res("Record stopped");
      }
    }
  },
});
