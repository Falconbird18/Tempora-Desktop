import { bind } from "astal";
import { transparentItems } from "../ControlCenter/pages/AdvancedThemes";
import { App, Gtk, Gdk } from "astal/gtk3";
import { ButtonProps } from "astal/gtk3/widget";

type Props = ButtonProps & {
    child?: JSX.Element; // when only one child is passed
};

export default ({
    child,
    buttonStyle,
    className = "", // Provide a default empty string
    onClicked,
    ...props
}: Props) => {
    const transparent = transparentItems.get();
    const transparentSuffix = transparent ? " transparent" : "";
    const combinedClassName = `bar__button${transparentSuffix}`;

    return (
        <button
            className={combinedClassName}
            onClicked={onClicked}
            valign={Gtk.Align.CENTER}
            {...props}
        >
            {child}
        </button>
    );
};