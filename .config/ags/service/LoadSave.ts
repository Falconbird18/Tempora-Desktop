const { GLib, Gio } = imports.gi;
import { Astal } from "astal/gtk3";
import { Variable} from "astal";

const settingsFile = `${GLib.get_home_dir()}/.config/ags/theme-settings.json`;

export const loadSettings = () => {
  try {
    const file = Gio.File.new_for_path(settingsFile);
    const [ok, contents] = file.load_contents(null);
    if (ok) {
      const settings = JSON.parse(new TextDecoder().decode(contents));
      console.log(settings);
      return settings;
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return {
    theme: "Frolic",
    mode: "Light",
    slideshow: false,
    wallpaper: "747.jpg",
    wallpaperDirectory: "/home/austin/Pictures/wallpapers",
    useBingWallpaper: false,
    workspaces: 10,
    numbers: false,
    hideEmptyWorkspaces: false,
    workspaceIcons: {},
    barLocation: "top",
    transparentBarItems: false,
  };
};

export const saveSettings = (
  theme: string,
  mode: string,
  slideshow: boolean,
  wallpaper: string,
  wallpaperDirectory: string,
  useBingWallpaper: boolean,
  workspaces: number,
  numbers: boolean,
  hideEmptyWorkspaces: boolean,
  workspaceIcons: { [key: number]: string },
  transparentBarItems: boolean,
) => {
  try {
    const file = Gio.File.new_for_path(settingsFile);
    const contents = JSON.stringify({
      theme,
      mode,
      slideshow,
      wallpaper,
      wallpaperDirectory,
      useBingWallpaper,
      workspaces,
      numbers,
      hideEmptyWorkspaces,
      workspaceIcons,
      barLocation: barLocation.get().name,
      // transparentBarItems: transparentBar.get(),
      transparentBarItems,
    });
    file.replace_contents(
      contents,
      null,
      false,
      Gio.FileCreateFlags.NONE,
      null,
    );
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
};

const BarLocations = {
  Top: {
    name: "top",
    anchor: Astal.WindowAnchor.LEFT | Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT,
  },
  Bottom: {
    name: "bottom",
    anchor: Astal.WindowAnchor.LEFT | Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.RIGHT,
  },
  Left: {
    name: "left",
    anchor: Astal.WindowAnchor.LEFT | Astal.WindowAnchor.TOP | Astal.WindowAnchor.BOTTOM,
  },
  Right: {
    name: "right",
    anchor: Astal.WindowAnchor.RIGHT | Astal.WindowAnchor.TOP | Astal.WindowAnchor.BOTTOM,
  },
} as const;

// Update the barLocation type to include anchor
export const barLocation = Variable({
  name: loadSettings().barLocation || "top",
  anchor: BarLocations.Top.anchor,
});