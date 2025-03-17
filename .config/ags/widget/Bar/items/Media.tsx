import { bind } from "astal";
import { App, Gtk } from "astal/gtk3";
import BarButton from "../BarButton";
import { toggleWindow } from "../../../lib/utils";
import AstalMpris from "gi://AstalMpris?version=0.1";

export default () => {
    const MAX_TITLE_LENGTH = 20;

    const mpris = AstalMpris.get_default();
    const player = bind(mpris, "players").as((players) => players[0]);

    const mediaTitle = bind(player).as((p) => {
        if (!p) return "No media playing";
        const title = p.get_title() || "No title";
        return title.length > MAX_TITLE_LENGTH ? title.slice(0, MAX_TITLE_LENGTH) + "..." : title;
    });

    return (
        <revealer
            transitionType={Gtk.RevealerTransitionType.CROSSFADE}
            transitionDuration={300}
            revealChild={player.as(Boolean)}
        >
            <BarButton
                onClicked={() => {
                    toggleWindow("media");
                }}
                widthRequest={200}
            >
                <box hexpand={true}>
                    <label label={mediaTitle} visible={true} />
                </box>
            </BarButton>
        </revealer>
    );
};