import { bind, Variable } from "astal";
import { App, Gtk, Widget } from "astal/gtk3";
import BarButton from "../BarButton";
import { toggleWindow } from "../../../lib/utils";
import AstalMpris from "gi://AstalMpris?version=0.1";

export default () => {
    const MAX_TITLE_LENGTH = 20;
    const mpris = AstalMpris.get_default();

    // This subscribable gives the current AstalMpris.Player object or undefined
    const currentPlayerVariable = bind(mpris, "players").as((players) => players[0]);

    // This Variable will hold the formatted title for the label
    const displayTitle = Variable("No media playing");

    const formatTitle = (title: string | null | undefined): string => {
        if (!title) return "No title"; // Handles null or undefined titles from player
        return title.length > MAX_TITLE_LENGTH ? title.slice(0, MAX_TITLE_LENGTH) + "..." : title;
    };

    return (
        <revealer
            transitionType={Gtk.RevealerTransitionType.CROSSFADE}
            transitionDuration={300}
            // Show the revealer's content only if a player object exists
            revealChild={currentPlayerVariable.as(p => !!p)}
            setup={(self) => { // self is the Gtk.Revealer
                let activePlayerGObject: AstalMpris.Player | undefined = undefined;
                let titleSignalId: number | null = null;

                const refreshTitleOnLabel = (player: AstalMpris.Player | undefined) => {
                    try {
                        if (player) {
                            const title = player.get_title();
                            console.log(`Bar/Media: refreshTitleOnLabel - Player: ${player.busName || 'N/A'}, Title: '${title}'`);
                            displayTitle.value = formatTitle(title);
                        } else {
                            console.log("Bar/Media: refreshTitleOnLabel - No player.");
                            displayTitle.value = "No media playing";
                        }
                    } catch (e) {
                        console.error("Bar/Media: Error in refreshTitleOnLabel:", e);
                        displayTitle.value = "Error fetching title";
                    }
                };

                const setupMediaPlayerHooks = (newPlayerGObject: AstalMpris.Player | undefined) => {
                    console.log("Bar/Media: setupMediaPlayerHooks called with player:", newPlayerGObject ? (newPlayerGObject.busName || 'N/A') : 'undefined');

                    // 1. Disconnect from old player's signals
                    if (titleSignalId && activePlayerGObject) {
                        try {
                            console.log(`Bar/Media: Disconnecting signal ${titleSignalId} from old player ${activePlayerGObject.busName || 'N/A'}`);
                            activePlayerGObject.disconnect(titleSignalId);
                        } catch (e) {
                            console.warn("Bar/Media: Failed to disconnect from old player:", e);
                        }
                        titleSignalId = null;
                    }
                    activePlayerGObject = newPlayerGObject;
                    console.log("Bar/Media: activePlayerGObject is now:", activePlayerGObject ? (activePlayerGObject.busName || 'N/A') : 'undefined');

                    // 2. Connect to new player's signals and update title
                    if (activePlayerGObject) {
                        // Initial title update attempt
                        refreshTitleOnLabel(activePlayerGObject); // Set initial title

                        try {
                            console.log(`Bar/Media: Attempting to connect 'notify::title' for player ${activePlayerGObject.busName || 'N/A'}`);
                            titleSignalId = activePlayerGObject.connect("notify::title", () => {
                                if (activePlayerGObject) { // Ensure it's still relevant
                                    console.log(`Bar/Media: 'notify::title' received for ${activePlayerGObject.busName || 'N/A'}. Current title: '${activePlayerGObject.get_title()}'`);
                                    refreshTitleOnLabel(activePlayerGObject);
                                } else {
                                    console.log("Bar/Media: 'notify::title' received, but activePlayerGObject is now undefined.");
                                }
                            });
                            console.log(`Bar/Media: Connected 'notify::title' with signal ID ${titleSignalId} for player ${activePlayerGObject.busName || 'N/A'}`);
                        } catch (e) {
                            console.error(`Bar/Media: Failed to connect 'notify::title' for player ${activePlayerGObject.busName || 'N/A'}:`, e);
                            activePlayerGObject = undefined; // Assume connection failed
                            refreshTitleOnLabel(undefined); // Reset title
                        }
                    } else {
                        console.log("Bar/Media: No active player in setupMediaPlayerHooks, calling refreshTitleOnLabel(undefined)");
                        refreshTitleOnLabel(undefined); // No player, set default title
                    }
                };
                // Initial setup based on the current player from the subscribable
                setupMediaPlayerHooks(currentPlayerVariable.get());

                // Hook the currentPlayerVariable (Subscribable).
                // This fires when the GObject instance returned by `bind().as()` changes.
                self.hook(
                    currentPlayerVariable,
                    (newPlayerGObjectFromSubscribable) => {
                        setupMediaPlayerHooks(newPlayerGObjectFromSubscribable);
                    }
                );
                // Astal's `self.hook` automatically handles unsubscription on widget destruction.
            }}
        >
            <BarButton
                onClicked={() => {
                    toggleWindow("media");
                }}
                widthRequest={200}
            >
                <box hexpand={true}>
                    {/* Bind the label directly to the displayTitle Variable */}
                    <label label={bind(displayTitle)} visible={true} />
                </box>
            </BarButton>
        </revealer>
    );
};