import { Astal, App, Gtk, Gdk } from "astal/gtk3";
import { spacing } from "../../lib/variables";

// declare global {
//   namespace JSX {
//     interface IntrinsicElements {
//       box: ConstructProps<Gtk.Box, Gtk.Box.ConstructorProps> & Ref<Gtk.Box>;
//       window: ConstructProps<Widget.Window, Widget.Window.ConstructorProps> & Ref<Widget.Window>;
//       centerbox: ConstructProps<Gtk.Box, Gtk.Box.ConstructorProps> & Ref<Gtk.Box>;
//     }
//   }
// }


export default function TaskBar(gdkmonitor: Gdk.Monitor) {
    return (
        <window
            vexpand={true}
            className="Bar"
            namespace="taskBar"
            gdkmonitor={gdkmonitor}
            exclusivity={Astal.Exclusivity.EXCLUSIVE}
            layer="top"
            anchor={
                Astal.WindowAnchor.BOTTOM |
                Astal.WindowAnchor.LEFT |
                Astal.WindowAnchor.RIGHT
              }
            application={App}
        >
            <centerbox className="bar" valign={Gtk.Align.CENTER}>
            </centerbox>
        </window>
    );
}
