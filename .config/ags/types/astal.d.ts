declare module 'astal/gtk3' {
    export const App: any;
    export const Gdk: any;
    export const Gtk: any;
    export const Gio: any;
}

declare module 'astal' {
    export function exec(command: string): string;
    export function execAsync(command: string): Promise<string>;
    export function writeFile(path: string, content: string): void;
    export function writeFileAsync(path: string, content: string): Promise<void>;
}
