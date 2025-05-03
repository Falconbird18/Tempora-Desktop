import { App, Gtk, Gdk, Widget } from "astal/gtk3";
import { bind, exec, Variable } from "astal";
import PopupMenu from "../PopupMenu";
import { spacing } from "../../../lib/variables";
import icons from "../../../lib/icons";


const { GLib, Gio } = imports.gi;

// Map keycodes to actual keys (expand if needed)
const keycodeMap = {
  "code:61": "/"
};

/*
  Improved config parser:
  - Skips empty lines and any line containing "# [hidden]".
  - Uses "#!" for section headings.
  - Uses lines starting with "#[description]" to save a description.
  - For bind lines the keys are extracted from two parts:
      • The part after "=" (which may have modifiers separated by "+")
      • The next comma-separated field.
    These parts are split on "+" and concatenated to form an array of separate keys.
*/
function parseConfig(filePath) {
  const file = Gio.File.new_for_path(filePath);
  const [, contents] = file.load_contents(null);
  const text = new TextDecoder("utf-8").decode(contents);
  const lines = text.split("\n");

  let currentSection = "Miscellaneous";
  const shortcuts = [];
  let currentDescription = "";

  for (let line of lines) {
    line = line.trim();
    if (!line || line.includes("# [hidden]")) continue;

    if (line.startsWith("#!")) {
      currentSection = line.replace("#!", "").trim();
      continue;
    }

    if (line.startsWith("#[description]")) {
      currentDescription = line.replace("#[description]", "").trim();
      continue;
    }

    if (
      line.startsWith("bind") ||
      line.startsWith("bindl") ||
      line.startsWith("bindle") ||
      line.startsWith("bindr") ||
      line.startsWith("binde")
    ) {
      const parts = line.split(",").map(p => p.trim());
      if (parts.length < 2) continue;

      // Extract keys from the first part (after "=")
      let bindingField = parts[0];
      let bindingKeys = "";
      if (bindingField.includes("=")) {
        bindingKeys = bindingField.split("=").pop().trim();
      } else {
        bindingKeys = bindingField;
      }

      // Helper: split keys by '+' and trim.
      const processKeys = keyStr =>
        keyStr.split("+").map(s => s.trim()).filter(Boolean);

      let keys = bindingKeys ? processKeys(bindingKeys) : [];
      // Also add keys from the next comma-separated field.
      if (parts.length > 1) {
        keys = keys.concat(processKeys(parts[1]));
      }

      // Remap keys if needed.
      keys = keys.map(key => keycodeMap[key] || key);

      shortcuts.push({
        section: currentSection,
        description: currentDescription || "No description",
        keys,
      });
      currentDescription = "";
    }
  }
  return shortcuts;
}

/*
  KeyIcon component.
  If the key is "Super", it renders an icon using your custom configuration (icons.ui.super).
  All other keys render as plain text.
*/
const KeyIcon = ({ keyName }) => {
  return (
    <box 
      className="key-icon" 
    >
      {keyName === "Super" ? (
        <icon icon={icons.ui.super} className="icon" />
      ) : (
        <label label={keyName} className="key-text" />
      )}
    </box>
  );
};

const ColumnGrid = ({ children, columns = 3, spacing: gridSpacing }) => {
  const rows = [];
  let currentRow = [];

  children.forEach((child, i) => {
    currentRow.push(child);
    if ((i + 1) % columns === 0) {
      rows.push(currentRow);
      currentRow = [];
    }
  });
  if (currentRow.length > 0) {
    while (currentRow.length < columns) {
      currentRow.push(null);
    }
    rows.push(currentRow);
  }

  return (
    <box vertical spacing={gridSpacing}>
      {rows.map((row, rowIndex) => (
        <box
          key={rowIndex}
          horizontal
          spacing={gridSpacing}
          halign="Gtk.Align.START"
        >
          {row.map((cell, cellIndex) => (
            <box
              key={cellIndex}
              halign="Gtk.Align.START"
              valign="Gtk.Align.START"
              css={`
                min-width: 200px;
              `}
            >
              {cell}
            </box>
          ))}
        </box>
      ))}
    </box>
  );
};

export default () => {
  const shortcuts = parseConfig(
    GLib.get_home_dir() + "/.config/hypr/hyprland/keybinds.conf"
  );

  const sections = {};
  shortcuts.forEach(shortcut => {
    if (!sections[shortcut.section]) {
      sections[shortcut.section] = [];
    }
    sections[shortcut.section].push(shortcut);
  });

  return (
    <PopupMenu label="Keybinds">
      <box 
        vertical 
        spacing={spacing}
      >
        {Object.keys(sections).map(sectionName => (
          <box 
            key={sectionName} 
            vertical 
            spacing={spacing}
          >
            <label 
              label={sectionName} 
              className="h2"
              halign="Gtk.Align.CENTER"
            />
            <ColumnGrid spacing={spacing} columns={3}>
              {sections[sectionName].map((shortcut, idx) => {
                const keyNodes = shortcut.keys.reduce((nodes, key, i) => {
                  if (i > 0) {
                    nodes.push(
                      <label 
                        label="+" 
                        className="plus-sign" 
                        key={`plus-${i}`}
                      />
                    );
                  }
                  nodes.push(
                    <KeyIcon keyName={key} key={`key-${i}`} />
                  );
                  return nodes;
                }, []);

                return (
                  <box 
                    key={`${sectionName}-${idx}`} 
                    vertical
                    spacing={4}
                    css={`
                      min-width: 200px;
                    `}
                  >
                    <box 
                      horizontal
                      spacing={2}
                      halign="Gtk.Align.CENTER"
                    >
                      {keyNodes}
                    </box>
                    <box halign={Gtk.Align.FILL}>
                    <label
                      label={shortcut.description}
                      className="paragraph"
                      wrap={true}
                      halign="Gtk.Align.CENTER"
                    />
                    </box>
                  </box>
                );
              })}
            </ColumnGrid>
          </box>
        ))}
      </box>
    </PopupMenu>
  );
};
