import { bind, Variable } from "astal";
import { Gtk } from "astal/gtk3";
import { exec } from "astal";
import icons from "../../../lib/icons";

export default () => {
    // Create a reactive variable to track sleep state
    const noSleep = Variable(false);

    const toggleSleep = () => {
        const currentNoSleepState = noSleep.get();
        const targetNoSleepState = !currentNoSleepState;

        if (targetNoSleepState) { // User wants to disable sleep (noSleep = true)
            console.log("Attempting to disable sleep (kill hypridle)...");
            try {
                exec("pkill hypridle");
                console.log("pkill hypridle command executed.");
            } catch (err) {
                const errorMsg = String(err.message || err);
                // pkill exits 1 if no process found. This is not a critical failure for the desired state.
                if (errorMsg.includes("exit status 1") || errorMsg.toLowerCase().includes("no process found")) {
                    console.log("hypridle was not running (or pkill found no matching process).");
                } else {
                    console.warn("Error trying to kill hypridle:", errorMsg);
                }
            }
            noSleep.set(true);
        } else { // User wants to enable sleep (noSleep = false)
            console.log("Attempting to enable sleep (start hypridle)...");
            try {
                exec("hyprctl dispatch exec hypridle");
                console.log("hypridle start command dispatched.");
            } catch (err) {
                console.error("Error trying to start hypridle:", String(err.message || err));
            }
            noSleep.set(false);
        }
        console.log(`NoSleep state set to: ${noSleep.get()}`);
    };

    return (
        <button
            className={bind(noSleep).as((state) =>
                state ? "primary-button-inactive" : "primary-button"
            )}
            onClicked={() => {
                console.log("Button clicked");
                toggleSleep();
            }}
            hexpand={true}
        >
            <box horizontal>
                <icon
                    icon={bind(noSleep).as(
                        (state) => icons.power[state ? "nosleep" : "sleep"]
                    )}
                    className="icon"
                />
                <box vertical>
                    <label 
                        label="Sleep" 
                        className="paragraph" 
                        halign={Gtk.Align.START} 
                    />
                    <label
                        label={bind(noSleep).as((state) =>
                            state ? "Disabled" : "Enabled"
                        )}
                        className="subtext"
                        halign={Gtk.Align.START}
                    />
                </box>
            </box>
        </button>
    );
};