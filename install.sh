#!/bin/bash

echo "This script will guide you through the installation of Frolic Dotfiles."

# Define the AGS config directory and backup directory
CONFIG_PATHS=(
    "$HOME/.config/ags"
    "$HOME/.config/hypr"
    "$HOME/.config/wofi"
    "$HOME/.config/fish"
    "$HOME/.config/starship.toml"
    "$HOME/.config/spicetify"
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
echo "Installing yay..."
sudo pacman -S --needed yay
echo "Yay installed."

# Install packages
echo "Installing packages..."
sudo pacman -S --needed hyprland wofi fish starship hyprpicker hyprlock hypridle wl-clipboard brightnessctl bluez-utils cliphist sddm git swww unzip grim libqalculate webkit2gtk-4.1 slurp playerctl polkit-gnome polkit-kde-agent xdg-desktop-portal-hyprland
yay -S --needed aylurs-gtk-shell nbfc-linux bibata-cursor-theme-bin wl-screenrec
echo "Packages installed."

# Install github fonts
echo "Installing github fonts..."
if [ -d "$HOME/monaspace" ]; then
    echo "Directory $HOME/monaspace exists. Removing it..."
    rm -rf "$HOME/monaspace"
    echo "Directory removed."
else
    echo "Directory $HOME/monaspace does not exist. Nothing to remove."
fi
git clone https://github.com/githubnext/monaspace.git
cd monaspace/fonts
mkdir -p ~/.local/share/fonts
cp -r * ~/.local/share/fonts
cd $HOME
echo "Github fonts installed."

echo "Installing Open Sans..."
sudo pacman -S --needed ttf-opensans
echo "Open Sans installed."

# Clone the dotfiles repository
echo "Cloning the dotfiles repository..."
if [ -d "$HOME/Frolic-dotfiles" ]; then
    echo "Directory $HOME/Frolic-dotfiles exists. Removing it..."
    rm -rf "$HOME/Frolic-dotfiles"
    echo "Directory removed."
else
    echo "Directory $HOME/Frolic-dotfiles does not exist. Nothing to remove."
fi
git clone https://github.com/Falconbird18/Frolic-dotfiles.git
echo "Dotfiles repository cloned."

# Copy the config files
echo "Installing config files..."
cp -r $HOME/Frolic-dotfiles/.config/* $HOME/.config
mkdir -p $HOME/.local/bin
cp $HOME/Frolic-dotfiles/.local/bin/hyprland-flee-bravely $HOME/.local/bin/
cp -r $HOME/Frolic-dotfiles/.spicetify/ $HOME/
sudo cp -r $HOME/Frolic-dotfiles/.icons $HOME/
cp -r $HOME/Frolic-dotfiles/.icons/Frolic /usr/share/icons/
sudo chown -R $USER:$USER /usr/share/sddm/themes/frolic/Backgrounds
cp -r $HOME/Frolic-dotfiles/.config/sddm/themes /usr/share/sddm/
sudo cp $HOME/Frolic-dotfiles/.config/sddm/sddm.conf /etc/
cp -r $HOME/Frolic-dotfiles/wallpapers $HOME/Pictures/
echo "Config files installed."

echo "Adding wallpaper images..."
cp -r $HOME/Frolic-dotfiles/wallpapers $HOME/Pictures/
echo "Wallpapers copied."

# Ask the user if they want to install Spicetify
read -p "Do you want to install Spicetify? (y/n): " spicetify_choice

if [[ "$spicetify_choice" =~ ^[Yy]$ ]]; then
    echo "Proceeding with Spicetify installation..."
    curl -fsSL https://raw.githubusercontent.com/spicetify/cli/main/install.sh | sh
    sudo chmod a+wr /opt/spotify
    sudo chmod a+wr /opt/spotify/Apps -R
    spicetify apply
    echo "Spicetify installed."
else
    echo "Skipping Spicetify installation."
fi

# Ask the user if they want to install Ollama
read -p "Do you want to install Ollama? (y/n): " ollama_choice
if [[ "$ollama_choice" =~ ^[Yy]$ ]]; then
    echo "Proceeding with Ollama installation..."
    curl -L https://ollama.com/download/ollama-linux-amd64.tgz -o ollama-linux-amd64.tgz
    sudo tar -C /usr -xzf ollama-linux-amd64.tgz
    echo "Ollama installed."

    # Check if Ollama is installed
    if command -v ollama &> /dev/null; then
        echo "Ollama is installed. Would you like to install models?"
	echo "1) Install Llama 3.2 (2.0GB)"
	echo "2) Install Gemma 2 (1.6GB)"
	echo "3) Install Mistral (4.1GB)"
	echo "4) Install All Models (7.7GB)"
        echo "5) Skip Model Installation"
        read -p "Enter your choice: " model_choice

        case $model_choice in
            1)
                echo "Installing Llama 3.2..."
		ollama serve
		ollama pull llama3.2:1b
                ;;
            2)
                echo "Installing Gemma 2..."
		ollama serve
		ollama pull gemma2:2b
                ;;
            3)
                echo "Installing Mistral..."
		ollama serve
                ollama install mistral
                ;;
            4)
                echo "Installing all models..."
		ollama serve
                ollama pull llama3.2:1b
                ollama install gemma2:2b
                ollama install mistral
                ;;
            5)
                echo "Skipping model installation."
                ;;
            *)
                echo "Invalid choice. Skipping model installation."
                ;;
        esac
    else
        echo "Ollama is not properly installed. Skipping model installation."
    fi
else
    echo "Skipping Ollama installation."
fi

echo "Installation complete. Please restart your system to apply the changes."
