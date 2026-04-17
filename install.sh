#!/usr/bin/env bash
set -euo pipefail

# Tempora-Desktop installer
# Improves icon installation robustness and logging.
#
# Usage: run from anywhere. The script will detect the repository directory
# (based on its own location) and copy/install files accordingly.

SCRIPT_NAME="$(basename "$0")"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

log()   { printf '\033[1;34m[INFO]\033[0m %s\n' "$*"; }
warn()  { printf '\033[1;33m[WARN]\033[0m %s\n' "$*"; }
error() { printf '\033[1;31m[ERROR]\033[0m %s\n' "$*"; }

echo
log "Running $SCRIPT_NAME from repo directory: $REPO_DIR"
echo

# Config locations to back up / install
CONFIG_PATHS=(
    "$HOME/.config/quickshell"
    "$HOME/.config/hypr"
    "$HOME/.config/wofi"
    "$HOME/.config/fish"
    "$HOME/.config/starship.toml"
)

BACKUP_ROOT="${BACKUP_DIR:-$HOME/.config/config-bkup}"
BACKUP_DIR="$BACKUP_ROOT/$SCRIPT_NAME-backup-$TIMESTAMP"

mkdir -p "$BACKUP_ROOT"

backup_config() {
    local path="$1"
    if [ -e "$path" ]; then
        mkdir -p "$BACKUP_DIR"
        log "Backing up $path -> $BACKUP_DIR/"
        mv "$path" "$BACKUP_DIR/" || {
            warn "Failed to move $path to $BACKUP_DIR. Trying copy instead."
            cp -a "$path" "$BACKUP_DIR/" || { error "Backup failed for $path"; }
            rm -rf "$path"
        }
    else
        log "No config at $path (skipping)"
    fi
}

# Ask user about backup if any config exists
config_exists=false
for p in "${CONFIG_PATHS[@]}"; do
    if [ -e "$p" ]; then config_exists=true; break; fi
done

if [ "$config_exists" = true ]; then
    printf "Detected existing config files/directories. Do you want to back them up? (y/n) "
    read -r backup_choice || backup_choice="y"
    if [[ "$backup_choice" =~ ^[Yy]$ ]]; then
        log "Backing up configs to $BACKUP_DIR"
        for p in "${CONFIG_PATHS[@]}"; do
            backup_config "$p"
        done
    elif [[ "$backup_choice" =~ ^[Nn]$ ]]; then
        log "User chose to remove existing configs. Deleting..."
        for p in "${CONFIG_PATHS[@]}"; do
            if [ -e "$p" ]; then
                log "Removing $p"
                rm -rf "$p"
            fi
        done
    else
        warn "Unrecognized choice. Continuing without backing up/removing."
    fi
else
    log "No existing config directories/files detected. Continuing."
fi

echo
# ---------------------------
# Package manager / packages
# ---------------------------
PKG_INSTALL_CMD=""
PKG_UPDATE_CMD=""

if command -v pacman >/dev/null 2>&1; then
    PKG_INSTALL_CMD="sudo pacman -S --needed"
    PKG_UPDATE_CMD="sudo pacman -Syu"
    PKG="pacman"
elif command -v apt >/dev/null 2>&1; then
    PKG_INSTALL_CMD="sudo apt install -y"
    PKG_UPDATE_CMD="sudo apt update && sudo apt upgrade -y"
    PKG="apt"
else
    warn "No supported package manager (pacman/apt) detected. Skipping system package installation steps."
    PKG=""
fi

if [ -n "$PKG" ]; then
    log "Updating packages using $PKG..."
    # Do not fail the whole script if update fails; just warn
    if ! eval "$PKG_UPDATE_CMD"; then
        warn "Package update failed. You may need to run the update manually."
    fi
fi

# Helpful packages list (adjusted for Arch default, apt users will get best-effort)
COMMON_PACKAGES=(libnotify jq git unzip)
ARCH_PACKAGES=(hyprland wofi fish starship hyprpicker hyprlock hypridle wl-clipboard brightnessctl bluez-utils cliphist sddm swww grim slurp playerctl polkit-gnome polkit-kde-agent xdg-desktop-portal-hyprland cmake ttf-opensans)
DEBIAN_PACKAGES=(wl-clipboard brightnessctl bluez-utils xdg-desktop-portal-webkit webkit2gtk-dev swww unzip playerctl polkit-gnome polkit-gnome-authentication-agent-1 fonts-open-sans)

if [ -n "$PKG" ]; then
    log "Installing common packages..."
    if command -v pacman >/dev/null 2>&1; then
        sudo pacman -S --needed "${COMMON_PACKAGES[@]}" "${ARCH_PACKAGES[@]}" || warn "Some pacman installs failed"
    elif command -v apt >/dev/null 2>&1; then
        sudo apt install -y "${COMMON_PACKAGES[@]}" "${DEBIAN_PACKAGES[@]}" || warn "Some apt installs failed"
    fi
fi

# Try to install yay if on Arch and not present (best-effort)
if command -v pacman >/dev/null 2>&1 && ! command -v yay >/dev/null 2>&1; then
    log "Attempting to install yay (AUR helper) via common approach..."
    if command -v git >/dev/null 2>&1 && command -v makepkg >/dev/null 2>&1; then
        TMPDIR="$(mktemp -d)"
        git clone --depth=1 https://aur.archlinux.org/yay.git "$TMPDIR/yay" && \
        (cd "$TMPDIR/yay" && makepkg -si --noconfirm) || warn "yay installation failed; please install manually"
        rm -rf "$TMPDIR"
    else
        warn "git or makepkg not found; cannot auto-install yay."
    fi
fi

echo
# ---------------------------
# Icon installation
# ---------------------------
log "Installing icons..."

# Ensure ~/.icons exists
USER_ICONS_DIR="$HOME/.icons"
mkdir -p "$USER_ICONS_DIR"

# 1) Phosphor icons (from upstream)
PHOSPHOR_DIR="$USER_ICONS_DIR/phosphor-core"
PHOSPHOR_REPO="https://github.com/phosphor-icons/core.git"

if [ -d "$PHOSPHOR_DIR" ]; then
    log "Phosphor icons already present at $PHOSPHOR_DIR. Attempting to update..."
    if command -v git >/dev/null 2>&1; then
        git -C "$PHOSPHOR_DIR" pull --rebase --ff-only || log "Could not update phosphor repo (non-fatal)"
    else
        warn "git not found; cannot update $PHOSPHOR_DIR"
    fi
else
    if command -v git >/dev/null 2>&1; then
        log "Cloning Phosphor icons into $PHOSPHOR_DIR..."
        git clone --depth=1 "$PHOSPHOR_REPO" "$PHOSPHOR_DIR" || warn "Failed to clone Phosphor icons"
    else
        warn "git is required to clone Phosphor icons. Skipping clone."
    fi
fi

echo
# ---------------------------
# Copy configuration files
# ---------------------------
log "Installing config files from repository to $HOME/.config (preserving existing backups)..."
mkdir -p "$HOME/.config"
if [ -d "$REPO_DIR/.config" ]; then
    rsync -a --no-perms --chmod=Du=rwx,Dg=rx,Fu=rw,Fg=r "$REPO_DIR/.config/" "$HOME/.config/" || warn "Failed to copy some config files"
else
    log "No .config directory found in repository; skipping config copy."
fi

mkdir -p "$HOME/.local/bin"
if [ -f "$REPO_DIR/.local/bin/hyprland-flee-bravely" ]; then
    log "Installing hyprland-flee-bravely to $HOME/.local/bin"
    install -Dm755 "$REPO_DIR/.local/bin/hyprland-flee-bravely" "$HOME/.local/bin/hyprland-flee-bravely" || warn "Failed to install hyprland-flee-bravely"
fi

# sddm themes
if [ -d "$REPO_DIR/.config/sddm/themes" ]; then
    log "Installing SDDM themes to /usr/share/sddm (requires sudo)..."
    sudo mkdir -p /usr/share/sddm/themes
    sudo rsync -a --delete "$REPO_DIR/.config/sddm/themes/" /usr/share/sddm/themes/ || warn "Failed to copy sddm themes"
    # adjust ownership of backgrounds if present
    if [ -d "/usr/share/sddm/themes/frolic/Backgrounds" ]; then
        sudo chown -R "$USER":"$USER" /usr/share/sddm/themes/frolic/Backgrounds || warn "Failed to chown SDDM backgrounds"
    fi
fi

if [ -f "$REPO_DIR/.config/sddm/sddm.conf" ]; then
    log "Installing sddm.conf to /etc (requires sudo)"
    sudo install -Dm644 "$REPO_DIR/.config/sddm/sddm.conf" /etc/sddm.conf || warn "Failed to install /etc/sddm.conf"
fi

# Copy wallpapers
if [ -d "$REPO_DIR/wallpapers" ]; then
    mkdir -p "$HOME/Pictures"
    log "Copying wallpapers to $HOME/Pictures"
    rsync -a "$REPO_DIR/wallpapers/" "$HOME/Pictures/" || warn "Failed to copy wallpapers"
fi

echo
log "Installation steps completed. Summary of potential manual steps:"
echo "- If icons still do not appear, ensure the QML app is loading icons from the filesystem (use file:// paths), or package icons into the application's qrc."
echo "- If using Qt/QML, ensure Qt SVG support is installed (qt5-svg / qt6-svg) so QML Image can render SVGs."
echo "- You may need to relogin or restart your session for some desktop services (like SDDM or icon caches) to pick up new icons."
echo "- If you installed system-wide icons, run: sudo gtk-update-icon-cache -f /usr/share/icons/Frolic (if applicable)."
echo

log "Done. If you see any warnings above, please address them and re-run this script as needed."
exit 0
