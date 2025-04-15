import PopupWindow from "../../common/PopupWindow";
import { App } from "astal/gtk3";
import { spacing } from "../../lib/variables";
import { exec } from "astal";
import { toggleWindow } from "../../lib/utils";
import { Command } from "../ControlCenter/items/ShutDownMenu";

// Mapping action keys to system commands
const actionCommands: Record<string, string> = {
  reboot: "systemctl reboot",
  shutdown: "systemctl shutdown",
  sleep: "systemctl suspend",
  logout: "hyprctl dispatch exit",
};

// Mapping action keys to display labels
const actionLabels: Record<string, string> = {
  reboot: "Reboot",
  shutdown: "Shutdown",
  sleep: "Sleep",
  logout: "Log out",
};

type ConfirmationPopupProps = {
  // onConfirm will execute the selected command
  onConfirm?: () => void;
  // onCancel will simply hide the popup
  onCancel?: () => void;
};

const ConfirmationPopup = (
  { onConfirm, onCancel }: ConfirmationPopupProps = {}
) => {
  // Retrieve the currently selected action from shared state
  const actionKey = Command.value; // Access the VALUE of Command!
  console.log(`Command received: ${Command.value}`); // Log the VALUE of Command!
  const labelText = actionKey ? actionLabels[actionKey] : "Confirm";

  const confirmAction = () => {
    if (actionKey) {
      const command = actionCommands[actionKey];
      exec(command).catch((error) => {
        console.error(`Error executing ${actionKey} command:`, error);
      });
      console.log(`Executing Command: ${command}`); // Log the actual command here
      toggleWindow("confirmationPopup");
      onConfirm && onConfirm();
    } else {
      console.error("No action selected to confirm.");
      toggleWindow("confirmationPopup");
    }
  };

  const cancelAction = () => {
    toggleWindow("confirmationPopup");
    onCancel && onCancel();
  };

  return (
    <PopupWindow
      application={App}
      scrimType="opaque"
      name="confirmationPopup"
      namespace="confirmation"
      onKeyPressEvent={(self, event) => {
        const [keyEvent, keyCode] = event.get_keycode();
        if (keyEvent && keyCode === 9) {
          // Optional: handle Tab key event for focus management
        }
      }}
    >
      <box className={"confirmation-popup"} spacing={spacing}>
        <button className="primary-button" onClicked={confirmAction}>
          <label label={labelText} />
        </button>
        <button className="secondary-button" onClicked={cancelAction}>
          <label label="Cancel" />
        </button>
      </box>
    </PopupWindow>
  );
};

export default ConfirmationPopup;
