import { bind, Variable } from "astal";
import { Gtk } from "astal/gtk3";
import { exec } from "astal";
import icons from "../../../lib/icons";

export default () => {
    // Create a reactive variable to track sleep state
    const noSleep = Variable(false);

    // Function to toggle sleep mode
    const toggleSleep = () => {
        const currentState = noSleep.get();
        console.log("Current state before toggle:", currentState);

        if (currentState) {
            console.log("Attempting to start hypridle");
            try {
                exec("hyprctl dispatch exec hypridle");
                console.log("hypridle started successfully");
                noSleep.set(false);
                console.log("State set to:", false);
            } catch (err) {
                console.error("Failed to start hypridle:", err);
            }
        } else {
            console.log("Attempting to kill hypridle");
            try {
                exec("pkill hypridle");
                console.log("hypridle killed successfully");
                noSleep.set(true);
                console.log("State set to:", true);
            } catch (err) {
                console.log("pkill error:", err.message);
                if (err.message.includes("exit code 1")) {
                    console.log("No hypridle process was running");
                    noSleep.set(true);
                    console.log("State set to:", true);
                } else {
                    console.error("Failed to kill hypridle:", err);
                }
            }
        }
    };

    // Log state changes for debugging
    noSleep.subscribe((newValue) => {
        console.log("noSleep state changed to:", newValue);
    });

    return (
        <button
            className={bind(noSleep).as((state) =>
                state ? "primary-button" : "primary-button-inactive"
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
                        label="Sleep Mode" 
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