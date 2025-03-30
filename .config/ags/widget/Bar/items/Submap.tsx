import Hyprland from "gi://AstalHyprland";
import { Gtk } from "astal/gtk3";
import { bind } from "astal";
import BarItem from "../BarItem";

export default () => {
    const hypr = Hyprland.get_default();
    const focused = bind(hypr, "focusedClient");
    const activeWorkspace = bind(hypr, "activeWorkspace");

    const submap = activeWorkspace.as((workspace) => {
        if (workspace) return workspace.name.toString();
        return "";
    });

    return (
        <revealer
            transitionType={Gtk.RevealerTransitionType.CROSSFADE}
            transitionDuration={300}
            revealChild={focused.as(Boolean)}
        >
            <BarItem className="bar__active-app">
                <label label={submap} truncate={true} maxWidthChars={24} />
            </BarItem>
        </revealer>
    );
};
