const { GLib, Gio } = imports.gi;
import { Astal } from "astal/gtk3";
import { Variable } from "astal";

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
    transparentBar: false,
    paddingSize: "10px", // Add default paddingSize
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
  transparentBar: boolean,
  paddingSize: string, // Add paddingSize argument
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
      transparentBarItems,
      transparentBar,
      paddingSize,
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

const settings = loadSettings();
export const settingsChanged = Variable(0);

export const currentTheme = Variable(settings.theme);
export const currentMode = Variable(settings.mode);
export const slideshow = Variable(settings.slideshow);
export const wallpaperImage = Variable(settings.wallpaper);
export const wallpaperFolder = Variable(settings.wallpaperDirectory);
export const useBing = Variable(settings.useBingWallpaper);
export const totalWorkspaces = Variable(settings.workspaces);
export const hideEmptyWorkspaces = Variable(settings.hideEmptyWorkspaces);
export const showNumbers = Variable(settings.numbers);
export const workspaceIcons = Variable(settings.workspaceIcons || {});
export const transparentItems = Variable(settings.transparentBarItems);
export const transparentBar = Variable(settings.transparentBar);
export const paddingSize = Variable(settings.paddingSize);

const BarLocations = {
  Top: {
    name: "top",
    anchor:
      Astal.WindowAnchor.LEFT |
      Astal.WindowAnchor.TOP |
      Astal.WindowAnchor.RIGHT,
  },
  Bottom: {
    name: "bottom",
    anchor:
      Astal.WindowAnchor.LEFT |
      Astal.WindowAnchor.BOTTOM |
      Astal.WindowAnchor.RIGHT,
  },
  Left: {
    name: "left",
    anchor:
      Astal.WindowAnchor.LEFT |
      Astal.WindowAnchor.TOP |
      Astal.WindowAnchor.BOTTOM,
  },
  Right: {
    name: "right",
    anchor:
      Astal.WindowAnchor.RIGHT |
      Astal.WindowAnchor.TOP |
      Astal.WindowAnchor.BOTTOM,
  },
} as const;

// Update the barLocation type to include anchor
export const barLocation = Variable({
  name: loadSettings().barLocation || "top",
  anchor: BarLocations.Top.anchor,
});
