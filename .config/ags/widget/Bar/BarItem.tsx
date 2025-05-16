import { Box, Astal, Gtk } from "astal/gtk3";
import { bind } from "astal";
import { transparentBar } from "../ControlCenter/pages/AdvancedThemes";

interface Props extends Box.Props {
    vertical?: boolean;
    transparent?: boolean;
}

export default ({
    className = "",
    children,
    vertical = false,
    transparent = false,
    ...rest
}: Props) => {
    return (
        <box
            className={`bar__item ${className} ${bind(transparentBar).as(trans => trans ? 'transparent' : '')}`}
            {...rest}
        >
            <box spacing={8} vertical={vertical}>
                {children}
            </box>
        </box>
    );
};
