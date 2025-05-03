import { GLib, Gio } from 'astal';
import { fetch } from './fetch';
import { ensureDirectory } from './utils';

const BING_API_URL = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US';
const SAVE_DIR = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'ags']); // Added a subdir for clarity
const SAVE_FILENAME = 'bing.jpg';
const SAVE_PATH = GLib.build_filenamev([SAVE_DIR, SAVE_FILENAME]);
const TARGET_HOUR = 5;
const TARGET_MINUTE = 0;
const SECONDS_IN_A_DAY = 24 * 60 * 60;

const log = (msg: string) => console.log(`[BingImageService] ${msg}`);
const err = (msg: string, e?: any) => console.error(`[BingImageService] ERROR: ${msg}`, e);

async function getImageUrl(): Promise<string> {
    log('Fetching image metadata from Bing API...');
    const response = await fetch(BING_API_URL);

    if (!response.ok) {
        throw new Error(`Bing API request failed with status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data?.images?.[0]?.url) {
        err('Invalid API response structure:', data);
        throw new Error('Could not find image URL in Bing API response.');
    }

    const urlbase = data.images[0].urlbase;
    if (!urlbase) {
        err('Could not find image urlbase in Bing API response:', data);
        throw new Error('Could not find image urlbase in Bing API response.');
    }
    const imageUrl = `https://www.bing.com${urlbase}_1920x1080.jpg`;

    log(`Found image URL: ${imageUrl}`);
    return imageUrl;
}

async function downloadImage(url: string): Promise<GLib.Bytes> {
    log(`Downloading image from ${url}...`);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Image download failed with status: ${response.status} ${response.statusText}`);
    }

    const gBytes = await response.gBytes(); // Use the gBytes method from fetch.ts Response
    if (!gBytes) {
        throw new Error('Failed to get image data as GLib.Bytes');
    }
    log(`Image downloaded successfully (${(gBytes.get_size() / 1024).toFixed(1)} KB).`);
    return gBytes;
}

async function saveImage(imageBytes: GLib.Bytes, filePath: string): Promise<void> {
    log(`Saving image to: ${filePath}`);
    const file = Gio.File.new_for_path(filePath);

    const replaceAsync = (bytes: GLib.Bytes) => new Promise<[boolean, string | null]>((resolve, reject) => {
        file.replace_contents_async(
            bytes,             // contents
            null,              // etag (optional)
            false,             // make_backup
            Gio.FileCreateFlags.REPLACE_DESTINATION, // flags
            null,              // cancellable
            (source_object, res) => { // callback
                try {
                    // Ensure finish is called on the correct object (file)
                    const [success, new_etag] = file.replace_contents_finish(res);
                    resolve([success, new_etag]);
                } catch (e) {
                    reject(e);
                }
            }
        );
    });

    try {
        const [success, _new_etag] = await replaceAsync(imageBytes);

        if (!success) {
            throw new Error('Gio.File.replace_contents failed.');
        }

        log('Image saved successfully.');

    } catch (e: any) {
        // Provide more context on error
        err(`Failed to save image to ${filePath}: ${e.message}`, e);
        // Check if it's a GLib error and log details if available
        if (e instanceof GLib.Error) {
             err(`GLib Error Domain: ${e.domain}, Code: ${e.code}, Message: ${e.message}`);
        }
        throw e; // Re-throw the error
    }
}

async function fetchAndSaveBingImage(): Promise<void> {
    log('--- Starting Bing Image Update ---');
    try {
        ensureDirectory(SAVE_DIR);

        const imageUrl = await getImageUrl();
        const imageBytes = await downloadImage(imageUrl);
        await saveImage(imageBytes, SAVE_PATH);
        log('--- Bing Image Update Complete ---');
    } catch (error: any) {
        err('!!! Bing Image Update Failed !!!', error);
        log('---------------------------------');
    }
}

function scheduleNextRun() {
    try {
        const now = GLib.DateTime.new_now_local();
        
        let target = now.add_hours(TARGET_HOUR - now.get_hour());
        target = target.add_minutes(TARGET_MINUTE - target.get_minute());
        target = target.add_seconds(-target.get_second());
        target = target.add_seconds(-Math.floor(target.get_microsecond() / 1000000));

        if (now.compare(target) > 0) {
            target = target.add_days(1);
        }

        const secondsUntilTarget = Math.max(1, Math.round(target.difference(now) / 1000000));

        log(`Scheduling next run at ${target.format('%Y-%m-%d %H:%M:%S')} (in ${secondsUntilTarget} seconds).`);

        GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, secondsUntilTarget, () => {
            log(`--- Running initial scheduled task (${GLib.DateTime.new_now_local().format('%Y-%m-%d %H:%M:%S')}) ---`);
            fetchAndSaveBingImage().catch(e => err("Error during scheduled fetch", e));

            GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, SECONDS_IN_A_DAY, () => {
                log(`--- Running daily scheduled task (${GLib.DateTime.new_now_local().format('%Y-%m-%d %H:%M:%S')}) ---`);
                fetchAndSaveBingImage().catch(e => err("Error during daily scheduled fetch", e));
                return GLib.SOURCE_CONTINUE;
            });

            return GLib.SOURCE_REMOVE;
        });
    } catch (e) {
        err("Failed to schedule next run", e);
    }
}


export function initBingImageService() {
    log('Initializing Bing Image Service...');
    fetchAndSaveBingImage()
        .catch(e => {
            err("Initial fetch failed during init", e);
        })
        .finally(() => {
            scheduleNextRun();
        });
}
