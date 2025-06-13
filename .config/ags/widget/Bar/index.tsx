import { Astal, App, Gtk, Gdk } from "astal/gtk3";
import Workspaces from "./items/Workspaces";
import { spacing } from "../../lib/variables";
import ActiveApp from "./items/ActiveApp";
import Submap from "./items/Submap";
import Clock from "./items/Clock";
import Tray from "./items/Tray";
import SystemIndicators from "./items/SystemIndicators";
import Notifications from "./items/Notifications";
import Arch from "./items/Arch";
import Weather from "./items/Weather";
import RecordingIndicator from "./items/RecordingIndicator";
import SideBar from "./items/SideBar";
import Media from "./items/Media";
import { barLocation } from "../../service/Settings";
import { bind } from "astal";

// declare global {
//   namespace JSX {
//     interface IntrinsicElements {
//       box: ConstructProps<Gtk.Box, Gtk.Box.ConstructorProps> & Ref<Gtk.Box>;
//       window: ConstructProps<Widget.Window, Widget.Window.ConstructorProps> & Ref<Widget.Window>;
//       centerbox: ConstructProps<Gtk.Box, Gtk.Box.ConstructorProps> & Ref<Gtk.Box>;
//     }
//   }
// }

const Start = () => {
  return (
    <box halign={Gtk.Align.START} spacing={spacing}>
      <SideBar />
      <Workspaces />
      <Submap />
      <ActiveApp />
    </box>
  );
};

const Center = () => {
  return (
    <box halign={Gtk.Align.CENTER} spacing={spacing}>
      <Clock />
    </box>
  );
};

const End = () => {
  return (
    <box halign={Gtk.Align.END} spacing={spacing}>
      <RecordingIndicator />
      <Weather />
      <Notifications />
      <Media />
      <SystemIndicators />
      <Tray />
      <Arch />
    </box>
  );
};

export default function Bar(gdkmonitor: Gdk.Monitor) {
  return (
    <window
      vexpand={true}
      vertical={bind(barLocation).as(
        (loc: { name: string }) => loc.name === "left" || loc.name === "right",
      )}
      className="Bar"
      namespace="bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      layer={Astal.Layer.TOP}
      anchor={bind(barLocation).as((loc: { anchor: number }) => loc.anchor)}
      application={App}
      focusable={true}
    >
      {bind(barLocation).as((loc: { name: string }) =>
        loc.name === "left" || loc.name === "right" ? (
          <box className="bar" vertical>
            <box vexpand={false} spacing={spacing}>
              <Start />
            </box>
            <box vexpand={true} valign={Gtk.Align.CENTER} spacing={spacing}>
              <Center />
            </box>
            <box vexpand={false} spacing={spacing}>
              <End />
            </box>
          </box>
        ) : (
          <centerbox className="bar" valign={Gtk.Align.CENTER}>
            <Start />
            <Center />
            <End />
          </centerbox>
        ),
      )}
    </window>
  );
}
