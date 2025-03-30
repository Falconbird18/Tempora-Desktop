import Page from "../Page";
import { App, Gtk, Gdk, Widget } from "astal/gtk3";
import { bind, execAsync, timeout, Variable, exec } from "astal";
const { GLib, Gio } = imports.gi;
import { spacing } from "../../../lib/variables";
import icons from "../../../lib/icons";
import { controlCenterPage } from "../index";

const settingsFile = `${GLib.get_home_dir()}/.config/ags/theme-settings.json`;
const menuName = "advancedsettings";

const loadSettings = () => {
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
  };
};

const saveSettings = (theme: string, mode: string, slideshow: boolean, wallpaper: string, wallpaperDirectory: string) => {
  try {
    const file = Gio.File.new_for_path(settingsFile);
    const contents = JSON.stringify({ theme, mode, slideshow, wallpaper, wallpaperDirectory });
    file.replace_contents(contents, null, false, Gio.FileCreateFlags.NONE, null);
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
};

const settings = loadSettings();

export const currentTheme = Variable(settings.theme);
export const currentMode = Variable(settings.mode);
export const slideshow = Variable(settings.slideshow);
export const wallpaperImage = Variable(settings.wallpaper);
export const wallpaperFolder = Variable(settings.wallpaperDirectory);

const setTheme = (theme: string, mode: string) => {
  currentTheme.set(theme);
  currentMode.set(mode);
  saveSettings(theme, mode, slideshow.get(), wallpaperImage.get(), wallpaperFolder.get());
};

const setSlideshow = (isSlideshow: boolean) => {
  slideshow.set(isSlideshow);
  saveSettings(currentTheme.get(), currentMode.get(), isSlideshow, wallpaperImage.get(), wallpaperFolder.get());
};

const setWallpaper = (wallpaper: string) => {
  wallpaperImage.set(wallpaper);
  saveSettings(currentTheme.get(), currentMode.get(), slideshow.get(), wallpaper, wallpaperFolder.get());
  console.log(`New Wallpaper: ${wallpaper}`);

  const wallpaperImagePath = `${wallpaperFolder.get()}/${wallpaper}`;
  const destinationPath = `/usr/share/sddm/themes/frolic/Backgrounds/wallpaper.jpg`;

  try {
    // Ensure the destination directory exists
    exec(`mkdir -p /usr/share/sddm/themes/frolic/Backgrounds`);

    // Copy and rename the wallpaper (requires sudo if destination is a system directory)
    exec(`cp "${wallpaperImagePath}" "${destinationPath}"`);

    // Set the wallpaper using swww
    exec(
      `swww img "${destinationPath}" --transition-step 100 --transition-fps 120 --transition-type grow --transition-angle 30 --transition-duration 1`
    );
  } catch (e) {
    console.error("Failed to set wallpaper:", e);
  }
};

const setWallpaperDirectory = (wallpaperDirectory: string) => {
  wallpaperFolder.set(wallpaperDirectory);
  saveSettings(currentTheme.get(), currentMode.get(), slideshow.get(), wallpaperImage.get(), wallpaperDirectory);
};

const chooseWallpaperDirectory = () => {
  const chooser = Gtk.FileChooserDialog.new(
    "Choose Wallpaper Directory",
    null,
    Gtk.FileChooserAction.SELECT_FOLDER,
    "Select",
    "Cancel"
  );
  chooser.set_modal(false);
  chooser.set_transient_for(null);
  chooser.set_skip_taskbar_hint(true);
  chooser.set_skip_pager_hint(true);
  chooser.connect("response", (chooser, response) => {
    if (response === Gtk.ResponseType.ACCEPT) {
      const file = chooser.get_filename();
      setWallpaperDirectory(file);
    }
    chooser.destroy();
  });
  chooser.show_all();
};

const getWallpaperImages = () => {
  const images = [];
  if (wallpaperFolder.get()) {
    const directory = Gio.File.new_for_path(wallpaperFolder.get());
    const enumerator = directory.enumerate_children("standard::*", Gio.FileQueryInfoFlags.NONE, null);
    while (true) {
      const info = enumerator.next_file(null);
      if (!info) break;
      if (info.get_file_type() === Gio.FileType.REGULAR) {
        const mimeType = info.get_content_type();
        if (mimeType.startsWith("image/")) {
          images.push(info.get_name());
        }
      }
    }
  }
  return images;
};

const chunkArray = (arr, size) => {
  return arr.reduce((acc, _, i) => {
    if (i % size === 0) acc.push(arr.slice(i, i + size));
    return acc;
  }, []);
};

export default () => {
  const images = getWallpaperImages();
  const rows = chunkArray(images, 2);

  return (
    <Page label={"Themes"}>
      <box
        vertical
        spacing={8}
        className={"control-center__page_scrollable-content"}
      >
        <box className="buttons-container" halign={Gtk.Align.CENTER}>
          <button
            onClick={() => setTheme(currentTheme.get(), "Light")}
            className={bind(currentMode).as(mode =>
              `mode-settings__button_left ${mode === "Light" ? "active" : ""}`
            )}
          >
            <label label="Light" />
          </button>
          <button
            onClick={() => setTheme(currentTheme.get(), "Dark")}
            className={bind(currentMode).as(mode =>
              `mode-settings__button_right ${mode === "Dark" ? "active" : ""}`
            )}
          >
            <label label="Dark" />
          </button>
        </box>
        <label label="Theme" className="theme" halign={Gtk.Align.CENTER} />
        <box horizontal className="buttons-container" spacing={spacing} halign={Gtk.Align.CENTER}>
          <box vertical>
            <button onClick={() => setTheme("Verdant", currentMode.get())} className="theme-buttons">
              <icon icon={icons.seasons.spring} className="icon" />
            </button>
            <label label="Verdant" className="label" />
          </box>
          <box vertical>
            <button onClick={() => setTheme("Zephyr", currentMode.get())} className="theme-buttons">
              <icon icon={icons.seasons.summer} />
            </button>
            <label label="Zephyr" className="label" />
          </box>
          <box vertical>
            <button onClick={() => setTheme("Frolic", currentMode.get())} className="theme-buttons">
              <icon icon={icons.seasons.fall} />
            </button>
            <label label="Frolic" className="label" />
          </box>
          <box vertical>
            <button onClick={() => setTheme("Glaciara", currentMode.get())} className="theme-buttons">
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
        <label label="Wallpaper" className="theme" halign={Gtk.Align.CENTER} />
        {/* <box horizontal className="switches-container">
          <box vertical valign={Gtk.Align.CENTER}>
            <switch
              active={slideshow.get()}
              onActivate={() => setSlideshow(!slideshow.get())}
            />
            <label label="Slideshow" className="label" />
          </box>
          <box vertical valign={Gtk.Align.CENTER}>
            <switch
              active={wallpaperImage.get() !== ""}
              onActivate={() =>
                setWallpaper(wallpaperImage.get() === "" ? "default" : wallpaperImage.get())
              }
            />
            <label label="Set Wallpaper" className="label" />
          </box>
        </box> */}
        <button onClick={chooseWallpaperDirectory} className="wallpaper-button">
          <label label="Choose Wallpaper Directory" />
        </button>
        <box vertical className="wallpaper-thumbnails-container" halign={Gtk.Align.CENTER}>
          {rows.map((row, rowIndex) => (
            <box key={rowIndex} horizontal>
              {row.map((image) => {
                const imagePath = `${wallpaperFolder.get()}/${image}`;
                return (
                  <button
                    key={image}
                    className="thumbnail-box"
                    css={`
                      background-image: url("${imagePath}");
                      min-width: 160px;
                      min-height: 160px;
                      background-size: cover;
                      background-position: center;
                    `}
                    onClick={() => setWallpaper(image)}
                  />
                );
              })}
            </box>
          ))}
        </box>
      </box>
    </Page>
  );
};