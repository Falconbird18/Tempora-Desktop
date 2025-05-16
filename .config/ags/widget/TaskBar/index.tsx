import { Astal, App, Gtk, Gdk } from "astal/gtk3";
import { spacing } from "../../lib/variables";
import { bind } from "astal";
import Hyprland from "gi://AstalHyprland";
import icons, { substitutions } from "../../lib/icons";
import { lookUpIcon } from "../../lib/utils";

const TaskBarItem = ({ client }: { client: any }) => {
    const icon = substitutions.icons[client.class]
        ? substitutions.icons[client.class]
        : lookUpIcon(client.class)
            ? client.class
            : icons.fallback.executable;

    return (
        <button
            className="taskbar-item"
            tooltipText={client.title}
            onClicked={() => {
                if (client.address) {
                    Hyprland.get_default().dispatch(`focuswindow address:${client.address}`);
                }
            }}
        >
            <box spacing={spacing}>
                <icon icon={icon} />
                <label label={client.title} visible={false} />
            </box>
        </button>
    );
};

export default function TaskBar(gdkmonitor: Gdk.Monitor) {
    const hyprland = Hyprland.get_default();
    const clients = bind(hyprland, "clients");

    return (
        <window
            vexpand={true}
            className="Bar"
            namespace="taskBar"
            name="taskBar"
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
                <box halign={Gtk.Align.START} />
                <box spacing={spacing} halign={Gtk.Align.CENTER}>
                    {clients.as(clients => 
                        clients
                            .filter(client => !client.class.includes("unmanaged"))
                            .map(client => (
                                <TaskBarItem key={client.address} client={client} />
                            ))
                    )}
                </box>
                <box halign={Gtk.Align.END} />
            </centerbox>
        </window>
    );
}
