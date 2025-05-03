#!/bin/bash

# Define the log file (you can change the path/name as desired)
LOGFILE="./layer_namespaces.log"

# Write an initial message
echo "Hyprctl namespace logging started at $(date)" > "$LOGFILE"

# Optional: enable graceful termination on Ctrl+C or SIGTERM
trap "echo 'Script terminated at $(date)'; exit" SIGINT SIGTERM

# Loop indefinitely until stopped
while true; do
  # Run the hyprctl layers command and extract the namespace names.
  # This grep command uses Perl-compatible regex (-oP) to output 
  # the portion immediately following "namespace:" (ignoring any leading whitespace)
  hyprctl layers | grep -oP 'namespace:\s*\K[^\s,]+' | while read -r ns; do
    # Append the timestamp and the extracted namespace to the log file
    echo "$(date) - $ns" >> "$LOGFILE"
  done

  # Pause 1 second between checks (adjust this value as needed)
  sleep 1
done

