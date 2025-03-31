import Page from "../Page";
import { App, Gtk, Gdk, Widget } from "astal/gtk3";
import { bind, execAsync, timeout, Variable, exec } from "astal";

const { GLib, Gio } = imports.gi;

import { spacing } from "../../../lib/variables";
import icons from "../../../lib/icons";
import { controlCenterPage } from "../index";

const settingsFile = `${GLib.get_home_dir()}/.config/ags/theme-settings.json`;
const menuName = "advancedsettings";

// --- Thumbnail Configuration ---
const THUMBNAIL_SIZE = 160; // Desired thumbnail size in pixels
const THUMBNAIL_CACHE_DIR = `${GLib.get_user_cache_dir()}/ags/thumbnails/wallpapers`;

// Ensures a directory exists
const ensureDir = (dirPath: string) => {
  const dir = Gio.File.new_for_path(dirPath);
  if (!dir.query_exists(null)) {
    GLib.mkdir_with_parents(dirPath, 0o755);
    console.log(`Created cache directory: ${dirPath}`);
  }
};

// Generates a unique path for a thumbnail based on the original image path
const getThumbnailPath = (originalImagePath: string): string => {
  const baseName = GLib.path_get_basename(originalImagePath);
  return `${THUMBNAIL_CACHE_DIR}/${baseName}`;
};

const generateThumbnailAsync = async (originalPath: string, thumbPath: string, size: number): Promise<void> => {
  const command = `convert "${originalPath}" -thumbnail ${size}x${size}^ -gravity center -extent ${size}x${size} "${thumbPath}"`;
  console.log(`Generating thumbnail: ${thumbPath}`);
  try {
    await exec(['bash', '-c', command]);
    console.log(`Successfully generated thumbnail: ${thumbPath}`);
  } catch (error) {
    console.error(`Failed to generate thumbnail for ${originalPath}:`, error);
    // Optionally, copy a placeholder 'error' thumbnail here
    // Utils.execAsync(['cp', '/path/to/error-thumbnail.png', thumbPath]).catch(e => {});
  }
};



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
  // Default settings
  return {
    theme: "Frolic",
    mode: "Light",
    slideshow: false,
    wallpaper: "747.jpg",
    wallpaperDirectory: "/home/austin/Pictures/wallpapers",
    workspaces: 10,
    numbers: false,
    hideEmptyWorkspaces: false,
    workspaceIcons: {},
  };
};

const saveSettings = (theme: string, mode: string, slideshow: boolean, wallpaper: string, wallpaperDirectory: string) => {
  try {
    const file = Gio.File.new_for_path(settingsFile);
    ensureDir(GLib.path_get_dirname(settingsFile)); // Ensure config dir exists
    const contents = JSON.stringify({ theme, mode, slideshow, wallpaper, wallpaperDirectory }, null, 2); // Pretty print JSON
    file.replace_contents(contents, null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
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
  // Apply theme changes immediately (assuming this is handled elsewhere based on variables)
};

const setSlideshow = (isSlideshow: boolean) => {
  slideshow.set(isSlideshow);
  saveSettings(currentTheme.get(), currentMode.get(), isSlideshow, wallpaperImage.get(), wallpaperFolder.get());
  // Handle slideshow logic (start/stop timers etc.)
};

const setWallpaper = (wallpaperName: string) => { // Expecting just the filename now
  wallpaperImage.set(wallpaperName);
  saveSettings(currentTheme.get(), currentMode.get(), slideshow.get(), wallpaperName, wallpaperFolder.get());
  console.log(`Setting Wallpaper to: ${wallpaperName}`);

  const wallpaperImagePath = `${wallpaperFolder.get()}/${wallpaperName}`;
  const destinationDir = "/usr/share/sddm/themes/frolic/Backgrounds"; // Use variable for clarity
  const destinationPath = `${destinationDir}/wallpaper.jpg`;

  // Check if source file exists
  const sourceFile = Gio.File.new_for_path(wallpaperImagePath);
  if (!sourceFile.query_exists(null)) {
    console.error(`Wallpaper source file not found: ${wallpaperImagePath}`);
    // Optionally show an error notification to the user
    // Notif.notify({ title: "Error", body: `Wallpaper file not found: ${wallpaperName}` });
    return;
  }

  // Use pkexec for privilege escalation if needed, or notify user to run command manually.
  // Direct `exec` might fail due to permissions.
  const copyCommand = `pkexec cp "${wallpaperImagePath}" "${destinationPath}"`;
  const swwwCommand = `swww img "${destinationPath}" --transition-step 100 --transition-fps 120 --transition-type grow --transition-angle 30 --transition-duration 1`;

  // Ensure destination directory exists (needs sudo/pkexec)
  exec(['pkexec', 'mkdir', '-p', destinationDir])
    .then(() => exec(['bash', '-c', copyCommand])) // Copy the wallpaper
    .then(() => exec(['bash', '-c', swwwCommand])) // Set the wallpaper via swww
    .then(() => console.log("Wallpaper set successfully."))
    .catch(e => {
      console.error("Failed to set wallpaper:", e);
      // Optionally show an error notification
      // Notif.notify({ title: "Wallpaper Error", body: "Failed to set wallpaper. Check permissions or logs." });
    });
};

const setWallpaperDirectory = (wallpaperDirectory: string) => {
  const oldDirectory = wallpaperFolder.get();
  if (oldDirectory === wallpaperDirectory) return; // No change

  wallpaperFolder.set(wallpaperDirectory);
  // For simplicity, let's keep the current wallpaper setting but it might become invalid.
  saveSettings(currentTheme.get(), currentMode.get(), slideshow.get(), wallpaperImage.get(), wallpaperDirectory);

  console.log("Wallpaper directory set. UI refresh might be needed manually.");

};

const chooseWallpaperDirectory = () => {
  const chooser = Gtk.FileChooserDialog.new(
    "Choose Wallpaper Directory",
    App.getWindow("control-center"), // Parent window if available
    Gtk.FileChooserAction.SELECT_FOLDER,
    null // No buttons initially
  );
  chooser.add_button("Cancel", Gtk.ResponseType.CANCEL);
  chooser.add_button("Select", Gtk.ResponseType.ACCEPT);

  // Set current directory
  chooser.set_current_folder(wallpaperFolder.get());

  chooser.set_modal(true); // Usually better for dialogs like this

  chooser.connect("response", (dialog, response) => {
    if (response === Gtk.ResponseType.ACCEPT) {
      const file = dialog.get_filename();
      if (file) {
        setWallpaperDirectory(file);
      }
    }
    dialog.destroy();
  });
  chooser.show_all();
};

// Gets FULL PATHS of valid image files in the directory
const getWallpaperImagePaths = (directoryPath: string): string[] => {
  const images: string[] = [];
  if (!directoryPath || !GLib.file_test(directoryPath, GLib.FileTest.IS_DIR)) {
    console.warn(`Wallpaper directory not found or invalid: ${directoryPath}`);
    return images; // Return empty array if directory is invalid
  }

  try {
    const directory = Gio.File.new_for_path(directoryPath);
    const enumerator = directory.enumerate_children(
      "standard::name,standard::type,standard::content-type", // Attributes needed
      Gio.FileQueryInfoFlags.NONE,
      null
    );

    let info;
    while ((info = enumerator.next_file(null))) {
      if (info.get_file_type() === Gio.FileType.REGULAR) {
        const mimeType = info.get_content_type();
        // More robust image type checking
        if (mimeType && (mimeType.startsWith("image/") && !mimeType.endsWith("svg+xml"))) {
          images.push(GLib.build_filenamev([directoryPath, info.get_name()])); // Get full path
        }
      }
    }
    enumerator.close(null); // Close the enumerator
  } catch (e) {
    console.error(`Failed to enumerate wallpaper directory ${directoryPath}:`, e);
  }
  console.log(`Images: ${images}`);
  return images;
};

// Chunks an array into smaller arrays of a given size
const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  if (size <= 0) return [arr]; // Avoid infinite loop
  return arr.reduce((acc: T[][], _, i) => {
    if (i % size === 0) acc.push(arr.slice(i, i + size));
    return acc;
  }, []);
};

export default () => {
  // Ensure thumbnail cache directory exists when the component is created
  ensureDir(THUMBNAIL_CACHE_DIR);

  const imagePaths = Variable<string[]>([]);

  const updateImageList = () => {
    const currentDir = wallpaperFolder.get();
    const paths = getWallpaperImagePaths(currentDir);
    imagePaths.set(paths); // Update the variable
    console.log("imagePaths in updateImageList:", paths);
  };

  updateImageList(); // Load images for the initial directory
  console.log("Initial imagePaths after updateImageList:", imagePaths.get());

  const thumbnailGrid = new Widget.Box({
    vertical: true,
    css: "min-height: 500px;",
    halign: Gtk.Align.CENTER,
    children: [], // Initialize with an empty children array
    setup: self => {
      const paths = imagePaths.get(); // Get the current value of imagePaths
      console.log("Initial imagePaths in setup:", paths);
      console.log("Number of paths received:", paths.length);
      self.children = [];

      const rows = chunkArray(paths, 2);
      console.log("Rows array:", rows);

      self.children = rows.map((row, rowIndex) => new Widget.Box({
        key: `row-${rowIndex}`,
        homogeneous: false,
        spacing: spacing / 2,
        className: "wallpaper-thumbnail-row",
        children: row.map((imagePath) => {
          const imageName = GLib.path_get_basename(imagePath);
          const thumbPath = getThumbnailPath(imagePath);
          console.log(`Thumbnail path for ${imageName}: ${thumbPath}`);
          const thumbUrl = `file://${thumbPath}`;
          const thumbExists = GLib.file_test(thumbPath, GLib.FileTest.EXISTS);

          return new Widget.Button({
            key: imageName,
            tooltip_text: imageName,
            className: `thumbnail-box ${wallpaperImage.get() === imageName ? 'active' : ''}`,
            css: `
                                background-image: url("${thumbPath}");
                                min-width: ${THUMBNAIL_SIZE * 0.8}px;
                                min-height: ${THUMBNAIL_SIZE * 0.8}px;
                                background-size: cover;
                                background-position: center;
                                ${!thumbExists ? 'background-color: rgba(255, 255, 255, 0.1);' : ''}
                                margin: ${spacing / 4}px;
                                border-radius: ${spacing / 2}px;
                            `,
            on_clicked: () => setWallpaper(imageName),
            setup: btn => btn.hook(wallpaperImage, () => {
              btn.toggleClassName('active', wallpaperImage.get() === imageName);
            }),
          });
        }),
      }));
      self.show_all();
    },
  });

  return (
    <Page label={"Themes"}>
      <box
        vertical
        spacing={8}
        className={"control-center__page_scrollable-content"}
      >
        {/* --- Mode Settings --- */}
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
          {/* Theme buttons */}
          <box vertical>
            <button onClick={() => setTheme("Verdant", currentMode.get())} className={bind(currentTheme).as(t => `theme-buttons ${t === 'Verdant' ? 'active' : ''}`)}>
              <icon icon={icons.seasons.spring} className="icon" />
            </button>
            <label label="Verdant" className="label" />
          </box>
          <box vertical>
            <button onClick={() => setTheme("Zephyr", currentMode.get())} className={bind(currentTheme).as(t => `theme-buttons ${t === 'Zephyr' ? 'active' : ''}`)}>
              <icon icon={icons.seasons.summer} />
            </button>
            <label label="Zephyr" className="label" />
          </box>
          <box vertical>
            <button onClick={() => setTheme("Frolic", currentMode.get())} className={bind(currentTheme).as(t => `theme-buttons ${t === 'Frolic' ? 'active' : ''}`)}>
              <icon icon={icons.seasons.fall} />
            </button>
            <label label="Frolic" className="label" />
          </box>
          <box vertical>
            <button onClick={() => setTheme("Glaciara", currentMode.get())} className={bind(currentTheme).as(t => `theme-buttons ${t === 'Glaciara' ? 'active' : ''}`)}>
              <icon icon={icons.seasons.winter} />
            </button>
            <label label="Glaciara" className="label" />
          </box>
        </box>

        {/* --- Advanced Settings Link --- */}
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

        {/* --- Wallpaper Section --- */}
        <label label="Wallpaper" className="theme" halign={Gtk.Align.CENTER} />

        {/* Slideshow switch could go here if uncommented */}

        <button onClick={chooseWallpaperDirectory} className="wallpaper-button">
          {/* Bind label to show current folder */}
          <label label={bind(wallpaperFolder).as(f => `Folder: ${GLib.path_get_basename(f || 'None')}`)} />
        </button>

        {/* --- Thumbnail Grid --- */}
        {/* Wrap the grid in a ScrolledWindow if it might overflow vertically */}
        <box
          vertical={true}
          hscrollbar_policy={Gtk.PolicyType.NEVER}
          vscrollbar_policy={Gtk.PolicyType.AUTOMATIC}
          // child={new Widget.Label({label:"Hi"})}
          child={thumbnailGrid}
        />
      </box>
    </Page>
  );
};