import Page from "../Page";
import { App, Gtk, Gdk, Widget } from "astal/gtk3";
import { bind, execAsync, timeout, Variable, exec } from "astal";
import { loadSettings, saveSettings } from "../../../service/LoadSave";
const { GLib, Gio } = imports.gi;
import { spacing } from "../../../lib/variables";
import icons from "../../../lib/icons";
import { controlCenterPage } from "../index";
import GdkPixbuf from 'gi://GdkPixbuf';
import { totalWorkspaces, hideEmptyWorkspaces, settingsChanged, showNumbers, workspaceIcons, transparentItems } from "./AdvancedThemes";

const menuName = "advancedsettings";

const THUMBNAIL_SIZE = 160; // Desired thumbnail size in pixels
const THUMBNAIL_CACHE_DIR = `${GLib.get_user_cache_dir()}/ags/thumbnails/wallpapers`;
const homeDir = GLib.get_home_dir();

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
    try {
        const pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(
            originalPath,
            size,
            size,
            true // preserve aspect ratio
        );
        
        if (pixbuf) {
            pixbuf.savev(thumbPath, "jpeg", [], []);
            console.log(`Successfully generated thumbnail: ${thumbPath}`);
        }
    } catch (error) {
        console.error(`Failed to generate thumbnail for ${originalPath}:`, error);
    }
};

const settings = loadSettings();

export const currentTheme = Variable(settings.theme);
export const currentMode = Variable(settings.mode);
export const slideshow = Variable(settings.slideshow);
export const wallpaperImage = Variable(settings.wallpaper);
export const wallpaperFolder = Variable(settings.wallpaperDirectory);
export const useBing = Variable(settings.useBingWallpaper);


const setTheme = (theme: string, mode: string) => {
  currentTheme.set(theme);
  currentMode.set(mode);
  saveSettings(theme, mode, slideshow.get(), wallpaperImage.get(), wallpaperFolder.get(), useBing.get(), totalWorkspaces.get(), showNumbers.get(), hideEmptyWorkspaces.get(), workspaceIcons.get(), transparentItems.get());
};

const setSlideshow = (isSlideshow: boolean) => {
  slideshow.set(isSlideshow);
  saveSettings(currentTheme.get(), currentMode.get(), isSlideshow, wallpaperImage.get(), wallpaperFolder.get(), useBing.get(), totalWorkspaces.get(), showNumbers.get(), hideEmptyWorkspaces.get(), workspaceIcons.get(), transparentItems.get());
};

const setWallpaper = async (wallpaperName: string) => {
  wallpaperImage.set(wallpaperName);
  useBing.set(false); // Disable Bing wallpaper when a custom wallpaper is set
  saveSettings(currentTheme.get(), currentMode.get(), slideshow.get(), wallpaperName, wallpaperFolder.get(), useBing, totalWorkspaces.get(), showNumbers.get(), hideEmptyWorkspaces.get(), workspaceIcons.get(), transparentItems.get());
  console.log(`Setting Wallpaper to: ${wallpaperName}`);

  const wallpaperImagePath = `${wallpaperFolder.get()}/${wallpaperName}`;
  const destinationDir = `${homeDir}/.config/ags/`;
  const destinationPath = `${destinationDir}/wallpaper.jpg`;

  // Check if source file exists
  const sourceFile = Gio.File.new_for_path(wallpaperImagePath);
  if (!sourceFile.query_exists(null)) {
    console.error(`Wallpaper source file not found: ${wallpaperImagePath}`);
    return;
  }

  try {
    // Create destination directory if it doesn't exist
    await execAsync(['mkdir', '-p', destinationDir]);
  // Ensure thumbnail cache directory exists when the component is created
    
    // Copy the wallpaper file
    await execAsync(['cp', wallpaperImagePath, destinationPath]);
    
    // Set the wallpaper using swww
    await execAsync([
      'swww', 'img', destinationPath,
      '--transition-step', '100',
      '--transition-fps', '120',
      '--transition-type', 'grow',
      '--transition-angle', '30',
      '--transition-duration', '1'
    ]);
    
    console.log("Wallpaper set successfully.");
  } catch (error) {
    console.error("Failed to set wallpaper:", error);
  }

  // Use pkexec for privilege escalation if needed, or notify user to run command manually.
  // Direct `exec` might fail due to permissions.
  const copyCommand = `cp "${wallpaperImagePath}" "${destinationPath}"`;
  const swwwCommand = `swww img "${destinationPath}" --transition-step 100 --transition-fps 120 --transition-type grow --transition-angle 30 --transition-duration 1`;

  // Ensure destination directory exists (needs sudo/pkexec)
  exec([ 'mkdir', '-p', destinationDir])
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
  saveSettings(currentTheme.get(), currentMode.get(), slideshow.get(), wallpaperImage.get(), wallpaperDirectory, useBing.get(), totalWorkspaces.get(), showNumbers.get(), hideEmptyWorkspaces.get(), workspaceIcons.get(), transparentItems.get());

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
  ensureDir(THUMBNAIL_CACHE_DIR);

  const imagePaths = Variable<string[]>([]);


  const updateImageList = () => {
    const currentDir = wallpaperFolder.get();
    const paths = getWallpaperImagePaths(currentDir);
    // Check if the paths actually changed before updating to avoid unnecessary redraws
    if (JSON.stringify(imagePaths.value) !== JSON.stringify(paths)) {
        imagePaths.set(paths); // Update the variable, this will trigger the hook below
        console.log("imagePaths updated in updateImageList:", paths);
    } else {
        console.log("imagePaths unchanged in updateImageList.");
    }
  };

  const setWallpaperDirectory = (wallpaperDirectory: string) => {
    const oldDirectory = wallpaperFolder.get();
    if (oldDirectory === wallpaperDirectory) return; // No change

    if (!wallpaperDirectory || !GLib.file_test(wallpaperDirectory, GLib.FileTest.IS_DIR)) {
        console.warn(`Invalid or non-existent directory entered: ${wallpaperDirectory}`);
        return;
    }


    wallpaperFolder.set(wallpaperDirectory);
    // For simplicity, let's keep the current wallpaper setting but it might become invalid.
    saveSettings(currentTheme.get(), currentMode.get(), slideshow.get(), wallpaperImage.get(), wallpaperDirectory, useBing.get(), totalWorkspaces.get(), showNumbers.get(), hideEmptyWorkspaces.get(), workspaceIcons.get(), transparentItems.get());

    console.log(`Wallpaper directory set to: ${wallpaperDirectory}`);

    updateImageList(); // Refresh the list of images shown in the grid
  };

  updateImageList(); // Load images for the initial directory


  const thumbnailGrid = new Widget.Box({
    vertical: true,
    css: "min-height: 500px;",
    halign: Gtk.Align.CENTER,
    setup: self => {
        // Initial setup
        updateImageList();
        const paths = imagePaths.get();
        console.log("Setting up thumbnail grid with paths:", paths);
        
        if (Array.isArray(paths)) {
            const rows = chunkArray(paths, 2);
            self.children = rows.map((row, rowIndex) => new Widget.Box({
                key: `row-${rowIndex}`,
                homogeneous: true,
                spacing: spacing / 2,
                className: "wallpaper-thumbnail-row",
                children: row.map((imagePath) => {
                    const imageName = GLib.path_get_basename(imagePath);
                    const thumbPath = getThumbnailPath(imagePath);
                    
                    // Generate thumbnail if it doesn't exist
                    if (!GLib.file_test(thumbPath, GLib.FileTest.EXISTS)) {
                        generateThumbnailAsync(imagePath, thumbPath, THUMBNAIL_SIZE)
                            .catch(e => console.error(`Thumbnail generation failed for ${imageName}:`, e));
                    }

                    return new Widget.Button({
                        key: imageName,
                        tooltip_text: imageName,
                        className: bind(wallpaperImage).as(wp => `thumbnail-box ${wp === imageName ? 'active' : ''}`),
                        css: `
                            background-image: url("${thumbPath}");
                            min-width: ${THUMBNAIL_SIZE}px;
                            min-height: ${THUMBNAIL_SIZE}px;
                            background-size: cover;
                            background-position: center;
                            margin: ${spacing / 4}px;
                            border-radius: ${spacing / 2}px;
                        `,
                        on_clicked: () => setWallpaper(imageName),
                    });
                }),
            }));
        }

        // Hook for updates
        self.hook(imagePaths, () => {
            const paths = imagePaths.get();
            if (Array.isArray(paths)) {
                const rows = chunkArray(paths, 2);
                self.children = rows.map((row, rowIndex) => new Widget.Box({
                    key: `row-${rowIndex}`,
                    homogeneous: true,
                    spacing: spacing / 2,
                    className: "wallpaper-thumbnail-row",
                    children: row.map((imagePath) => {
                        const imageName = GLib.path_get_basename(imagePath);
                        const thumbPath = getThumbnailPath(imagePath);
                        
                        // Generate thumbnail if it doesn't exist
                        if (!GLib.file_test(thumbPath, GLib.FileTest.EXISTS)) {
                            generateThumbnailAsync(imagePath, thumbPath, THUMBNAIL_SIZE)
                                .catch(e => console.error(`Thumbnail generation failed for ${imageName}:`, e));
                        }

                        return new Widget.Button({
                            key: imageName,
                            tooltip_text: imageName,
                            className: bind(wallpaperImage).as(wp => `thumbnail-box ${wp === imageName ? 'active' : ''}`),
                            css: `
                                background-image: url("${thumbPath}");
                                min-width: ${THUMBNAIL_SIZE}px;
                                min-height: ${THUMBNAIL_SIZE}px;
                                background-size: cover;
                                background-position: center;
                                margin: ${spacing / 4}px;
                                border-radius: ${spacing / 2}px;
                            `,
                            on_clicked: () => setWallpaper(imageName),
                        });
                    }),
                }));
            }
            self.show_all();
        });
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

        <box className="settings-row" vertical={false} spacing={spacing}>
          <label label="Use Bing Wallpaper of the Day" hexpand={true} xalign={0} />
          <switch
            active={bind(useBing)} // Correct: Binds the switch's visual state to the variable
            // Use 'notify::active' signal which fires *after* the state has changed
            // The handler receives the switch widget itself as 'self'
            onNotifyActive={(self) => {
              const isActive = self.active; // Get the new boolean state from the switch
              useBing.set(isActive); // Update the variable state

              // Call saveSettings with the *correct boolean value* (isActive)
              saveSettings(
                currentTheme.get(),
                currentMode.get(),
                slideshow.get(),
                wallpaperImage.get(),
                wallpaperFolder.get(),
                isActive, // Pass the boolean value here
                totalWorkspaces.get(),
                showNumbers.get(),
                hideEmptyWorkspaces.get(),
                workspaceIcons.get(),
                transparentItems.get()
              );
              console.log(`Toggled Use Bing Wallpaper to: ${isActive}`); // Optional logging

              if (isActive) {
                // When enabling Bing wallpaper
                const bingPath = `${GLib.get_home_dir()}/.config/ags/bing.jpg`;
                if (GLib.file_test(bingPath, GLib.FileTest.EXISTS)) {
                  exec(`swww img "${bingPath}" --transition-step 100 --transition-fps 120 --transition-type grow --transition-angle 30 --transition-duration 1`);
                }
              } else {
                // When disabling Bing wallpaper
                const selectedWallpaper = wallpaperImage.get();
                if (selectedWallpaper) {
                  const fullPath = GLib.build_filenamev([wallpaperFolder.get(), selectedWallpaper]);
                  if (GLib.file_test(fullPath, GLib.FileTest.EXISTS)) {
                    exec(`swww img "${fullPath}" --transition-step 100 --transition-fps 120 --transition-type grow --transition-angle 30 --transition-duration 1`);
                  }
                }
              }
            }}
          />
        </box>



        {/* Slideshow switch could go here if uncommented */}

        <box vertical={false} spacing={spacing} className="settings-row">
             <label label="Folder" xalign={0} />
             <entry
                hexpand={true}
                // Bind the text property to the variable
                text={bind(wallpaperFolder)}
                // Update the directory when Enter is pressed
                on_activate={self => {
                    setWallpaperDirectory(self.text || ""); // Pass the current text
                }}
                // Optional: Update when focus is lost
                on_focus_out_event={self => {
                    setWallpaperDirectory(self.text || "");
                    return false; // Allow event propagation
                }}
                tooltip_text="Enter the full path to your wallpaper directory and press Enter"
             />
        </box>

        <box
          vertical={true}
          // Removed ScrolledWindow properties, add back if needed
          // hscrollbar_policy={Gtk.PolicyType.NEVER}
          // vscrollbar_policy={Gtk.PolicyType.AUTOMATIC}
          className="wallpaper-grid-container" // Added class for potential styling
          child={thumbnailGrid}
        />
      </box>
    </Page>
  );
};
