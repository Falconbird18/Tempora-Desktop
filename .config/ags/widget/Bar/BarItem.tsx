import { App, Gtk, Gdk } from "astal/gtk3";
import { bind } from "astal";
import { transparentItems } from "../ControlCenter/pages/AdvancedThemes";
import { BoxProps } from "astal/gtk3/widget";

type Props = BoxProps & {
	child?: JSX.Element; // when only one child is passed
};

export default ({ child, itemStyle, className, ...props }: Props) => {
    const transparent = transparentItems.get();
    const transparentSuffix = transparent ? " transparent" : "";
    const combinedClassName = `bar__item${transparentSuffix}`;
	return (
		<box
            className={combinedClassName}
			valign={Gtk.Align.CENTER}
			{...props}
		>
			{child}
		</box>
	);
};