import Page from "../Page";
import { App, Gtk, Gdk, Widget } from "astal/gtk3";
import { bind, execAsync, timeout, Variable, exec } from "astal";
const { GLib, Gio } = imports.gi;
import { spacing } from "../../../lib/variables";
import icons from "../../../lib/icons";
import { controlCenterPage } from "../index";

const settingsFile = `${GLib.get_home_dir()}/.config/ags/theme-settings.json`;
const menuName = "advancedsettings";

// Read settings from disk
const loadSettings = () => {
  try {
    const file = Gio.File.new_for_path(settingsFile);
    const [ok, contents] = file.load_contents(null);
    if (ok) {
      const settings = JSON.parse(new TextDecoder().decode(contents));
      console.log("Loaded settings:", settings);
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
    workspaces: 10,
    numbers: false,
    hideEmptyWorkspaces: false,
  };
};

// Save settings to disk
const saveSettings = (
  theme,
  mode,
  slideshow,
  wallpaper,
  wallpaperDirectory,
  workspaces,
  numbers,
  hideEmptyWorkspaces,
) => {
  try {
    const file = Gio.File.new_for_path(settingsFile);
    const contents = JSON.stringify({
      theme,
      mode,
      slideshow,
      wallpaper,
      wallpaperDirectory,
      workspaces,
      numbers,
      hideEmptyWorkspaces,
    });
    file.replace_contents(contents, null, false, Gio.FileCreateFlags.NONE, null);
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
};

const settings = loadSettings();

// Reactive variables
export const currentTheme = Variable(settings.theme);
export const currentMode = Variable(settings.mode);
export const slideshow = Variable(settings.slideshow);
export const wallpaperImage = Variable(settings.wallpaper);
export const wallpaperFolder = Variable(settings.wallpaperDirectory);
export const totalWorkspaces = Variable(settings.workspaces);
export const hideEmptyWorkspaces = Variable(settings.hideEmptyWorkspaces);
export const settingsChanged = Variable(0); // Signal to trigger workspace updates
export const showNumbers = Variable(settings.numbers);

// Central update helper which updates reactive variables and disk settings.
const updateSettings = (updates) => {
  const theme = updates.theme ?? currentTheme.get();
  const mode = updates.mode ?? currentMode.get();
  const slide = updates.slideshow ?? slideshow.get();
  const wp = updates.wallpaper ?? wallpaperImage.get();
  const folder = updates.wallpaperDirectory ?? wallpaperFolder.get();
  const workspaces = updates.workspaces ?? totalWorkspaces.get();
  const numbers = updates.numbers ?? showNumbers.get();
  const hideEmpty = updates.hideEmptyWorkspaces ?? hideEmptyWorkspaces.get();

  if (updates.theme !== undefined) currentTheme.set(theme);
  if (updates.mode !== undefined) currentMode.set(mode);
  if (updates.slideshow !== undefined) slideshow.set(slide);
  if (updates.wallpaper !== undefined) wallpaperImage.set(wp);
  if (updates.wallpaperDirectory !== undefined) wallpaperFolder.set(folder);
  if (updates.workspaces !== undefined) totalWorkspaces.set(workspaces);
  if (updates.numbers !== undefined) showNumbers.set(numbers);
  if (updates.hideEmptyWorkspaces !== undefined) hideEmptyWorkspaces.set(hideEmpty);

  saveSettings(theme, mode, slide, wp, folder, workspaces, numbers, hideEmpty);
};

const setTheme = (theme, mode) => {
  updateSettings({ theme, mode });
};

const setSlideshow = (isSlideshow) => {
  updateSettings({ slideshow: isSlideshow });
};

const setWallpaper = (wallpaper) => {
  updateSettings({ wallpaper });
  console.log(`New Wallpaper: ${wallpaper}`);

  const wpFolder = wallpaperFolder.get();
  const wallpaperImagePath = `${wpFolder}/${wallpaper}`;
  const destinationPath = `/usr/share/sddm/themes/frolic/Backgrounds/wallpaper.jpg`;

  try {
    exec(`mkdir -p /usr/share/sddm/themes/frolic/Backgrounds`);
    exec(`cp "${wallpaperImagePath}" "${destinationPath}"`);
    exec(
      `swww img "${destinationPath}" --transition-step 100 --transition-fps 120 --transition-type grow --transition-angle 30 --transition-duration 1`,
    );
  } catch (e) {
    console.error("Failed to set wallpaper:", e);
  }
};

const setWallpaperDirectory = (folder) => {
  updateSettings({ wallpaperDirectory: folder });
};

const chooseWallpaperDirectory = () => {
  const chooser = Gtk.FileChooserDialog.new(
    "Choose Wallpaper Directory",
    null,
    Gtk.FileChooserAction.SELECT_FOLDER,
    "Select",
    "Cancel",
  );
  chooser.set_modal(false);
  chooser.set_transient_for(null);
  chooser.set_skip_taskbar_hint(true);
  chooser.set_skip_pager_hint(true);
  chooser.connect("response", (dialog, response) => {
    if (response === Gtk.ResponseType.ACCEPT) {
      const file = dialog.get_filename();
      setWallpaperDirectory(file);
      // Reload wallpapers after folder selection.
      loadWallpaperImagesAsync();
    }
    dialog.destroy();
  });
  chooser.show_all();
};

const setWorkspaces = (workspaces) => {
  const newValue = Math.max(1, Math.min(20, workspaces));
  updateSettings({ workspaces: newValue });
  settingsChanged.set(settingsChanged.get() + 1);
};

const setShowNumbers = (numbers) => {
  updateSettings({ numbers });
  settingsChanged.set(settingsChanged.get() + 1);
};

const setHideEmptyWorkspaces = (hide) => {
  updateSettings({ hideEmptyWorkspaces: hide });
  settingsChanged.set(settingsChanged.get() + 1);
};

// --- Asynchronous Wallpaper Loading ---

// Reactive variable for the list of wallpaper images.
const wallpaperImages = Variable([]);

// Improved asynchronous function to load wallpaper images.
const loadWallpaperImagesAsync = () => {
  const folderPath = wallpaperFolder.get();
  if (!folderPath) {
    console.error("Wallpaper folder is not set.");
    return;
  }

  const directory = Gio.File.new_for_path(folderPath);
  directory.enumerate_children_async(
    "standard::*",
    Gio.FileQueryInfoFlags.NONE,
    GLib.PRIORITY_DEFAULT,
    null,
    (source, result) => {
      try {
        const enumerator = directory.enumerate_children_finish(result);
        const images = [];
        let info = null;
        // Iterate over directory entries.
        while ((info = enumerator.next_file(null)) !== null) {
          if (info.get_file_type() === Gio.FileType.REGULAR) {
            const mimeType = info.get_content_type();
            if (mimeType && mimeType.startsWith("image/")) {
              images.push(info.get_name());
            }
          }
        }
        // Close the enumerator.
        enumerator.close(null);
        console.log(`Loaded ${images.length} wallpaper(s) from ${folderPath}`);
        wallpaperImages.set(images);
      } catch (e) {
        console.error("Failed to load wallpapers asynchronously:", e);
      }
    }
  );
};

// Defer wallpaper loading until after the UI has rendered.
timeout(100, () => {
  loadWallpaperImagesAsync();
  return false;
});

// Utility function to chunk an array.
const chunkArray = (arr, size) => {
  const ret = [];
  for (let i = 0; i < arr.length; i += size) {
    ret.push(arr.slice(i, i + size));
  }
  return ret;
};

export default () => {
  const images = wallpaperImages.get() || [];
  console.log("Render component called, wallpaperImages =", images);
  const rows = chunkArray(images, 2);

  return (
    <Page label={"Themes"}>
      <box
        vertical
        spacing={8}
        className={"control-center__page_scrollable-content"}
      >
        {/* Mode Selection */}
        <box className="buttons-container" halign={Gtk.Align.CENTER}>
          <button
            onClick={() => setTheme(currentTheme.get(), "Light")}
            className={bind(currentMode).as(
              (mode) =>
                `mode-settings__button_left ${mode === "Light" ? "active" : ""}`
            )}
          >
            <label label="Light" />
          </button>
          <button
            onClick={() => setTheme(currentTheme.get(), "Dark")}
            className={bind(currentMode).as(
              (mode) =>
                `mode-settings__button_right ${mode === "Dark" ? "active" : ""}`
            )}
          >
            <label label="Dark" />
          </button>
        </box>

        {/* Theme Selection */}
        <label label="Theme" className="theme" halign={Gtk.Align.CENTER} />
        <box
          horizontal
          className="buttons-container"
          spacing={spacing}
          halign={Gtk.Align.CENTER}
        >
          <box vertical>
            <button
              onClick={() => setTheme("Verdant", currentMode.get())}
              className={bind(currentTheme).as(
                (theme) =>
                  `theme-buttons ${theme === "Verdant" ? "active" : ""}`
              )}
            >
              <icon icon={icons.seasons.spring} className="icon" />
            </button>
            <label label="Verdant" className="label" />
          </box>
          <box vertical>
            <button
              onClick={() => setTheme("Zephyr", currentMode.get())}
              className={bind(currentTheme).as(
                (theme) =>
                  `theme-buttons ${theme === "Zephyr" ? "active" : ""}`
              )}
            >
              <icon icon={icons.seasons.summer} />
            </button>
            <label label="Zephyr" className="label" />
          </box>
          <box vertical>
            <button
              onClick={() => setTheme("Frolic", currentMode.get())}
              className={bind(currentTheme).as(
                (theme) =>
                  `theme-buttons ${theme === "Frolic" ? "active" : ""}`
              )}
            >
              <icon icon={icons.seasons.fall} />
            </button>
            <label label="Frolic" className="label" />
          </box>
          <box vertical>
            <button
              onClick={() => setTheme("Glaciara", currentMode.get())}
              className={bind(currentTheme).as(
                (theme) =>
                  `theme-buttons ${theme === "Glaciara" ? "active" : ""}`
              )}
            >
              <icon icon={icons.seasons.winter} />
            </button>
            <label label="Glaciara" className="label" />
          </box>
        </box>

        <box className="buttons-container" halign={Gtk.Align.CENTER}>
          <button
            className="primary-button"
            onClickRelease={(_, event) => {
              if (event.button === 1 && menuName) {
                controlCenterPage.set(menuName);
              }
            }}
            hexpand={true}
            halign={Gtk.Align.FILL}
          >
            <label label="Advanced settings" />
          </button>
        </box>

        {/* Wallpaper Section */}
        <label label="Wallpaper" className="h2" halign={Gtk.Align.CENTER} />
        <button
          onClick={chooseWallpaperDirectory}
          className="wallpaper-button"
        >
          <label label="Choose Wallpaper Directory" />
        </button>

        <box vertical className="wallpaper-thumbnails-container" halign={Gtk.Align.CENTER}>
          {rows.length > 0 ? (
            rows.map((row, rowIndex) => (
              <box key={rowIndex} horizontal spacing={8}>
                {row.map((image) => {
                  const currentFolder = wallpaperFolder.get();
                  const imagePath = `${currentFolder}/${image}`;
                  const url = `file://${imagePath}`;
                  console.log("Thumbnail URL inside loop:", url);

                  return (
                    <box key={image} vertical spacing={4}>
                      <Gtk.Image src={url} width_request={160} height_request={160} />
                      <button onClick={() => setWallpaper(image)}>
                        <label label={image} />
                      </button>
                    </box>
                  );
                })}
              </box>
            ))
          ) : (
            <label label="No wallpapers to display." />
          )}
        </box>
      </box>
    </Page>
  );
};
