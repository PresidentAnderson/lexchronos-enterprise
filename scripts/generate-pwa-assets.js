// Script to generate PWA icons and splash screens
const fs = require('fs');
const path = require('path');

// Create a simple SVG icon that can be converted to different sizes
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <g transform="translate(${size * 0.2}, ${size * 0.2})">
    <!-- Legal scales icon -->
    <path d="M${size * 0.3} ${size * 0.15} L${size * 0.5} ${size * 0.25} L${size * 0.7} ${size * 0.15}" 
          stroke="white" stroke-width="${size * 0.02}" fill="none"/>
    <circle cx="${size * 0.5}" cy="${size * 0.3}" r="${size * 0.05}" fill="white"/>
    <line x1="${size * 0.5}" y1="${size * 0.35}" x2="${size * 0.5}" y2="${size * 0.7}" 
          stroke="white" stroke-width="${size * 0.02}"/>
    
    <!-- Timeline dots -->
    <circle cx="${size * 0.2}" cy="${size * 0.45}" r="${size * 0.02}" fill="white"/>
    <circle cx="${size * 0.2}" cy="${size * 0.55}" r="${size * 0.02}" fill="white"/>
    <circle cx="${size * 0.2}" cy="${size * 0.65}" r="${size * 0.02}" fill="white"/>
    
    <!-- Timeline lines -->
    <line x1="${size * 0.25}" y1="${size * 0.45}" x2="${size * 0.4}" y2="${size * 0.45}" 
          stroke="white" stroke-width="${size * 0.01}"/>
    <line x1="${size * 0.25}" y1="${size * 0.55}" x2="${size * 0.4}" y2="${size * 0.55}" 
          stroke="white" stroke-width="${size * 0.01}"/>
    <line x1="${size * 0.25}" y1="${size * 0.65}" x2="${size * 0.4}" y2="${size * 0.65}" 
          stroke="white" stroke-width="${size * 0.01}"/>
  </g>
</svg>`;

// Create splash screen SVG
const createSplashSVG = (width, height) => `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
  
  <!-- Center logo -->
  <g transform="translate(${width/2 - 60}, ${height/2 - 60})">
    <rect width="120" height="120" rx="24" fill="rgba(255,255,255,0.1)" stroke="white" stroke-width="2"/>
    <!-- Legal scales -->
    <path d="M36 18 L60 30 L84 18" stroke="white" stroke-width="2" fill="none"/>
    <circle cx="60" cy="36" r="6" fill="white"/>
    <line x1="60" y1="42" x2="60" y2="84" stroke="white" stroke-width="2"/>
    
    <!-- Timeline dots -->
    <circle cx="24" cy="54" r="2" fill="white"/>
    <circle cx="24" cy="66" r="2" fill="white"/>
    <circle cx="24" cy="78" r="2" fill="white"/>
    
    <!-- Timeline lines -->
    <line x1="30" y1="54" x2="48" y2="54" stroke="white" stroke-width="1"/>
    <line x1="30" y1="66" x2="48" y2="66" stroke="white" stroke-width="1"/>
    <line x1="30" y1="78" x2="48" y2="78" stroke="white" stroke-width="1"/>
  </g>
  
  <!-- App name -->
  <text x="${width/2}" y="${height/2 + 100}" text-anchor="middle" 
        font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">
    LexChronos
  </text>
  
  <!-- Tagline -->
  <text x="${width/2}" y="${height/2 + 130}" text-anchor="middle" 
        font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.7)">
    Legal Timeline Manager
  </text>
</svg>`;

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Splash screen sizes for different devices
const splashSizes = [
  { width: 2048, height: 2732, name: 'apple-splash-2048-2732.png' }, // iPad Pro 12.9"
  { width: 1668, height: 2224, name: 'apple-splash-1668-2224.png' }, // iPad Pro 11"
  { width: 1536, height: 2048, name: 'apple-splash-1536-2048.png' }, // iPad
  { width: 1125, height: 2436, name: 'apple-splash-1125-2436.png' }, // iPhone X
  { width: 1242, height: 2208, name: 'apple-splash-1242-2208.png' }, // iPhone 6+
  { width: 750, height: 1334, name: 'apple-splash-750-1334.png' },   // iPhone 6
  { width: 828, height: 1792, name: 'apple-splash-828-1792.png' },   // iPhone XR
];

// Create directories
const publicDir = path.join(__dirname, '../public');
const iconsDir = path.join(publicDir, 'icons');
const splashDir = path.join(publicDir, 'splash');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

if (!fs.existsSync(splashDir)) {
  fs.mkdirSync(splashDir, { recursive: true });
}

// Generate icon SVGs (these would need to be converted to PNG in a real scenario)
iconSizes.forEach(size => {
  const svg = createIconSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Generated ${filename}`);
});

// Generate splash screen SVGs
splashSizes.forEach(({ width, height, name }) => {
  const svg = createSplashSVG(width, height);
  const filename = name.replace('.png', '.svg');
  fs.writeFileSync(path.join(splashDir, filename), svg);
  console.log(`Generated splash ${filename}`);
});

// Create a favicon
const faviconSVG = createIconSVG(32);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSVG);

// Create shortcut icons
const shortcutIcons = ['shortcut-new.svg', 'shortcut-scan.svg', 'shortcut-timeline.svg'];
shortcutIcons.forEach(filename => {
  const svg = createIconSVG(96);
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Generated ${filename}`);
});

console.log('PWA assets generation complete!');
console.log('Note: In production, convert SVG files to PNG using a tool like sharp or imagemagick');

// Generate a simple conversion script
const conversionScript = `#!/bin/bash
# Convert SVG icons to PNG (requires inkscape or imagemagick)

cd "$(dirname "$0")/../public"

# Convert icons
for svg in icons/*.svg; do
  if [[ "$svg" == *"icon-"* ]]; then
    size=$(echo "$svg" | sed 's/.*icon-([0-9]*)x[0-9]*.svg/1/')
    png="\${svg%.svg}.png"
    echo "Converting $svg to \$png (\${size}x\${size})"
    # Using imagemagick (install with: brew install imagemagick)
    # convert "$svg" -resize "\${size}x\${size}" "\$png"
    # Or using inkscape: inkscape "$svg" -w "$size" -h "$size" -o "$png"
  else
    png="\${svg%.svg}.png"
    # convert "$svg" -resize "96x96" "\$png"
  fi
done

echo "Icon conversion complete!"
`;

fs.writeFileSync(path.join(__dirname, 'convert-icons.sh'), conversionScript);

try {
  fs.chmodSync(path.join(__dirname, 'convert-icons.sh'), '755');
} catch (error) {
  console.log('Could not set permissions on convert script');
}

console.log('Created convert-icons.sh script for PNG conversion');