import { bind } from "astal";
import { transparentItems } from "../../service/Settings";
import { App, Gtk, Gdk } from "astal/gtk3";
import { ButtonProps } from "astal/gtk3/widget";

type Props = ButtonProps & {
  child?: JSX.Element; // when only one child is passed
};

export default ({
  child,
  buttonStyle,
  className = "",
  onClicked,
  ...props
}: Props) => {
  return (
    <button
      className={bind(transparentItems).as(
        (transparent) => `bar__button${transparent ? " transparent" : ""}`,
      )}
      onClicked={onClicked}
      valign={Gtk.Align.CENTER}
      {...props}
    >
      {child}
    </button>
  );
};
