import { App, Gtk, Gdk, Widget, Astal } from "astal/gtk3";
import { bind, execAsync, timeout, Variable } from "astal";
import Main from "./pages/Main";
import Media from "./pages/Media";
import Network from "./pages/Network";
import Bluetooth from "./pages/Bluetooth";
import { spacing } from "../../lib/variables";
import PopupWindow from "../../common/PopupWindow";
import { toggleWindow } from "../../lib/utils";
import FanProfiles from "./pages/FanProfiles";
import Themes from "./pages/Themes";
import AdvancedSettings from "./pages/AdvancedThemes";

export const controlCenterPage = Variable("main");

export default () => {
  return (
    <PopupWindow
      valign={Gtk.Align.FILL}
      scrimType="transparent"
      visible={false}
      margin={5}
      name="control-center"
      namespace="control-center"
      layer={Astal.Layer.OVERLAY}
      exclusivity={Astal.Exclusivity.NORMAL}
      keymode={Astal.Keymode.EXCLUSIVE}
      anchor={
        Astal.WindowAnchor.TOP |
        Astal.WindowAnchor.BOTTOM |
        Astal.WindowAnchor.RIGHT
      }
      application={App}
      onKeyPressEvent={(self, event) => {
        const [keyEvent, keyCode] = event.get_keycode();
        if (keyEvent && keyCode == 9) {
          if (controlCenterPage.get() == "main") {
            toggleWindow(self.name);
          } else {
            controlCenterPage.set("main");
          }
        }
      }}
    >
      <box spacing={spacing} valign={Gtk.Align.FILL} vertical>
        <box className="control-center__container" valign={Gtk.Align.START}>
          <stack
            shown={bind(controlCenterPage)}
            transitionType={Gtk.StackTransitionType.SLIDE_LEFT_RIGHT}
            transitionDuration={200}
            setup={(self) => {
              const NetworkWdgt = Network();
              if (NetworkWdgt) self.add(NetworkWdgt);
            }}
          >
            <Main />
            {Network()}
            {FanProfiles()}
            {Bluetooth()}
            {Themes()}
            {AdvancedSettings()}
          </stack>
        </box>
        <Media />
      </box>
    </PopupWindow>
  );
};
