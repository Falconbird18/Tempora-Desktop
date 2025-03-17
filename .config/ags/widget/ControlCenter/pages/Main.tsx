import { App, Gtk, Widget, astalify, ConstructProps } from "astal/gtk3";
import { bind, execAsync, GObject, Variable } from "astal";
import { spacing, uptime } from "../../../lib/variables";
import NetworkButton from "../items/Network";
import Volume from "../items/Volume";
import DND from "../items/DND";
import Microphone from "../items/Microphone";
import NoSleep from "../items/NoSleep";
import icons from "../../../lib/icons";
import Brightness from "../items/Brightness";
import FanProfileButton from "../items/FanProfile";
import ScreenRecord from "../items/ScreenRecord";
import ScreenRecordMenu from "../items/ScreenRecordMenu";
import ShutDownMenu from "../items/ShutDownMenu";
import ScreenRecordService from "../../../service/ScreenRecord";
import BluetoothButton from "../items/Bluetooth";
import ScreenSnip from "../items/ScreenSnip";
import ScreenShot from "../items/ScreenShot";
import Battery from "gi://AstalBattery";
import BarItem from "../../Bar/BarItem";
import { controlCenterPage } from "../index";
import { toggleWindow } from "../../../lib/utils";

const menuName = "themes";
const bat = Battery.get_default();

class FlowBox extends astalify(Gtk.FlowBox) {
  static {
    GObject.registerClass(this);
  }

  constructor(
    props: ConstructProps<Gtk.FlowBox, Gtk.FlowBox.ConstructorProps>,
  ) {
    super(props as any);
  }
}

class Box extends astalify(Gtk.Box) {
  static {
    GObject.registerClass(this);
  }

  constructor(props: ConstructProps<Gtk.Box, Gtk.Box.ConstructorProps>) {
    super(props as any);
  }
}

export default () => {
  const revealScreenRecord = Variable(false);

  const fb = new FlowBox({
    homogeneous: true, // You can keep it true or false, depending on your desired FlowBox behavior
    selectionMode: Gtk.SelectionMode.NONE,
    maxChildrenPerLine: 2,
    minChildrenPerLine: 2,
    rowSpacing: spacing,
    columnSpacing: spacing,
  });

  const FanProfile = FanProfileButton();
  const Network = NetworkButton();
  const Bluetooth = BluetoothButton();

  const connectivityContainer = new Widget.Box({
    spacing,
    className: "control-center__settings-container",
    vertical: true,
    children: [
      new Widget.Label({ label: "Connectivity", className: "h1" }),
      Network ? Network : null,
      Bluetooth ? Bluetooth : null,
    ].filter(Boolean),
  });

  const Performance = new Widget.Box({
    spacing,
    className: "control-center__settings-container",
    vertical: true,
    children: [
      new Widget.Label({ label: "Performance", className: "h1" }),
      DND(),
      FanProfile
    ].filter(Boolean),
  });

  const Display = new Widget.Box({
    spacing,
    className: "control-center__settings-container",
    vertical: true,
    children: [
      new Widget.Label({ label: "Display & Audio", className: "h1" }),
      Volume(),
      Brightness(),
      new Widget.Box({ vertical: true, spacing, children: [Microphone(), NoSleep()] })
    ].filter(Boolean),
  });

  const recordingContainer = new Widget.Box({
    spacing,
    className: "control-center__settings-container",
    vertical: true,
    children: [
      new Widget.Label({ label: "Capture", className: "h1" }),
      new Widget.Box({
        vertical: false,
        spacing,
        children: [
          ScreenShot(),
          ScreenSnip(),
        ],
      }),
      new Widget.Box({
        vertical: false,
        spacing,
        children: [
          ScreenRecord({
            onClicked: () => {
              if (ScreenRecordService.recording) {
                ScreenRecordService.stop();
              } else {
                revealScreenRecord.set(!revealScreenRecord.get());
              }
            },
          }),
        ],
      }),
    ].filter(Boolean),
  });

  fb.add(connectivityContainer);
  fb.add(Performance);
  fb.add(Display);
  fb.add(recordingContainer);

  return (
    <box
      name="main"
      className="control-center__page main"
      vertical
      spacing={spacing}
    >
      {fb} {/* FlowBox remains in the vertical box */}
      {/* recordingContainer is now a direct child of the vertical box */}
      <ScreenRecordMenu
        revealMenu={bind(revealScreenRecord)}
        closeMenu={() => revealScreenRecord.set(!revealScreenRecord.get())}
      />
      <box spacing={16} className="control-center__footer">
        <button
          className="control-center__powermenu-button"
          onClicked={() => {
            if (ScreenRecordService.recording) {
              ScreenRecordService.stop();
            } else {
              revealScreenRecord.set(!revealScreenRecord.get());
            }
          }}
          connection={[
            bind(ScreenRecordService, "recording"),
            () => ScreenRecordService.recording,
          ]}
        >
          <icon icon={icons.powermenu.shutdown} iconSize={16} />
        </button>
        <box hexpand />
          <box className="secondary-button" spacing={4}>
            <icon icon={bind(bat, "battery_icon_name").as(String)} />
            <label
              label={bind(bat, "percentage").as(
                (p) => `${Math.floor(p * 100)}%`,
              )}
              className="h2"
            />
          </box>
        <button
          className="control-center__settings-button"
          // onClick={() => toggleWindow("popup-theme-settings")}
          onClickRelease={(_, event: Astal.ClickEvent) => {
            if (event.button == 1 && menuName) {
              controlCenterPage.set(menuName);
            }
          }}
        >
          <icon icon={icons.ui.settings} iconSize={16} />
        </button>
      </box>
      <ShutDownMenu
        revealMenu={bind(revealScreenRecord)}
        closeMenu={() => revealScreenRecord.set(!revealScreenRecord.get())}
      />
    </box>
  );
};
