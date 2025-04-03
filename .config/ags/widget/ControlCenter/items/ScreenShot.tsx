import Gio from "gi://Gio";
import GLib from "gi://GLib"; // Import GLib for user directories
import ControlCenterButton from "../../../common/WideButton";
import { toggleWindow } from "../../../lib/utils";
import icons from "../../../lib/icons";

const takeScreenshot = () => {
  // Get the Pictures directory or fallback to the home directory
  const picturesDir =
    GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PICTURES) ||
    GLib.get_home_dir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const screenshotPath = `${picturesDir}/Screenshots/screenshot-${timestamp}.png`;

  try {
    // Check if  the directory exists, create it if not
    if (!GLib.file_test(`${picturesDir}/Screenshots`, GLib.FileTest.IS_DIR)) {
      GLib.mkdir_with_parents(`${picturesDir}/Screenshot`, 0o755);
    }

    // Create a subprocess to run the `grim` command
    const subprocess = Gio.Subprocess.new(
      ["grim", screenshotPath],
      Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
    );

    // Wait for the process to complete
    subprocess.communicate_utf8_async(null, null, (proc, res) => {
      try {
        proc.communicate_utf8_finish(res);
        console.log("Screenshot saved to:", screenshotPath);
      } catch (err) {
        console.error("Failed to take screenshot:", err.message);
      }
    });
  } catch (err) {
    console.error("Error initializing subprocess:", err.message);
  }
};

export default () => {
  return (
    <ControlCenterButton
      icon={icons.screenshot}
      onClicked={() => {
        toggleWindow("screenshot");
      }}
    />
  );
};