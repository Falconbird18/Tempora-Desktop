#!/bin/bash

echo "This script will guide you through the installation of Tempora Desktop / Frolic Dotfiles."

# Define the Quickshell config directory and backup directory
CONFIG_PATHS=(
    "$HOME/.config/quickshell"
    "$HOME/.config/hypr"
    "$HOME/.config/wofi"
    "$HOME/.config/fish"
    "$HOME/.config/starship.toml"
)

# Define the backup directory
BACKUP_DIR="$HOME/.config/config-bkup"

# Create the backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to back up a directory or file
backup_config() {
    local path="$1"
    local backup_path="$BACKUP_DIR/$(basename "$path")"

    if [ -e "$path" ]; then
        echo "Backing up $path to $backup_path..."
        mv "$path" "$backup_path"
        echo "Backup completed for $path."
    else
        echo "$path not found. Nothing to back up."
    fi
}

# Check if any of the config paths exist
config_exists=false
for path in "${CONFIG_PATHS[@]}"; do
    if [ -e "$path" ]; then
        config_exists=true
        break
    fi
done

# If config paths exist, ask the user if they want to back up their configs
if [ "$config_exists" = true ]; then
    read -p "Do you want to back up your config directories and files? (y/n): " backup_choice

    # Process the user's choice
    if [[ "$backup_choice" =~ ^[Yy]$ ]]; then
        # Backup each config path
        for path in "${CONFIG_PATHS[@]}"; do
            backup_config "$path"
        done
    elif [[ "$backup_choice" =~ ^[Nn]$ ]]; then
        # Delete each config path
        for path in "${CONFIG_PATHS[@]}"; do
            if [ -e "$path" ]; then
                echo "Deleting $path..."
                rm -rf "$path"
                echo "$path deleted."
            else
                echo "$path not found. Nothing to delete."
            fi
        done
    else
        # Handle invalid input
        echo "Invalid choice. Continuing with installation..."
    fi
else
    echo "No config directories or files found. Continuing with installation..."
fi

echo "Backup process completed."

# Pacman update
echo "Updating pacman..."
sudo pacman -Syu
echo "Pacman updated."

# Install yay
if ! command -v yay &> /dev/null; then
    echo "Installing yay..."
    sudo pacman -S --needed yay
    echo "Yay installed."
fi

# Install packages
echo "Installing packages..."
sudo pacman -S --needed hyprland wofi fish starship hyprpicker hyprlock hypridle wl-clipboard brightnessctl bluez-utils cliphist sddm git swww unzip grim libqalculate webkit2gtk-4.1 slurp playerctl polkit-gnome polkit-kde-agent xdg-desktop-portal-hyprland
yay -S --needed quickshell nbfc-linux bibata-cursor-theme-bin
# wl-screenrec
echo "Packages installed."

echo "Installing Open Sans..."
sudo pacman -S --needed ttf-opensans
echo "Open Sans installed."

# Copy the config files from local directory
echo "Installing config files from the current directory..."
REPO_DIR=$(pwd)

cp -r "$REPO_DIR/.config/"* "$HOME/.config/"
mkdir -p "$HOME/.local/bin"
if [ -f "$REPO_DIR/.local/bin/hyprland-flee-bravely" ]; then
    cp "$REPO_DIR/.local/bin/hyprland-flee-bravely" "$HOME/.local/bin/"
fi

if [ -d "$REPO_DIR/.icons" ]; then
    sudo cp -r "$REPO_DIR/.icons" "$HOME/"
    sudo cp -r "$REPO_DIR/.icons/Frolic" /usr/share/icons/ || true
fi

if [ -d "$REPO_DIR/.config/sddm/themes" ]; then
    sudo cp -r "$REPO_DIR/.config/sddm/themes" /usr/share/sddm/ || true
    sudo chown -R $USER:$USER /usr/share/sddm/themes/frolic/Backgrounds || true
fi

if [ -f "$REPO_DIR/.config/sddm/sddm.conf" ]; then
    sudo cp "$REPO_DIR/.config/sddm/sddm.conf" /etc/
fi

echo "Config files installed."

echo "Adding wallpaper images..."
if [ -d "$REPO_DIR/wallpapers" ]; then
    mkdir -p "$HOME/Pictures"
    cp -r "$REPO_DIR/wallpapers" "$HOME/Pictures/"
    echo "Wallpapers copied."
fi

echo "Installation complete. Please restart your system to apply the changes."
