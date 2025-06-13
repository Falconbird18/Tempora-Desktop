import Page from "../Page";
import { App, Astal, Gtk, Gdk, Widget } from "astal/gtk3";
import { bind, execAsync, timeout, Variable, exec, GObject } from "astal";
const { GLib, Gio } = imports.gi;
import { spacing } from "../../../lib/variables";
import icons from "../../../lib/icons";
import { ComboBoxText } from "../../../common/Types";
import {
  loadSettings,
  saveSettings,
  currentTheme,
  currentMode,
  slideshow,
  wallpaperImage,
  wallpaperFolder,
  useBing,
  totalWorkspaces,
  showNumbers,
  hideEmptyWorkspaces,
  workspaceIcons,
  transparentItems,
  settingsChanged,
  barLocation,
} from "../../../service/Settings";

const settings = loadSettings();

// Define Padding Options
const PaddingOptions = [
  { name: "Small", value: "5px" },
  { name: "Medium", value: "10px" },
  { name: "Large", value: "15px" },
  { name: "Extra Large", value: "20px" },
];

// New variable for padding size, initialize from loaded settings
export const paddingSize = Variable(
  settings.paddingSize || PaddingOptions[1].value,
);

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

// Remove this barLocation variable since it's now imported from LoadSave.ts
// export const barLocation = Variable({
//   name: settings.barLocation || "top",
//   anchor: BarLocations.Top.anchor,
// });

const setWorkspaces = (workspaces: number) => {
  const newValue = Math.max(1, Math.min(20, workspaces));
  totalWorkspaces.set(newValue);
  saveSettings(
    currentTheme.get(),
    currentMode.get(),
    slideshow.get(),
    wallpaperImage.get(),
    wallpaperFolder.get(),
    useBing.get(),
    newValue,
    showNumbers.get(),
    hideEmptyWorkspaces.get(),
    workspaceIcons.get(),
    transparentItems.get(),
    paddingSize.get(), // Add paddingSize here
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
    useBing.get(),
    totalWorkspaces.get(),
    numbers,
    hideEmptyWorkspaces.get(),
    workspaceIcons.get(),
    transparentItems.get(),
    paddingSize.get(), // Add paddingSize here
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
    useBing.get(),
    totalWorkspaces.get(),
    showNumbers.get(),
    hide,
    workspaceIcons.get(),
    transparentItems.get(),
    paddingSize.get(), // Add paddingSize here
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
    useBing.get(),
    totalWorkspaces.get(),
    showNumbers.get(),
    hideEmptyWorkspaces.get(),
    workspaceIcons.get(),
    transparentItems.get(),
    paddingSize.get(), // Add paddingSize here
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
    useBing.get(),
    totalWorkspaces.get(),
    showNumbers.get(),
    hideEmptyWorkspaces.get(),
    workspaceIcons.get(),
    transparentItems.get(),
    paddingSize.get(), // Add paddingSize here
  );
  settingsChanged.set(settingsChanged.get() + 1);
};

const setBarLocation = (location: keyof typeof BarLocations) => {
  barLocation.set(BarLocations[location]);
  saveSettings(
    currentTheme.get(),
    currentMode.get(),
    slideshow.get(),
    wallpaperImage.get(),
    wallpaperFolder.get(),
    useBing.get(),
    totalWorkspaces.get(),
    showNumbers.get(),
    hideEmptyWorkspaces.get(),
    workspaceIcons.get(),
    transparentItems.get(),
    paddingSize.get(), // Add paddingSize here
  );
  settingsChanged.set(settingsChanged.get() + 1);
};

// New function to set padding size
const setPaddingSize = (size: string) => {
  paddingSize.set(size);
  saveSettings(
    currentTheme.get(),
    currentMode.get(),
    slideshow.get(),
    wallpaperImage.get(),
    wallpaperFolder.get(),
    useBing.get(),
    totalWorkspaces.get(),
    showNumbers.get(),
    hideEmptyWorkspaces.get(),
    workspaceIcons.get(),
    transparentItems.get(),
    size, // Add paddingSize here
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
        {/* Bar Location Control */}
        <box vertical className="advanced-container" halign={Gtk.Align.CENTER}>
          <box horizontal halign={Gtk.Align.FILL} className="setting-box">
            <label
              label="Bar Location"
              className="h3"
              halign={Gtk.Align.START}
              hexpand={false}
              valign={Gtk.Align.CENTER}
            />
            <box horizontal halign={Gtk.Align.END} hexpand={true}>
              <ComboBoxText
                halign={Gtk.Align.END}
                className="combo-box-text"
                onChanged={(entry) => {
                  const selected = entry.get_active_text();
                  if (selected && selected in BarLocations) {
                    setBarLocation(selected as keyof typeof BarLocations);
                  }
                }}
                setup={(combo) => {
                  Object.keys(BarLocations).forEach((loc) =>
                    combo.append_text(loc),
                  );
                  const current = barLocation.get().name;
                  const index = Object.keys(BarLocations).findIndex(
                    (loc) =>
                      BarLocations[loc as keyof typeof BarLocations].name ===
                      current,
                  );
                  combo.set_active(index !== -1 ? index : 0);
                }}
              />
            </box>
          </box>
        </box>

        {/* Padding Size Control */}
        <box vertical className="advanced-container" halign={Gtk.Align.CENTER}>
          <box horizontal halign={Gtk.Align.FILL} className="setting-box">
            <label
              label="Padding Size"
              className="h3"
              halign={Gtk.Align.START}
              hexpand={false}
              valign={Gtk.Align.CENTER}
            />
            <box horizontal halign={Gtk.Align.END} hexpand={true}>
              <ComboBoxText
                halign={Gtk.Align.END}
                className="combo-box-text"
                onChanged={(entry) => {
                  const selectedName = entry.get_active_text();
                  const selectedOption = PaddingOptions.find(
                    (opt) => opt.name === selectedName,
                  );
                  if (selectedOption) {
                    setPaddingSize(selectedOption.value);
                  }
                }}
                setup={(combo) => {
                  PaddingOptions.forEach((opt) => combo.append_text(opt.name));
                  const currentPadding = paddingSize.get();
                  const index = PaddingOptions.findIndex(
                    (opt) => opt.value === currentPadding,
                  );
                  combo.set_active(index !== -1 ? index : 1); // Default to Medium if not found
                }}
              />
            </box>
          </box>
        </box>

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
            <box
              horizontal
              halign={Gtk.Align.END}
              hexpand={true}
              valign={Gtk.Align.CENTER}
            >
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
            <box
              horizontal
              halign={Gtk.Align.END}
              hexpand={true}
              valign={Gtk.Align.CENTER}
            >
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

          {/* Transparent Bar Switch */}
          <box horizontal halign={Gtk.Align.FILL} className="setting-box">
            <label
              label="Transparent Bar Items"
              className="h3"
              halign={Gtk.Align.START}
              hexpand={false}
              valign={Gtk.Align.CENTER}
            />
            <box
              horizontal
              halign={Gtk.Align.END}
              hexpand={true}
              valign={Gtk.Align.CENTER}
            >
              <switch
                active={bind(transparentItems).as((trans) => trans)}
                onNotifyActive={(self) => {
                  const newValue = self.active;
                  if (newValue !== transparentItems.get()) {
                    transparentItems.set(newValue);
                    saveSettings(
                      currentTheme.get(),
                      currentMode.get(),
                      slideshow.get(),
                      wallpaperImage.get(),
                      wallpaperFolder.get(),
                      useBing.get(),
                      totalWorkspaces.get(),
                      showNumbers.get(),
                      hideEmptyWorkspaces.get(),
                      workspaceIcons.get(),
                      transparentItems.get(),
                      paddingSize.get(), // Add paddingSize here
                    );
                    settingsChanged.set(settingsChanged.get() + 1);
                  }
                  const homeDir = GLib.get_home_dir();
                  const theme = currentTheme.get();
                  const mode = currentMode.get();
                  const themePathCss = `${homeDir}/.config/ags/style/${theme}${mode}/main.css`;
                  const themePathScss = `${homeDir}/.config/ags/style/${theme}${mode}/main.scss`;
                  execAsync(`sass "${themePathScss}" "${themePathCss}"`);
                  console.log("Scss compiled");
                  App.reset_css();
                  App.apply_css(themePathCss);
                  console.log("Css applied");
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
            <entry placeholderText="Icon" className="icon-entry" />
            <box horizontal spacing={8} halign={Gtk.Align.CENTER}>
              <button
                onClick={(self) => {
                  const form = self.get_parent().get_parent();
                  const numberEntry = form.get_children()[0]; // First child
                  const iconEntry = form.get_children()[1]; // Second child
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
                  onEnterNotifyEvent={(self) => {
                    if (deleteClass) {
                      console.log("Hover enter:", id);
                      deleteClass.toggleClassName(
                        "delete-button-visible",
                        true,
                      );
                      deleteClass.toggleClassName(
                        "delete-button-hidden",
                        false,
                      );
                      console.log("Current className:", deleteClass.className);
                    }
                  }}
                  onLeaveNotifyEvent={(self) => {
                    if (deleteClass) {
                      console.log("Hover leave:", id);
                      deleteClass.toggleClassName(
                        "delete-button-visible",
                        false,
                      );
                      deleteClass.toggleClassName("delete-button-hidden", true);
                      console.log("Current className:", deleteClass.className);
                    }
                  }}
                >
                  <box
                    className="icon-card"
                    horizontal
                    spacing={8}
                    halign={Gtk.Align.FILL}
                  >
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
        </box>
      </box>
    </Page>
  );
};
