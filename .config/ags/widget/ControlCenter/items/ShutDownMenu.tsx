import { Gtk } from "astal/gtk3";
import { Binding, Variable } from "astal";
import { spacing } from "../../../lib/variables";
import { toggleWindow } from "../../../lib/utils";

// Export a Variable to hold the selected command
export const Command = Variable<string | null>(null);

export default ({
  revealMenu,
  closeMenu,
}: {
  revealMenu: Binding<boolean>;
  closeMenu: () => void;
}) => {
  const openConfirmation = (action: string) => {
    Command.value = action; // Set the Command variable's VALUE
    console.log(`Command: ${Command.value}`); // Log the VALUE, not the Variable object
    // Delay opening the confirmation popup slightly. This is the fix.
    setTimeout(() => {
      toggleWindow("confirmationPopup");
    }, 10);

    // Delay closing the menu slightly to allow ConfirmationPopup to read the value.
    setTimeout(() => {
      closeMenu();
    }, 50); // Adjust the delay (in milliseconds) if needed.

  };

  return (
    <box
      vertical
      className={"card"}
      spacing={spacing}
      visible={revealMenu}
      halign={Gtk.Align.FILL}
    >
      <button
        className="secondary-button"
        onClicked={() => openConfirmation("reboot")}
      >
        <label label="Reboot" />
      </button>
      <button
        className="secondary-button"
        onClicked={() => openConfirmation("shutdown")}
      >
        <label label="Shutdown" />
      </button>
      <button
        className="secondary-button"
        onClicked={() => openConfirmation("sleep")}
      >
        <label label="Sleep" />
      </button>
      <button
        className="secondary-button"
        onClicked={() => openConfirmation("logout")}
      >
        <label label="Log out" />
      </button>
      <button className="secondary-button" onClicked={closeMenu}>
        <label label="Cancel" />
      </button>
    </box>
  );
};
