#!/bin/bash
#notify-send "System" "Clipboard restarted"
#echo "Clipboard script executed at $(date)" >> ~/.config/hypr/clipboard_log.txt

# Show options in wofi and capture the selected option
selected=$(echo -e "ChatGPT\nDuckDuckGo AI\nGoogle Gemini\nMeta AI\nMicrosoft Copilot\nGrok\nLM Studio" | wofi --dmenu)

# Open the corresponding website based on the selection
case "$selected" in
    "ChatGPT")
        chromium --app=https://chatgpt.com
        ;;
    "DuckDuckGo AI")
        chromium --app=https://duck.ai
        ;;
    "Google Gemini")
        chromium --app=https://gemini.google.com
        ;;
    "Meta AI")
        chromium --app=https://meta.ai
        ;;
    "Microsoft Copilot")
        chromium --app=https://copilot.microsoft.com
        ;;
    "Grok")
        chromium --app=https://grok.com
        ;;
    "LM Studio")
        lm-studio
        ;;
    *)
        echo "No valid selection made."
        ;;
esac
