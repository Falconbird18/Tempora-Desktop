// ags/types/ags.d.ts

// This file provides TypeScript type definitions for the AGS (A Non-Googly Shell) environment,
// which is built using GObject Introspection (GI) and Gtk3/4 bindings via a library like "astal".
// It aims to provide type information for the global AGS objects (App, imports),
// core utilities from "astal", GTK/GDK types and widgets, and GI modules.

// Note: These definitions are based on common AGS patterns and usage inferred
// from project files. The actual types might vary slightly depending on the
// specific version of AGS and the "astal" library being used.

// Declare global imports object, used to access GObject Introspection libraries
declare const imports: {
  gi: {
    // Minimal declarations for common GI namespaces accessed via imports.gi
    GLib: typeof GLib;
    Gio: typeof Gio;
    Gtk: typeof Gtk;
    Gdk: typeof Gdk;
    // Add other imports.gi namespaces as needed, e.g., AstalWp if accessed this way
    [key: string]: any; // Allow access to other GI namespaces not explicitly listed
  };
  // Add other top-level imports if AGS makes them globally available this way
  [key: string]: any; // Allow access to other top-level imports not explicitly listed
};

// Declare global App object, the main AGS application instance
declare const App: {
  // Methods for managing windows
  get_monitors(): Gdk.Monitor[];
  getWindow(name: string): Astal.Window | undefined;
  addWindow(name: string, window: Astal.Window): void;
  removeWindow(name: string): void;
  openWindow(name: string): void;
  closeWindow(name: string): void;
  toggleWindow(name: string): void;

  // Application lifecycle and CSS management
  start(config: {
    main: () => void;
    requestHandler?: (request: string, res: (response: any) => void) => void;
    maxFps?: number;
    // Add other App start config properties if known
    [key: string]: any;
  }): void;
  quit(): void;
  reset_css(): void;
  apply_css(path: string): void;

  // Signal handling
  connect(signal: string, callback: (...args: any[]) => void): number;

  // JSX factory for creating widgets
  // When "jsxFactory": "App.createElement" is set in tsconfig.json
  createElement(
    type: string | Function, // Widget tag name (string) or function component
    props: object | null, // JSX attributes/props
    ...children: any[] // Child nodes
  ): Gtk.Widget; // Should return a GTK widget

  // Add other App methods/properties used
  [key: string]: any; // Allow access to other App properties/methods
};

// Declare GObject Introspection (GI) namespaces and types that might be
// available globally or via imports.gi. These are simplified based on common usage.

declare namespace GLib {
  function get_home_dir(): string;
  function timeout_add(interval: number, callback: () => boolean | void): number;
  function idle_add(callback: () => boolean | void): number;
  function source_remove(tag: number): boolean;

  class Variant {
    constructor(value: any); // Simplified
    // Add properties/methods if used
    [key: string]: any;
  }

  class VariantDict {
    insert_value(key: string, value: Variant): void;
    lookup_value(key: string, expected_type: string): Variant | null;
    end(): Variant;
    [key: string]: any;
  }

  class KeyFile {
    load_from_file(file: string, flags: number): boolean;
    get_string(group: string, key: string): string | null;
    set_string(group: string, key: string, value: string): void;
    save_to_file(file: string): boolean;
    [key: string]: any;
  }

  enum KeyFileFlags {
    NONE,
    KEEP_COMMENTS,
    KEEP_TRANSLATIONS,
    // Add other flags if needed
  }

  // Add other GLib functions/types used
  [key: string]: any;
}

declare namespace Gdk {
  class Monitor {
    // Add properties/methods of Monitor if needed
    get_geometry(): { x: number; y: number; width: number; height: number };
    get_workarea(): { x: number; y: number; width: number; height: number };
    [key: string]: any;
  }

  class Event {
    type: number; // Gdk.EventType
    get_time(): number;
    [key: string]: any;
  }

  class EventButton extends Event {
    button: number; // Mouse button (1, 2, 3)
    get_click_count(): number;
    [key: string]: any;
  }

  // Add other Gdk types used
  [key: string]: any;
}

declare namespace Gtk {
  // Base Widget class
  class Widget {
    // Common properties
    visible: boolean;
    sensitive: boolean;
    tooltip_text: string | null;
    has_tooltip: boolean;
    halign: Gtk.Align;
    valign: Gtk.Align;
    hexpand: boolean;
    vexpand: boolean;
    opacity: number;
    css_classes: string[]; // GTK4 property
    style_context: any; // Simplified Gtk.StyleContext

    // Common methods
    destroy(): void;
    show_all(): void;
    hide(): void;
    queue_draw(): void;
    get_style_context(): any; // Simplified
    add_class(className: string): void; // AGS helper? Or GTK4 style context method?
    remove_class(className: string): void; // AGS helper?
    toggle_class(className: string): void; // AGS helper?
    has_class(className: string): boolean; // AGS helper?
    set_size_request(width: number, height: number): void;
    set_opacity(opacity: number): void;
    set_visible(visible: boolean): void;
    set_halign(align: Gtk.Align): void;
    set_valign(align: Gtk.Align): void;
    set_hexpand(expand: boolean): void;
    set_vexpand(expand: boolean): void;
    set_css(css: string): void; // AGS CSS string setter

    // AGS-specific 'hook' method for reacting to signals/Variable changes
    hook(
      object: any, // The object emitting the signal or Variable
      signal: string, // The signal name or 'notify::property'
      callback: (self: this, ...args: any[]) => void, // Callback receives the hooked widget as 'self'
    ): void; // Simplified hook signature

    // Connect GTK signals (GObject signals)
    connect(signal: string, callback: (...args: any[]) => void): number;

    // Add other common Widget properties/methods used
    [key: string]: any; // Allow access to other properties/methods
  }

  // Container base class (Widgets that can contain other widgets)
  class Container extends Widget {
    add(widget: Widget): void;
    remove(widget: Widget): void;
    get_children(): Widget[];
    // Add other Container methods
    [key: string]: any;
  }

  // Common GTK Widget subclasses
  class Box extends Container {
    constructor(props?: {
      className?: string;
      halign?: Gtk.Align;
      valign?: Gtk.Align;
      CSS?: string; // AGS custom CSS prop?
      css?: string; // Standard GTK CSS prop? Or AGS alias?
      children?: (Gtk.Widget | null | undefined)[]; // Children for Box
      vertical?: boolean; // Orientation
      spacing?: number;
      homogeneous?: boolean;
      child?: Gtk.Widget | null | undefined; // For single-child containers or when using 'child' prop in JSX
      setup?: (self: Box) => void; // AGS setup function
      // Add other Box properties
      [key: string]: any;
    });
    children: (Gtk.Widget | null | undefined)[]; // Children property for Box
    vertical: boolean;
    spacing: number;
    homogeneous: boolean;
    // Note: 'child' prop in JSX typically maps to `add()` for single-child containers.
    // A Box can have multiple children added via the 'children' prop array or subsequent `add()` calls.
    [key: string]: any;
  }

  class Icon extends Widget {
    constructor(props?: {
      pixelSize?: number;
      size?: number; // Common alternative for pixelSize
      valign?: Gtk.Align;
      halign?: Gtk.Align;
      icon?: string | Variable<string>; // Icon name (string) or a Variable
      className?: string;
      // Add other Icon properties
      [key: string]: any;
    });
    icon_name: string | null; // Standard GTK property for named icons
    gicon: any | null; // Gtk.Icon or Gdk.Paintable for themed/image icons (simplified)
    pixel_size: number; // Standard GTK property
    [key: string]: any;
  }

  class Label extends Widget {
    constructor(props?: {
      label?: string | Variable<string>; // Text content (string) or a Variable
      className?: string;
      halign?: Gtk.Align;
      valign?: Gtk.Align;
      xalign?: number; // Horizontal alignment within allocated space (0-1)
      yalign?: number; // Vertical alignment within allocated space (0-1)
      wrap?: boolean;
      maxWidthChars?: number;
      truncateMode?: Gtk.TruncateMode;
      useMarkup?: boolean; // If label contains Pango markup
      // Add other Label properties
      [key: string]: any;
    });
    label: string | null; // Standard GTK property
    use_markup: boolean; // Standard GTK property
    xalign: number;
    yalign: number;
    wrap: boolean;
    max_width_chars: number; // Standard GTK property
    ellipsize: Gtk.TruncateMode; // Standard GTK property
    [key: string]: any;
  }

  class Button extends Container {
    constructor(props?: {
      className?: string;
      onPrimaryClick?: (self: Button, event: Gdk.EventButton) => void;
      onSecondaryClick?: (self: Button, event: Gdk.EventButton) => void;
      onMiddleClick?: (self: Button, event: Gdk.EventButton) => void;
      on_clicked?: (self: Button) => void; // Standard GTK signal
      child?: Gtk.Widget | null | undefined; // Child widget for the button
      cursor?: string; // CSS cursor style?
      tooltipText?: string | Variable<string>; // Tooltip text (string) or Variable (AGS helper?)
      has_tooltip?: boolean;
      // Add other Button properties
      [key: string]: any;
    });
    child: Gtk.Widget | null; // Standard GTK property
    // Signals as properties for convenience/JSX
    onPrimaryClick?: (self: Button, event: Gdk.EventButton) => void;
    onClicked?: (self: Button) => void;
    // Add other Button properties/methods
    [key: string]: any;
  }

  class Revealer extends Container {
    constructor(props?: {
      transition?: string; // e.g., "slide_down", "slide_up", "crossfade", "slide_left", "slide_right"
      revealChild?: boolean | Variable<boolean>; // Whether the child is revealed (boolean) or Variable
      transitionDuration?: number; // milliseconds
      child?: Gtk.Widget | null | undefined;
      className?: string;
      // Add other Revealer properties
      [key: string]: any;
    });
    transition: string;
    reveal_child: boolean; // Standard GTK property
    transition_duration: number; // Standard GTK property (in milliseconds)
    child: Gtk.Widget | null;
    [key: string]: any;
  }

  class Stack extends Container {
    constructor(props?: {
      transition?: string; // e.g., "slide-left-right", "slide-up-down", "fade"
      transitionDuration?: number; // milliseconds
      children?: (Gtk.Widget | null | undefined)[]; // Children for Stack (each needs a 'name' property?)
      shownChild?: string | Variable<string>; // Name of the currently shown child (string) or Variable
      className?: string;
      // Add other Stack properties
      [key: string]: any;
    });
    transition_type: string; // Standard GTK property (e.g., Gtk.StackTransitionType) - check AGS mapping
    transition_duration: number;
    visible_child_name: string | null; // Standard GTK property
    // children: (Gtk.Widget | null | undefined)[]; // Children are added via add_named or similar
    [key: string]: any;
  }

  class Slider extends Widget {
    constructor(props?: {
      value?: number | Variable<number>; // Current value (number between 0 and 1) or Variable
      className?: string;
      onChange?: (self: Slider, value: number) => void; // Common JS-like naming for value change callback
      on_change?: (self: Slider, value: number) => void; // Gtk signal naming
      vertical?: boolean;
      drawValue?: boolean; // Whether to draw the current value next to the slider
      // Add other Slider properties
      [key: string]: any;
    });
    value: number; // Standard GTK property (0-1)
    orientation: Gtk.Orientation; // Standard GTK property (Gtk.Orientation.HORIZONTAL/VERTICAL)
    draw_value: boolean; // Standard GTK property
    // Signals as properties for convenience/JSX
    on_change?: (self: Slider, value: number) => void; // Emits when value changes
    [key: string]: any;
  }

  class DrawingArea extends Widget {
    constructor(props?: {
      className?: string;
      on_draw?: (self: DrawingArea, cr: any) => boolean; // cairo context (simplified as any)
      // Add other DrawingArea properties
      [key: string]: any;
    });
    // Signals as properties for convenience/JSX
    on_draw?: (self: DrawingArea, cr: any) => boolean;
    [key: string]: any;
  }

  // Add other common Gtk widget classes used (e.g., Image, Spinner, Entry, Text, Scrollable)
  // Image, Spinner, Entry, Text, Scrollable, TextView etc.

  // Gtk Enums
  enum Align {
    START,
    END,
    CENTER,
    BASELINE,
    FILL,
  }

  enum Orientation {
    HORIZONTAL,
    VERTICAL,
  }

  enum TruncateMode {
    NONE,
    START,
    MIDDLE,
    END,
  }

  enum StackTransitionType {
    NONE,
    CROSSFADE,
    SLIDE_RIGHT,
    SLIDE_LEFT,
    SLIDE_UP,
    SLIDE_DOWN,
    SLIDE_LEFT_RIGHT,
    SLIDE_UP_DOWN,
    // Add other types if needed
  }

  // Add other Gtk enums, constants etc.
  [key: string]: any;
}

declare namespace Gio {
  class IOError extends Error {
    // Add properties/methods of IOError if needed
    [key: string]: any;
  }
  // Add other Gio types used (e.g., File, Cancellable, InputStream, OutputStream)
  [key: string]: any;
}

// Declare Widget namespace/alias for constructor-like access and JSX mapping
// This namespace seems to hold aliases to Gtk.Widget subclasses for convenient creation
declare namespace Widget {
  // These aliases allow using `new Widget.Box()` or `<box>` in JSX (when mapped via IntrinsicElements)
  const Icon: typeof Gtk.Icon;
  const Box: typeof Gtk.Box;
  const Label: typeof Gtk.Label;
  const Button: typeof Gtk.Button;
  const Revealer: typeof Gtk.Revealer;
  const Stack: typeof Gtk.Stack;
  const Slider: typeof Gtk.Slider;
  const DrawingArea: typeof Gtk.DrawingArea;
  // Add other Widget aliases used (e.g., Image, Spinner, Entry, Text, Scrollable, TextView)

  const Any: typeof Gtk.Widget; // Generic Widget constructor/type
  // Add other common Widget methods/properties if Widget namespace adds them
  [key: string]: any;
}

// Declare Astal namespace and types
// Astal might contain core AGS concepts or specific widget types like Window,
// and potentially re-export core GTK/GDK/Widget/App objects.
declare namespace Astal {
  // Enums used by Astal types, e.g., Window
  enum Layer {
    BACKGROUND,
    BOTTOM,
    TOP,
    OVERLAY,
    FULLSCREEN,
  }

  enum WindowAnchor {
    TOP,
    BOTTOM,
    LEFT,
    RIGHT,
    TOP_LEFT,
    TOP_RIGHT,
    BOTTOM_LEFT,
    BOTTOM_RIGHT,
    CENTER, // Common extension
  }

  // Astal's custom Window type, based on Gtk.Window or similar
  class Window extends Gtk.Widget {
    constructor(props?: {
      visible?: boolean | Variable<boolean>;
      className?: string;
      namespace?: string; // Unique name for the window, used by App.getWindow/toggleWindow etc.
      gdkmonitor?: Gdk.Monitor; // Monitor to display the window on
      layer?: Astal.Layer; // Layer on the window stack (background, overlay etc.)
      anchor?: Astal.WindowAnchor | string; // Placement on the screen (enum or space-separated string like "bottom right")
      exclusivestate?: "normal" | "fullscreen" | "maximized"; // Wayland exclusive state
      focusable?: boolean; // Whether the window can receive focus
      child?: Gtk.Widget | null | undefined; // The main child of the window
      popup?: boolean; // If it's a popup window (e.g., for menus, notifications)
      setup?: (self: Window) => void; // AGS setup function
      // Add other Window properties
      [key: string]: any;
    });
    // Properties often accessible
    visible: boolean;
    className: string;
    namespace: string;
    gdkmonitor: Gdk.Monitor | undefined;
    layer: Astal.Layer;
    anchor: Astal.WindowAnchor | string;
    exclusivestate: "normal" | "fullscreen" | "maximized";
    // Note: App.addWindow is typically used to register the window instance globally by namespace
    // The child widget is often added via the 'child' prop in JSX or the `add` method.
    add(child: Gtk.Widget): void; // Windows are containers

    // Add other Window properties/methods used
    [key: string]: any;
  }

  // Astal might also expose Gtk types directly or provide wrappers
  const Gtk: typeof Gtk;
  const Gdk: typeof Gdk;
  const Widget: typeof Widget; // Re-export the Widget namespace/aliases
  const App: typeof App; // Re-export the global App object

  // Add other Astal members
  [key: string]: any;
}

// Declare global functions/classes exposed by the "astal" binding library
// These seem to be core utilities for execution, file handling, and reactive variables.

/**
 * Executes a command synchronously and returns its output.
 */
declare function exec(command: string | string[]): string; // Accepts string command or array of command and args

/**
 * Executes a command asynchronously and returns a Promise resolving with its output.
 */
declare function execAsync(command: string | string[]): Promise<string>; // Accepts string command or array of command and args

/**
 * Writes content to a file.
 */
declare function writeFile(path: string, content: string): void;

/**
 * Creates a reactive Variable.
 * Variables hold a value that can be observed for changes.
 */
declare class Variable<T> {
  constructor(value: T, opts?: {
    poll?: number; // Poll interval in milliseconds
    listen?: string | string[]; // Command/signals to listen to for updates
    // Add other Variable options if known
    [key: string]: any;
  });

  // The current value of the variable. Can often be accessed directly.
  value: T;

  // Methods for interacting with the value and observing changes
  get(): T; // Explicit getter
  set(value: T): void; // Explicit setter
  connect(callback: (value: T) => void): number; // Add a listener for value changes (returns handler id)
  subscribe(callback: (value: T) => void): number; // Alias for connect? Or slightly different behavior?
  changed(callback: (self: this) => void): void; // Hook-like method for changes

  // Clean up listeners, polling, etc.
  dispose(): void;

  // Add other Variable properties/methods used
  [key: string]: any;
}

/**
 * Binds a property of an object to a Variable, creating a reactive link.
 */
declare function bind<T>(object: any, property: string): Variable<T>;

/**
 * Adds a timeout source to the main loop.
 * Callback is called after `ms` milliseconds.
 * If callback returns true, it repeats; otherwise, it's removed.
 * Returns a source id (number).
 */
declare function timeout(ms: number, callback: () => boolean | void): number;

/**
 * Adds an idle source to the main loop.
 * Callback is called when the main loop is idle.
 * If callback returns true, it repeats; otherwise, it's removed.
 * Returns a source id (number).
 */
declare function idle(callback: () => boolean | void): number;

// These might be wrappers around GLib.timeout_add and GLib.idle_add.

// Declare module for gi://AstalWp
// This is a GObject Introspection (GI) module for interacting with system services
// like audio, brightness, network, etc. It's typically accessed via `imports.gi`.
// The module itself might have static methods or properties, or it might require
// calling a function like `get_default` to get an instance or interface.

declare module "gi://AstalWp?version=0.1" {
  // The default export is likely the namespace object itself, which might contain static methods
  interface AstalWpNamespace {
    // It might have a static method called get_default, or the properties are directly on the namespace object
    get_default():
      | {
          // Define the return type of get_default
          audio: {
            defaultSpeaker?: {
              // defaultSpeaker might be undefined or null
              volumeIcon: Variable<string>;
              mute: Variable<boolean>;
              volume: Variable<number>; // Assuming volume is a number between 0 and 1
              name: string;
              description: string;
              // Add other speaker properties used
              [key: string]: any;
            };
            defaultMic?: {
              // defaultMic might be undefined or null
              volumeIcon: Variable<string>;
              mute: Variable<boolean>;
              volume: Variable<number>; // Assuming volume is a number
              name: string;
              description: string;
              [key: string]: any;
            };
            // Add other audio properties used, e.g., speakers, mics, defaultSpeakerName
            [key: string]: any;
          };
          brightness: {
            // Assuming brightness is accessed similarly
            screen: Variable<number>; // Screen brightness, typically 0-1
            kbd?: Variable<number>; // Keyboard brightness (optional)
            [key: string]: any;
          };
          // Add other properties/methods on the object returned by get_default if needed
          [key: string]: any;
        }
      | null
      | undefined; // get_default might return null or undefined if service is not available

    // Add other static properties/methods of the AstalWp object if used directly
    // e.g., if AstalWp.SomeConstant or AstalWp.SomeStaticMethod() is used without get_default()
    [key: string]: any;
  }
  // The import statement `import AstalWp from "gi://AstalWp?version=0.1";` suggests
  // the default export is the AstalWpNamespace object itself.
  const AstalWp: AstalWpNamespace;
  export default AstalWp; // Export the object itself
}

// Declare module for "astal" - core bindings/utilities
// This module seems to re-export some globals or provide wrappers for system interactions
declare module "astal" {
  export { exec, execAsync, writeFile, bind, timeout, idle, Variable, GLib };
  // Add other exports from "astal" if known
  // Example: export { SomeOtherUtility } from './some/path';
}

// Declare module for "astal/gtk3" - GTK bindings and App/Widget/Astal objects
// This module seems to re-export core GTK/GDK namespaces and the AGS-specific App/Widget/Astal objects
declare module "astal/gtk3" {
  export { App, Gdk, Gtk, Widget, Astal };
  // Add other exports from "astal/gtk3" if known
  // Example: export { CSSProvider } from './css';
}

// Declare top-level widget/service initialization functions
// These seem to be functions that create/initialize windows or services and add them to the App
// They might return the created widget or service instance, or just have side effects.
// Using 'any' for now as return types are not fully clear from usage, but ideally
// they would return the Gtk.Widget (specifically Astal.Window) they create.

declare function Notifications(): any; // Likely creates a window/service
declare function Weather(): any; // Likely creates a window/service
declare function Media(): any; // Likely creates a window/service
declare function SideBar(): any; // Likely creates a window/service
declare function Clipboard(): any; // Likely creates a window/service
declare function Screenshot(): any; // Likely creates a window/service
declare function ControlCenter(): any; // Likely creates a window/service
declare function Scrim(config: { scrimType: string; className: string }): any; // Likely creates a window
declare function SinkMenu(): any; // Likely creates a window/menu
declare function MixerMenu(): any; // Likely creates a window/menu
declare function Verification(): any; // Likely creates a window/dialog
declare function Powermenu(): any; // Likely creates a window/menu
declare function Dashboard(): any; // Likely creates a window/dashboard
declare function AppLauncher(): any; // Likely creates a window

// These functions, based on app.ts, seem to create and return Gtk.Widget instances (specifically windows)
// They are then added to the App's monitor-specific maps.
declare function Bar(monitor: Gdk.Monitor): Gtk.Widget;
declare function TaskBar(monitor: Gdk.Monitor): Gtk.Widget;
declare function NotificationsPopup(monitor: Gdk.Monitor): Gtk.Widget;
declare function OSD(monitor: Gdk.Monitor): Gtk.Widget; // This is the one being worked on

// Declare services used directly (assuming they are class instances or objects)
// Based on app.ts imports and usage
declare const ScreenRecordService: {
  start(): void;
  stop(): void;
  // Add other methods if known
  [key: string]: any;
};

declare const StarshipService: {
  updateConfig(): Promise<void>;
  // Add other methods if known
  [key: string]: any;
};

declare const HyprlockService: {
  updateConfig(): Promise<void>;
  // Add other methods if known
  [key: string]: any;
};

declare const KittyThemesService: {
  generateAllThemes(): Promise<void>;
  // Add other methods if known
  [key: string]: any;
};

declare function initBingImageService(): void; // Appears to be an initialization function

// Declare reactive variables used globally or imported
// These seem to be Variable instances for application settings or state.
declare const currentTheme: Variable<string>;
declare const currentMode: Variable<string>;
declare const transparentItems: Variable<boolean>;
declare const transparentBar: Variable<boolean>;
declare const paddingSize: Variable<number>; // Assuming paddingSize is a number

// Declare JSX IntrinsicElements
// This tells TypeScript what tags are valid in JSX and what properties they accept.
// The tags map to AGS Widget types, likely created via App.createElement.
// The property types should match the constructor parameters or accessible properties
// of the corresponding Gtk/Astal widget classes.

declare namespace JSX {
  interface IntrinsicElements {
    // Map lowercase tag names to the properties expected by their constructors or factories.
    // Use ConstructorParameters<typeof Widget>[0] to get the constructor arguments type,
    // or define an interface matching the expected props.
    // Add `ref?: any; key?: any;` for common React-like JSX patterns if applicable.

    // AGS Window
    window: ConstructorParameters<typeof Astal.Window>[0] & {
      ref?: any; // Optional ref prop
      key?: any; // Optional key prop
    };

    // GTK Widgets mapped via Widget namespace or used directly
    box: ConstructorParameters<typeof Gtk.Box>[0] & { ref?: any; key?: any };
    icon: ConstructorParameters<typeof Gtk.Icon>[0] & { ref?: any; key?: any };
    label: ConstructorParameters<typeof Gtk.Label>[0] & { ref?: any; key?: any };
    button: ConstructorParameters<typeof Gtk.Button>[0] & { ref?: any; key?: any };
    revealer: ConstructorParameters<typeof Gtk.Revealer>[0] & {
      ref?: any;
      key?: any;
    };
    stack: ConstructorParameters<typeof Gtk.Stack>[0] & { ref?: any; key?: any };
    slider: ConstructorParameters<typeof Gtk.Slider>[0] & { ref?: any; key?: any };
    drawingarea: ConstructorParameters<typeof Gtk.DrawingArea>[0] & {
      ref?: any;
      key?: any;
    };

    // Add other JSX elements used in the project, mapping them to their corresponding Gtk/Astal widgets.
    // Example: If `<centerbox>` is used and maps to Gtk.Box with center alignment:
    // centerbox: ConstructorParameters<typeof Gtk.Box>[0] & { ref?: any; key?: any; };
    // Example: If a generic `<widget>` tag exists that maps to Gtk.Widget:
    // widget: ConstructorParameters<typeof Gtk.Widget>[0] & { ref?: any; key?: any; };

    // Allow any other tag with any properties as a fallback
    [elemName: string]: any; // Fallback for tags not explicitly defined
  }
}
