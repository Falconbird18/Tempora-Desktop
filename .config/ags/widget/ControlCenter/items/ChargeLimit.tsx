import { bind, Variable } from "astal";
import { spacing } from "../../../lib/variables";
import icons from "../../../lib/icons";
import Battery from "gi://AstalBattery?version=0.1";
import Gio from "gi://Gio?version=2.0";

/**
 * Sets the battery max charging level by writing directly to the sysfs file.
 * Make sure the file is writable by your user (e.g., via an appropriate udev rule).
 *
 * @param {number} limit - The desired battery charge limit (e.g. 80).
 */
function setBatteryChargeLimit(limit) {
    const filePath = "/sys/class/power_supply/BAT0/charge_control_end_threshold";
    try {
        // Create a Gio.File instance for the sysfs path.
        const file = Gio.File.new_for_path(filePath);
        // Write the new limit; GLib expects a string.
        file.replace_contents(
            `${limit}\n`,   // content to write
            null,           // etag (none here)
            false,          // no need to force sync
            Gio.FileCreateFlags.NONE,
            null            // no cancellable
        );
    } catch (e) {
        log("Error setting battery charge limit: " + e);
    }
}

export default () => {
    const bat = Battery.get_default();
    const revealMenu = Variable(false);

    if (!bat) return null;

    // Variable to track whether charge limiting is enabled
    const isChargeLimitEnabled = Variable(false);
    // Variable storing the charge limit percentage (default 80)
    const chargeLimit = Variable(80);

    // Battery icon varies based on whether charge limiting is enabled
    const batteryIcon = Variable.derive(
        [bind(bat, "battery_icon_name"), bind(isChargeLimitEnabled)],
        (iconName, limitEnabled) =>
            limitEnabled ? icons.ui.battery : iconName
    );

    // Label showing current status
    const label = Variable.derive(
        [bind(isChargeLimitEnabled), bind(chargeLimit), bind(bat, "percentage")],
        (limitEnabled, limit, current) =>
            limitEnabled ? `Limit: ${limit}%` : "No Limit"
    );

    // Button class based on limit status
    const buttonClassName = bind(isChargeLimitEnabled).as((enabled) =>
        enabled ? "primary-button-circular active" : "primary-button-circular"
    );

    // Prepare tick labels from 50 to 100 in increments of 10.
    const sliderTickLabels = Array.from(
        { length: (100 - 50) / 10 + 1 },
        (_, i) => 50 + i * 10
    );

    return (
        <box spacing={spacing} vertical>
            <box horizontal>
                <box hexpand={true}>
                    <button
                        onClickRelease={() => {
                            const newState = !isChargeLimitEnabled.get();
                            isChargeLimitEnabled.set(newState);
                            // When disabling, remove the limit by setting it to 100; otherwise, apply the chosen limit.
                            setBatteryChargeLimit(newState ? chargeLimit.get() : 100);
                        }}
                        className={bind(buttonClassName)}
                    >
                        <icon icon={bind(batteryIcon)} className="h1" />
                    </button>
                </box>
                <box className="control-center-label-container">
                    <label label={bind(label)} className="h2" />
                </box>

                <button
                    hexpand={true}
                    onClickRelease={(_, event: Astal.ClickEvent) => {
                        if (event.button === 1) {
                            revealMenu.set(!revealMenu.get());
                        }
                    }}
                >
                    <icon icon={icons.ui.arrow.right} className="h1" />
                </button>
            </box>

            <box visible={bind(revealMenu)} vertical spacing={spacing}>
                <slider
                    draw_value={false}
                    min={50}
                    max={100}
                    step={10}
                    // For reactive updates, you can bind the value.
                    value={chargeLimit.get()}
                    className="control-center-slider"
                    onDragged={({ value }) => {
                        // Round the value to the nearest multiple of 10:
                        const roundedValue = Math.round(value / 10) * 10;
                        chargeLimit.set(roundedValue);
                        if (isChargeLimitEnabled.get()) {
                            setBatteryChargeLimit(roundedValue);
                        }
                    }}
                />

                <box horizontal className="slider-tick-container">
                    {sliderTickLabels.map((tick, i) => (
                        <label key={i} label={`${tick}`} className="paragraph" expand={true} />
                    ))}
                </box>
            </box>
        </box>
    );
};
