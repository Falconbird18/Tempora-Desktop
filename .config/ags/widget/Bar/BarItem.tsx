import { App, Gtk, Gdk } from "astal/gtk3";
import { bind } from "astal";
import { transparentItems } from "../../service/Settings";
import { BoxProps } from "astal/gtk3/widget";

type Props = BoxProps & {
  child?: JSX.Element; // when only one child is passed
};

export default ({ child, itemStyle, className = "", ...props }: Props) => {
  return (
    <box
      className={bind(transparentItems).as(
        (transparent) => `bar__item${transparent ? " transparent" : ""}`,
      )}
      valign={Gtk.Align.CENTER}
      {...props}
    >
      {child}
    </box>
  );
};
