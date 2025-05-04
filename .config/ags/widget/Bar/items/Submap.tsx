import Hyprland from "gi://AstalHyprland";
import { Gtk } from "astal/gtk3";
import { bind, Variable } from "astal";
import BarItem from "../BarItem";

export default () => {
    const hypr = Hyprland.get_default();
    const currentSubmap = Variable("");

    hypr.connect("submap", (_, name) => {
        currentSubmap.value = name ? name.toString() : "";
    });

    return (
        <BarItem className="bar__active-app">
            <label label={bind(currentSubmap)} />
        </BarItem>
    );
};