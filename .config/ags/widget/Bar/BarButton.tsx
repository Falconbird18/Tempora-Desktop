import { bind } from "astal";
import { transparentBar } from "../ControlCenter/pages/AdvancedThemes";
import { App, Gtk, Gdk } from "astal/gtk3";
import { ButtonProps } from "astal/gtk3/widget";

export enum BarButtonStyle {
    transparent = "transparent",
    primary = "primary",
    primaryContainer = "primary_container",
}

type Props = ButtonProps & {
    buttonStyle?: BarButtonStyle;
    child?: JSX.Element; // when only one child is passed
};

export default ({
    child,
    buttonStyle,
    className = "", // Provide a default empty string
    onClicked,
    ...props
}: Props) => {
    const transparent = transparentBar.get();
    const transparentClass = transparent ? ".transparent" : "";
    const combinedClassName = `bar__button${transparentClass}`;

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