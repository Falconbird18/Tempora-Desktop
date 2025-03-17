import { bind, Variable } from "astal";
import { spacing } from "../../../lib/variables";
import icons from "../../../lib/icons";
import { Widget, Gtk } from "astal/gtk3";
import Battery from "gi://AstalBattery?version=0.1";
import { ComboBox } from "../../../common/Types";

export default () => {
    const bat = Battery.get_default();
    const revealMenu = Variable(false);

    if (!bat) return null;

    // Variable to track if charge limiting is enabled
    const isChargeLimitEnabled = Variable(false);
    // Variable to store the charge limit percentage (default 80%)
    const chargeLimit = Variable(80);

    // Use the battery's built-in icon name and modify if limit is enabled
    const batteryIcon = Variable.derive(
        [bind(bat, "battery_icon_name"), bind(isChargeLimitEnabled)],
        (iconName, limitEnabled) =>
            limitEnabled ? icons.ui.battery : iconName
    );

    // Label showing current status
    const label = Variable.derive(
        [bind(isChargeLimitEnabled), bind(chargeLimit), bind(bat, "percentage")],
        (limitEnabled, limit, current) =>
            limitEnabled
                ? `Limit: ${limit}%`
                : "No Limit"
    );

    // Button class based on limit status
    const buttonClassName = bind(isChargeLimitEnabled).as((enabled) =>
        enabled ? "primary-button-circular active" : "primary-button-circular"
    );

    // Dropdown menu component
    const ChargeLimitMenu = () => (
        <box
            className="dropdown-menu"
            orientation={Gtk.Orientation.VERTICAL}
            spacing={10}
        >
            <slider
                draw_value={true}
                min={50}
                max={100}
                step={5}
                value={bind(chargeLimit)}
                onDragged={({ value }) => {
                    chargeLimit.set(value);
                    if (isChargeLimitEnabled.get()) {
                        bat.set_charge_limit?.(value);
                    }
                }}
            />
        </box>
    );

    return (
        <box spacing={spacing} vertical>
            <box horizontal>
                <button
                    onClickRelease={() => {
                        const newState = !isChargeLimitEnabled.get();
                        isChargeLimitEnabled.set(newState);
                        bat.set_charge_limit?.(newState ? chargeLimit.get() : 100);
                    }}
                    className={bind(buttonClassName)}
                >
                    <icon icon={bind(batteryIcon)} className="h1" />
                </button>

                {/* Label */}
                <box className="control-center-label-container">
                    <label label={bind(label)} className="h2" />
                </box>

                <button
                    onClickRelease={(_, event: Astal.ClickEvent) => {
                        if (event.button == 1) {
                            revealMenu.set(!revealMenu.get()); // Corrected line
                            console.log(revealMenu.get()); //This line is optional now
                        }
                    }}
                >
                    <icon icon={icons.ui.arrow.right} className="h1" />
                </button>
            </box>
            <box
                visible={bind(revealMenu)}
                vertical
                spacing={spacing}
            >
                <label label="Hi" className="h2" />
                <slider
                    draw_value={true}
                    min={50}
                    max={100}
                    step={10}
                    value={bind(chargeLimit)}
					className="control-center-slider"
                    onDragged={({ value }) => {
                        chargeLimit.set(value);
                        if (isChargeLimitEnabled.get()) {
                            bat.set_charge_limit?.(value);
                        }
                    }}
                />
            </box>
        </box>
    );
};