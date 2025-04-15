import { App, Gtk, Widget } from "astal/gtk3";
import AstalApps from "gi://AstalApps?version=0.1";

export default (app: AstalApps.Application) => {
  const title = new Widget.Label({
    className: "title",
    label: app.name,
    xalign: 0,
    valign: Gtk.Align.CENTER,
    truncate: true,
  });

  const description = new Widget.Label({
    className: "description",
    label: app.description || "",
    wrap: true,
    xalign: 0,
    truncate: true,
  });

  const icon = new Widget.Icon({
    icon: app.iconName || "",
  });

  const textBox = new Widget.Box({
    vertical: true,
    valign: Gtk.Align.CENTER,
    children: app.description ? [title, description] : [title],
  });

  const AppItem = new Widget.Button({
    className: "app-launcher__item",
    on_clicked: () => {
      App.toggle_window("app-launcher");
      app.launch();
    },
    setup: (self) => {
      self.add(
        new Widget.Box({
          spacing: 8,
          children: [icon, textBox],
        }),
      );
    },
  });

  return Object.assign(AppItem, {
    app,
  });
};

export const MathResultItem = (expression: string, result: string) => {
  const title = new Widget.Label({
    className: "title",
    label: `${expression} = ${result}`,
    xalign: 0,
    valign: Gtk.Align.CENTER,
    truncate: true,
  });

  const icon = new Widget.Icon({
    icon: "accessories-calculator-symbolic",
  });

  const copyButton = new Widget.Button({
    className: "copy-button",
    label: "Copy",
    on_clicked: () => {
      Utils.writeClipboard(result); // Copy the result to clipboard
      console.log(`Copied "${result}" to clipboard`);
    },
  });

  const contentBox = new Widget.Box({
    spacing: 8,
    children: [icon, title, copyButton],
  });

  const MathItem = new Widget.Button({
    className: "app-launcher__item math-result",
    on_clicked: () => {
      App.toggle_window("app-launcher"); // Close the launcher
    },
    setup: (self) => {
      self.add(contentBox);
    },
  });

  return MathItem;
};
