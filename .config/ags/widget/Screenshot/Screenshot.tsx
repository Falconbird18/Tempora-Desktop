import { bind, exec, Variable, execAsync } from "astal";
import { App, Gtk, Astal, Widget } from "astal/gtk3";
const { GLib, Gio } = imports.gi;
import { toggleWindow } from "../../lib/utils";
import { spacing } from "../../lib/variables";
import PopupWindow from "../../common/PopupWindow";
import icons from "../../lib/icons";

const SCREENSHOT_DIR = `${GLib.get_home_dir()}/Pictures/Screenshots`;

// Ensure the directory exists
exec(`mkdir -p ${SCREENSHOT_DIR}`);

const grimSlurpSaveArea = () => {
  toggleWindow("screenshot");
  execAsync("slurp") // Run slurp first to get geometry
    .then((geometry) => {
      if (geometry) {
        // Check if selection wasn't cancelled (e.g., by pressing Esc)
        const filepath = `${SCREENSHOT_DIR}/$(date '+%Y-%m-%d_%H%M%S_area.png')`;
        // Use grim with the geometry (-g) from slurp
        const cmd = `grim -g "${geometry}" "${filepath}" && notify-send "Screenshot Saved" "Area captured to ${filepath}"`;
        execAsync(["bash", "-c", cmd]).catch((err) =>
          console.error(`grim execution failed: ${err}`),
        );
      } else {
        print("Area selection cancelled.");
        execAsync('notify-send "Screenshot Cancelled"');
      }
    })
    .catch((err) => {
      console.error(`slurp execution failed: ${err}`);
      execAsync('notify-send "Screenshot Failed" "Could not select area"');
    });
};

const grimSaveScreen = () => {
  App.closeWindow("screenshot-menu");
  const filepath = `${SCREENSHOT_DIR}/$(date '+%Y-%m-%d_%H%M%S_screen.png')`;
  // Use grim without geometry to capture the whole screen
  const cmd = `grim "${filepath}" && notify-send "Screenshot Saved" "Screen captured to ${filepath}"`;
  execAsync(["bash", "-c", cmd]).catch((err) => {
    console.error(`grim execution failed: ${err}`);
    execAsync('notify-send "Screenshot Failed" "Could not capture screen"');
  });
};

// --- Determine which commands to use ---
const captureAreaCommand = grimSlurpSaveArea;
const captureScreenCommand = grimSaveScreen;

export default () => {
  return (
    <PopupWindow
      scrimType="transparent"
      layer={Astal.Layer.OVERLAY}
      visible={false}
      margin={5}
      vexpand={true}
      keymode={Astal.Keymode.EXCLUSIVE}
      name="screenshot"
      namespace="screenshot"
      className="screenshot"
      exclusivity={Astal.Exclusivity.NORMAL}
      anchor={Astal.WindowAnchor.TOP}
      application={App}
      onKeyPressEvent={(self, event) => {
        const [keyEvent, keyCode] = event.get_keycode();
        if (keyEvent && keyCode == 9) {
          App.toggle_window(self.name);
        }
      }}
    >
      <box className="card" spacing={spacing}>
        <button className="primary-button" onClicked={captureAreaCommand}>
          <box spacing={spacing}>
            <icon icon={icons.screensnip} />
            <label className="h2">Capture area</label>
          </box>
        </button>
        <button className="primary-button" onClicked={captureScreenCommand}>
          <box spacing={spacing}>
            <icon icon={icons.screenshot} />
            <label className="h2">Capture screen</label>
          </box>
        </button>
        <button
          className="secondary-circular-button"
          onClicked={() => {
            toggleWindow("screenshot");
          }}
        >
          <icon icon={icons.ui.close} />
        </button>
      </box>
    </PopupWindow>
  );
};
