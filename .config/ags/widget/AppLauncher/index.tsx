import { App, Astal, Widget } from "astal/gtk3";
import { bind, Variable, exec } from "astal";
import AstalApps from "gi://AstalApps?version=0.1";
import AppItem, { MathResultItem } from "./AppItem";
import PopupWindow from "../../common/PopupWindow";
import icons from "../../lib/icons";

const apps = new AstalApps.Apps();

const PINNED_APP_IDS = [
  "firefox.desktop",
  "org.gnome.Nautilus.desktop",
  "microsoft-edge.desktop",
  "code.desktop",
];

const query = Variable<string>("");

const isMathExpression = (input: string): boolean => {
  // Trigger for $ prefix OR simple math (numbers and basic operators)
  return (
    input.startsWith("$") || // $ prefix for advanced math
    /^[\d\s()+\-*/.^]+$/.test(input.trim()) // Simple math like 1+1, 2*3, etc.
  );
};

const calculateWithQalc = (expression: string): string => {
  try {
    const cleanExpression = expression.startsWith("$")
      ? expression.slice(1)
      : expression;
    console.log(`Executing command: qalc -t "${cleanExpression}"`);

    const result = exec(`qalc -t "${cleanExpression}"`);
    console.log(`qalc output: "${result}"`);

    if (result === undefined || result === null) {
      return "No result from qalc";
    }

    return result.trim();
  } catch (error) {
    console.error(`Error in calculateWithQalc: ${error}`);
    return `Error: ${error.message || "Unknown"}`;
  }
};

let PinnedAppGridWidgetCache: any | null = null;

function getPinnedAppsGridWidget() {
  if (PinnedAppGridWidgetCache) {
    return PinnedAppGridWidgetCache;
  }

  const allAppsList = apps.list || [];
  console.log("[AppLauncher] Total apps from apps.list:", allAppsList.length);
  if (allAppsList.length > 0) {
    console.log("[AppLauncher] Properties of the first app found:", allAppsList[0]);
    console.log("[AppLauncher] All enumerable properties of the first app (allAppsList[0]):");
    for (const prop in allAppsList[0]) {
      try {
        console.log(`  Property '${prop}':`, (allAppsList[0] as any)[prop]);
      } catch (e) {
        console.log(`  Property '${prop}': <error reading property: ${e}>`);
      }
    }
  }

  const pinnedAppWidgets = PINNED_APP_IDS
    .map(pinned_id => {
      console.log(`[AppLauncher] Trying to find pinned app with ID: ${pinned_id}`);
      const app = allAppsList.find((a: AstalApps.Application) => {
        if (a.entry && typeof a.entry === 'string' && a.entry === pinned_id) return true;
        if (a.id && typeof a.id === 'string' && a.id === pinned_id) return true;
        if (a.app_id && typeof a.app_id === 'string' && a.app_id === pinned_id) return true;
        return false;
      });
      if (app) {
        console.log(`[AppLauncher] Found app for ID ${pinned_id}:`, (app as any).name || (app as any).entry || (app as any).id || app);
      }
      return app ? AppItem(app) : null;
    })
    .filter(widget => widget !== null);

  if (pinnedAppWidgets.length === 0) {
    PinnedAppGridWidgetCache = <label>No pinned apps found or configured.</label>;
    return PinnedAppGridWidgetCache;
  }

  const itemsPerRow = 5;
  const rows = [];
  for (let i = 0; i < pinnedAppWidgets.length; i += itemsPerRow) {
    const rowItems = pinnedAppWidgets.slice(i, i + itemsPerRow);
    rows.push(
      <box horizontal spacing={10} className="pinned-apps-row" key={`pinned-row-${i / itemsPerRow}`}>
        {rowItems}
      </box>
    );
  }
  PinnedAppGridWidgetCache = <box vertical spacing={10} className="pinned-apps-grid">{rows}</box>;
  return PinnedAppGridWidgetCache;
}

export default () => {
  const appLauncherContent = query(currentQuery => {
    const trimmedQuery = currentQuery.trim();

    if (!trimmedQuery) {
      return getPinnedAppsGridWidget();
    }

    // Search results logic
    let resultItems: any[] = [];
    if (isMathExpression(trimmedQuery)) {
      const result = calculateWithQalc(trimmedQuery);
      resultItems.push(MathResultItem(trimmedQuery, result));
    }
    const appItems = apps
      .fuzzy_query(currentQuery)
      .map((app: AstalApps.Application) => AppItem(app));

    return <box className="app-launcher__list" vertical>{[...resultItems, ...appItems]}</box>;
  });

  const Entry = new Widget.Entry({
    text: bind(query),
    canFocus: true,
    className: "app-launcher__entry",
    onActivate: () => {
      const currentQueryVal = query.get().trim();
      if (currentQueryVal) {
        const appResults = apps.fuzzy_query(currentQueryVal);
        if (appResults.length > 0) {
          appResults[0].launch();
          App.toggle_window("app-launcher");
        } else if (isMathExpression(currentQueryVal)) {
          App.toggle_window("app-launcher");
        }
      } else {
      }
    },
    setup: (self) => {
      self.hook(self, "notify::text", () => {
        query.set(self.get_text());
      });
    },
  });

  return (
    <PopupWindow
      scrimType="opaque"
      visible={false}
      margin={12}
      vexpand={true}
      name="app-launcher"
      namespace="app-launcher"
      className="AppLauncher"
      keymode={Astal.Keymode.EXCLUSIVE}
      exclusivity={Astal.Exclusivity.NORMAL}
      layer={Astal.Layer.OVERLAY}
      anchor={Astal.WindowAnchor.CENTER | Astal.WindowAnchor.CENTER}
      application={App}
      onKeyPressEvent={(self, event) => {
        const [keyEvent, keyCode] = event.get_keycode();
        if (keyEvent && keyCode == 9) {
          App.toggle_window(self.name);
        }
      }}
      setup={(self) => {
        self.hook(self, "notify::visible", () => {
          if (!self.get_visible()) {
            query.set("");
            // PinnedAppGridWidgetCache = null; // Optional: clear cache if app list can change dynamically
          } else {
            Entry.grab_focus();
          }
        });
      }}
    >
      <box className="app-launcher" vertical>
        <box horizontal className="app-launcher__input">
          <icon icon={icons.ui.search} />
          {Entry}
        </box>
        <scrollable vexpand>
          {appLauncherContent}
        </scrollable>
      </box>
    </PopupWindow>
  );
};
