import { App, Gtk, Gdk, Widget, Astal } from "astal/gtk3";
import { bind, execAsync, timeout, Variable, GLib } from "astal";
import Progress from "./Progress";
import AstalWp from "gi://AstalWp?version=0.1";
import icons from "../../lib/icons";
import Brightness from "../../service/Brightness";

const DELAY = 2500;

function OnScreenProgress(window: Astal.Window, vertical: boolean) {
  const speaker = AstalWp.get_default()?.audio.defaultSpeaker!;

  const indicator = new Widget.Icon({
    pixelSize: 20,
    valign: Gtk.Align.CENTER,
    icon: bind(speaker, "volumeIcon"),
  });

  const progress = Progress({
    vertical,
    width: vertical ? 30 : 250,
    height: vertical ? 250 : 30,
    child: null!,
  });

  let count = 0;

  function show(value: number, icon: string, muted: boolean) {
    window.visible = true;
    indicator.icon = icon;
    progress.setValue(value, muted);
    count++;
    timeout(DELAY, () => {
      count--;
      if (count === 0) window.visible = false;
    });
  }

  const container = new Widget.Box({
    className: "container",
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.END,
    CSS: "min-height: 2px;",
    children: [
      indicator,
      new Widget.Box({
        className: "indicator",
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.END,
        css: "min-height: 2px;",
        child: progress,
      }),
    ],
    setup: () => {
      progress.hook(speaker, "notify::mute", () => {
        progress.setMute(speaker.mute);
        show(speaker.volume, icons.audio.type.speaker, speaker.mute);
      });
      progress.hook(speaker, "notify::volume", () => {
        return show(speaker.volume, icons.audio.type.speaker, speaker.mute);
      });
      if (Brightness) {
        progress.hook(Brightness, () =>
          show(Brightness!.screen, icons.brightness.screen, false),
        );
      }
    },
  });

  // Expose the show function
  return Object.assign(container, { show });
}

export default (gdkmonitor: Gdk.Monitor) => (
  <window
    visible={false}
    className="OSD"
    namespace="osd"
    gdkmonitor={gdkmonitor}
    layer={Astal.Layer.OVERLAY}
    anchor={Astal.WindowAnchor.BOTTOM}
    setup={(self) => {
      self.add(
        <box className="osd" vertical={true}>
          {OnScreenProgress(self, false)}
        </box>,
      );
    }}
  ></window>
);
