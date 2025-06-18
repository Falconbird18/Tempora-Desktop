import { App, Gtk, Widget } from "astal/gtk3";
import BarButton from "../BarButton";
import { toggleWindow } from "../../../lib/utils";
import icons from "../../../lib/icons";

export default () => (
  <button
    className="secondary-circular-button"
    onClick={() => {
      toggleWindow("SideBar");
    }}
  >
    <icon icon={icons.ai} className="icon" />
  </button>
);
