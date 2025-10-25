const fs = require('fs');
const path = require('path');

// Create icons directory
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create placeholder SVG icons
const createIcon = (size, filename) => {
  const svg = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="20" fill="#6D4AFF"/>
  <rect x="20" y="20" width="${size - 40}" height="${size - 40}" rx="10" fill="white" fill-opacity="0.1"/>
  <rect x="40" y="40" width="${size - 80}" height="${size - 80}" rx="5" fill="white"/>
  <text x="${size / 2}" y="${size / 2 + 10}" text-anchor="middle" fill="#6D4AFF" font-family="Arial, sans-serif" font-size="24" font-weight="bold">TT</text>
</svg>`;

  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Created ${filename}`);
};

// Generate icons
createIcon(192, 'icon-192x192.png');
createIcon(512, 'icon-512x512.png');
createIcon(512, 'maskable-icon-512x512.png');

console.log('Icons generated successfully!');
