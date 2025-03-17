import { bind } from "astal";
import { Gtk } from "astal/gtk3";
import Hyprland from "gi://AstalHyprland";
import BarItem from "../BarItem";
import {
  totalWorkspaces,
  showNumbers,
  hideEmptyWorkspaces,
  settingsChanged,
  workspaceIcons,
} from "../../ControlCenter/pages/AdvancedThemes";

export default function Workspaces() {
  const hypr = Hyprland.get_default();

  const focusWorkspace = (workspaceId: number) =>
    hypr.dispatch("workspace", workspaceId.toString());

  let buttons = new Map<number, any>();
  let containers = new Map<number, any>();

  const createWorkspaceButton = (id: number) => {
    const icons = workspaceIcons.get();
    const icon = icons[id];

    return (
      <button
        key={`workspace-btn-${id}`}
        halign={Gtk.Align.CENTER}
        valign={Gtk.Align.CENTER}
        onClicked={() => focusWorkspace(id)}
      >
        {icon ? (
          <label label={icon} />
        ) : showNumbers.get() ? (
          <label label={id.toString()} />
        ) : null}
      </button>
    );
  };

  const rebuildButtons = () => {
    const newButtons = new Map<number, any>();
    const newContainers = new Map<number, any>();
    const TOTAL_WORKSPACES = totalWorkspaces.get();
    for (let id = 1; id <= TOTAL_WORKSPACES; id++) {
      const button = createWorkspaceButton(id);
      newButtons.set(id, button);
      newContainers.set(
        id,
        <box
          key={`workspace-box-${id}`}
          halign={Gtk.Align.CENTER}
          valign={Gtk.Align.CENTER}
          className="workspace-container"
        >
          {button}
        </box>,
      );
    }
    buttons = newButtons;
    containers = newContainers;
  };

  const updateButton = (
    button: any,
    id: number,
    isFocused: boolean,
    hasWindows: boolean,
    SHOW_NUMBERS: boolean,
    HIDE_EMPTY: boolean,
  ) => {
    const icons = workspaceIcons.get();
    const icon = icons[id];

    let baseClass = icon || SHOW_NUMBERS
      ? "bar__workspaces-indicator-number"
      : "bar__workspaces-indicator dot";
    if (isFocused) baseClass += " active";
    button.className = baseClass;

    if (HIDE_EMPTY && !hasWindows) {
      if (button.hide) button.hide();
      if (typeof button.visible !== "undefined") button.visible = false;
    } else {
      if (button.show) button.show();
      if (typeof button.visible !== "undefined") button.visible = true;
    }

    if (icon) {
      if (button.child) {
        if (button.child.label !== undefined) {
          button.child.label = icon;
        }
      } else {
        button.child = <label label={icon} />;
      }
    } else if (SHOW_NUMBERS) {
      if (button.child) {
        if (button.child.label !== undefined) {
          button.child.label = id.toString();
        }
      } else {
        button.child = <label label={id.toString()} />;
      }
    } else {
      if (button.child) {
        if (button.remove) {
          button.remove(button.child);
        }
        button.child = null;
      }
    }
  };

  const clearBox = (box: any) => {
    if (box.remove_all_children) {
      box.remove_all_children();
    } else if (box.get_children) {
      const children = box.get_children();
      for (let child of children) {
        box.remove(child);
      }
    } else {
      while (box.firstChild) {
        box.remove(box.firstChild);
      }
    }
  };

  const setupUpdates = (box: any) => {
    const refreshAllButtons = () => {
      rebuildButtons();
      clearBox(box);
      containers.forEach((container, id) => {
        box.add(container);
      });
      if (box.queue_relayout) box.queue_relayout();
    };

    const updateAllButtons = () => {
      const SHOW_NUMBERS = showNumbers.get();
      const HIDE_EMPTY = hideEmptyWorkspaces.get();
      const ws = hypr.workspaces;
      const fw = hypr.focusedWorkspace;

      buttons.forEach((button, id) => {
        const currentWorkspace = ws.find((w) => w.id === id);
        const actualHasWindows =
          (currentWorkspace?.clients?.length ||
            currentWorkspace?.windows?.length ||
            0) > 0;
        const isFocused = fw?.id === id;
        const displayWorkspace = actualHasWindows || isFocused;

        updateButton(
          button,
          id,
          isFocused,
          displayWorkspace,
          SHOW_NUMBERS,
          HIDE_EMPTY,
        );

        const container = containers.get(id);
        if (container) {
          if (HIDE_EMPTY && !displayWorkspace) {
            if (container.hide) container.hide();
            if (typeof container.visible !== "undefined") {
              container.visible = false;
            }
          } else {
            if (container.show) container.show();
            if (typeof container.visible !== "undefined") {
              container.visible = true;
            }
          }
          container.className = actualHasWindows
            ? "bar-workspaces-active"
            : "bar-workspaces";
        }
      });
    };

    refreshAllButtons();
    updateAllButtons();

    settingsChanged.subscribe(() => {
      refreshAllButtons();
      updateAllButtons();
    });
    hypr.connect("notify::workspaces", updateAllButtons);
    hypr.connect("notify::focused-workspace", updateAllButtons);
  };

  return (
    <BarItem>
      <box spacing={8} className="bar__workspaces" setup={setupUpdates}>
        {/* Containers are added dynamically in refreshAllButtons */}
      </box>
    </BarItem>
  );
}