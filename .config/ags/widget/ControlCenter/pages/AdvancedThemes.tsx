import Page from "../Page";
import { App, Gtk, Gdk, Widget } from "astal/gtk3";
import { bind, execAsync, timeout, Variable, exec } from "astal";
const { GLib, Gio } = imports.gi;
import { spacing } from "../../../lib/variables";
import icons from "../../../lib/icons";
import { ComboBox, ComboBoxText } from "../../../common/Types";

const settingsFile = `${GLib.get_home_dir()}/.config/ags/theme-settings.json`;

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
    workspaces: 10,
    numbers: false,
    hideEmptyWorkspaces: false,
    workspaceIcons: {},
  };
};

const saveSettings = (
  theme: string,
  mode: string,
  slideshow: boolean,
  wallpaper: string,
  wallpaperDirectory: string,
  workspaces: number,
  numbers: boolean,
  hideEmptyWorkspaces: boolean,
  workspaceIcons: { [key: number]: string },
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
      workspaceIcons,
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

export const currentTheme = Variable(settings.theme);
export const currentMode = Variable(settings.mode);
export const slideshow = Variable(settings.slideshow);
export const wallpaperImage = Variable(settings.wallpaper);
export const wallpaperFolder = Variable(settings.wallpaperDirectory);
export const totalWorkspaces = Variable(settings.workspaces);
export const hideEmptyWorkspaces = Variable(settings.hideEmptyWorkspaces);
export const settingsChanged = Variable(0);
export const showNumbers = Variable(settings.numbers);
export const workspaceIcons = Variable(settings.workspaceIcons || {});

const setWorkspaces = (workspaces: number) => {
  const newValue = Math.max(1, Math.min(20, workspaces));
  totalWorkspaces.set(newValue);
  saveSettings(
    currentTheme.get(),
    currentMode.get(),
    slideshow.get(),
    wallpaperImage.get(),
    wallpaperFolder.get(),
    newValue,
    showNumbers.get(),
    hideEmptyWorkspaces.get(),
    workspaceIcons.get(),
  );
  settingsChanged.set(settingsChanged.get() + 1);
};

const setShowNumbers = (numbers: boolean) => {
  showNumbers.set(numbers);
  saveSettings(
    currentTheme.get(),
    currentMode.get(),
    slideshow.get(),
    wallpaperImage.get(),
    wallpaperFolder.get(),
    totalWorkspaces.get(),
    numbers,
    hideEmptyWorkspaces.get(),
    workspaceIcons.get(),
  );
  settingsChanged.set(settingsChanged.get() + 1);
};

const setHideEmptyWorkspaces = (hide: boolean) => {
  hideEmptyWorkspaces.set(hide);
  saveSettings(
    currentTheme.get(),
    currentMode.get(),
    slideshow.get(),
    wallpaperImage.get(),
    wallpaperFolder.get(),
    totalWorkspaces.get(),
    showNumbers.get(),
    hide,
    workspaceIcons.get(),
  );
  settingsChanged.set(settingsChanged.get() + 1);
};

const setWorkspaceIcon = (workspaceId: number, icon: string) => {
  const currentIcons = workspaceIcons.get();
  if (icon.trim() === "") {
    delete currentIcons[workspaceId];
  } else {
    currentIcons[workspaceId] = icon;
  }
  workspaceIcons.set({ ...currentIcons });
  saveSettings(
    currentTheme.get(),
    currentMode.get(),
    slideshow.get(),
    wallpaperImage.get(),
    wallpaperFolder.get(),
    totalWorkspaces.get(),
    showNumbers.get(),
    hideEmptyWorkspaces.get(),
    workspaceIcons.get(),
  );
  settingsChanged.set(settingsChanged.get() + 1);
};

const removeWorkspaceIcon = (workspaceId: number) => {
  const currentIcons = workspaceIcons.get();
  delete currentIcons[workspaceId];
  workspaceIcons.set({ ...currentIcons });
  saveSettings(
    currentTheme.get(),
    currentMode.get(),
    slideshow.get(),
    wallpaperImage.get(),
    wallpaperFolder.get(),
    totalWorkspaces.get(),
    showNumbers.get(),
    hideEmptyWorkspaces.get(),
    workspaceIcons.get(),
  );
  settingsChanged.set(settingsChanged.get() + 1);
};

const showAddIconForm = Variable(false);


export default () => {
  return (
    <Page label={"AdvancedSettings"}>
      <box
        vertical
        spacing={8}
        className={"control-center__page_scrollable-content"}
      >
        {/* Workspace Control */}
        <box vertical className="advanced-container" halign={Gtk.Align.CENTER}>
          <box horizontal halign={Gtk.Align.FILL} className="setting-box">
            <label
              label="Workspaces"
              className="h3"
              halign={Gtk.Align.START}
              hexpand={false}
              valign={Gtk.Align.CENTER}
            />
            <box
              horizontal
              spacing={spacing}
              halign={Gtk.Align.END}
              className="workspace-container"
              hexpand={true}
            >
              <button
                onClick={() => setWorkspaces(totalWorkspaces.get() - 1)}
                className="workspace-button"
              >
                <label label="-" className="paragraph" />
              </button>
              <label
                label={bind(totalWorkspaces).as((ws) => ws.toString())}
                className="h3"
              />
              <button
                onClick={() => setWorkspaces(totalWorkspaces.get() + 1)}
                className="workspace-button"
              >
                <label label="+" className="paragraph" />
              </button>
            </box>
          </box>

          {/* Show workspace numbers */}
          <box horizontal halign={Gtk.Align.FILL} className="setting-box">
            <label
              label="Show workspace numbers"
              className="h3"
              halign={Gtk.Align.START}
              hexpand={false}
              valign={Gtk.Align.CENTER}
            />
            <box horizontal halign={Gtk.Align.END} hexpand={true} valign={Gtk.Align.CENTER}>
              <switch
                active={bind(showNumbers).as((numbers) => numbers)}
                onNotifyActive={(self) => {
                  const newValue = self.active;
                  if (newValue !== showNumbers.get()) {
                    console.log(
                      "Toggling showNumbers from",
                      showNumbers.get(),
                      "to",
                      newValue,
                    );
                    setShowNumbers(newValue);
                  }
                }}
              />
            </box>
          </box>

          {/* Hide Empty Workspaces Switch */}
          <box horizontal halign={Gtk.Align.FILL} className="setting-box">
            <label
              label="Hide empty workspaces"
              className="h3"
              halign={Gtk.Align.START}
              hexpand={false}
              valign={Gtk.Align.CENTER}
            />
            <box horizontal halign={Gtk.Align.END} hexpand={true} valign={Gtk.Align.CENTER}>
              <switch
                active={bind(hideEmptyWorkspaces).as((hide) => hide)}
                onNotifyActive={(self) => {
                  const newValue = self.active;
                  if (newValue !== hideEmptyWorkspaces.get()) {
                    console.log(
                      "Toggling hidden empty workspaces from",
                      hideEmptyWorkspaces.get(),
                      "to",
                      newValue,
                    );
                    setHideEmptyWorkspaces(newValue);
                  }
                }}
              />
            </box>
          </box>

          {/* Workspace Icons Section */}
          <box horizontal halign={Gtk.Align.FILL} className="setting-box">
            <label
              label="Workspace Icons"
              className="h3"
              halign={Gtk.Align.START}
            />
            {/* Add Icon Button */}
            <button
              onClick={() => showAddIconForm.set(true)}
              className="add-icon-button"
              hexpand="false"
              halign={Gtk.Align.END}
            >
              <label label="+" />
            </button>
          </box>

          {/* Add Icon Form */}
          <box
            vertical
            spacing={4}
            className="add-icon-form"
            visible={bind(showAddIconForm).as((v) => v)}
            hexpand="true"
          >
            <entry
              placeholderText="Workspace number"
              className="workspace-number-entry"
            />
            <entry
              placeholderText="Icon"
              className="icon-entry"
            />
            <box horizontal spacing={8} halign={Gtk.Align.CENTER}>
              <button
                onClick={(self) => {
                  const form = self.get_parent().get_parent();
                  const numberEntry = form.get_children()[0]; // First child
                  const iconEntry = form.get_children()[1];   // Second child
                  const workspaceId = parseInt(numberEntry.text.trim());
                  const icon = iconEntry.text.trim();

                  if (
                    !isNaN(workspaceId) &&
                    workspaceId >= 1 &&
                    workspaceId <= totalWorkspaces.get() &&
                    icon
                  ) {
                    setWorkspaceIcon(workspaceId, icon);
                    numberEntry.text = "";
                    iconEntry.text = "";
                    showAddIconForm.set(false);
                  } else {
                    console.error("Invalid workspace number or icon");
                  }
                }}
                className="submit-button"
              >
                <label label="Save" className="paragraph" />
              </button>
              <button
                onClick={(self) => {
                  const form = self.get_parent().get_parent();
                  const numberEntry = form.get_children()[0];
                  const iconEntry = form.get_children()[1];
                  numberEntry.text = "";
                  iconEntry.text = "";
                  showAddIconForm.set(false);
                }}
                className="cancel-button"
              >
                <label label="Cancel" className="paragraph" />
              </button>
            </box>
          </box>
          {/* Icon Cards */}
          {bind(workspaceIcons).as((Icons) =>
            Object.entries(Icons).map(([id, icon]) => {
              let deleteClass = null;
              const deleteButton = (
                <button
                  className="delete-button delete-button-hidden"
                  onClick={() => removeWorkspaceIcon(parseInt(id))}
                  setup={(self) => {
                    deleteClass = self;
                  }}
                  halign={Gtk.Align.END}
                  hexpand="true"
                >
                  <icon icon={icons.ui.close} className="icon" />
                </button>
              );

              return (
                <eventbox
                  key={`icon-card-${id}`}
                  horizontal
                  spacing={8}
                  halign={Gtk.Align.FILL}
                  onEnterNotifyEvent={(self) => {
                    if (deleteClass) {
                      console.log("Hover enter:", id);
                      deleteClass.className = "delete-button-visible"
                      console.log("Current className:", deleteClass.className)
                    }
                  }}
                  onLeaveNotifyEvent={(self) => {
                    if (deleteClass) {
                      console.log("Hover leave:", id);
                      deleteClass.className = "delete-button-hidden";
                      console.log("Current className:", deleteClass.className)
                    }
                  }}
                >
                  <box className="icon-card">
                    <label
                      label={`Workspace ${id}: ${icon}`}
                      className="paragraph"
                      halign={Gtk.Align.START}
                    />
                    {deleteButton}
                  </box>
                </eventbox>
              );
            }),
          )}
<ComboBox>
  <ComboBoxText>
      <label label="Hi"/>
      <label label="Hi2"/>
  </ComboBoxText>
</ComboBox>
        </box>
      </box>
    </Page >
  );
};