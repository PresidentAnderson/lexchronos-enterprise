#!/bin/bash
# Convert SVG icons to PNG (requires inkscape or imagemagick)

cd "$(dirname "$0")/../public"

# Convert icons
for svg in icons/*.svg; do
  if [[ "$svg" == *"icon-"* ]]; then
    size=$(echo "$svg" | sed 's/.*icon-([0-9]*)x[0-9]*.svg/1/')
    png="${svg%.svg}.png"
    echo "Converting $svg to $png (${size}x${size})"
    # Using imagemagick (install with: brew install imagemagick)
    # convert "$svg" -resize "${size}x${size}" "$png"
    # Or using inkscape: inkscape "$svg" -w "$size" -h "$size" -o "$png"
  else
    png="${svg%.svg}.png"
    # convert "$svg" -resize "96x96" "$png"
  fi
done

echo "Icon conversion complete!"
