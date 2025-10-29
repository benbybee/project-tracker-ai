const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_IMAGE = path.join(
  __dirname,
  '..',
  'public',
  'app-icon-source.png'
);
const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const FAVICON_PATH = path.join(__dirname, '..', 'public', 'favicon.ico');

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Check if source image exists
if (!fs.existsSync(SOURCE_IMAGE)) {
  console.error('❌ Source image not found at:', SOURCE_IMAGE);
  console.error('Please save your app icon as public/app-icon-source.png');
  process.exit(1);
}

async function generateIcons() {
  try {
    console.log('🎨 Generating PWA icons from source image...\n');

    // Generate 192x192 icon
    console.log('📱 Generating 192x192 icon...');
    await sharp(SOURCE_IMAGE)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 109, g: 74, b: 255, alpha: 1 }, // #6D4AFF
      })
      .png()
      .toFile(path.join(ICONS_DIR, 'icon-192x192.png'));
    console.log('✅ Created icon-192x192.png\n');

    // Generate 512x512 icon
    console.log('📱 Generating 512x512 icon...');
    await sharp(SOURCE_IMAGE)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 109, g: 74, b: 255, alpha: 1 }, // #6D4AFF
      })
      .png()
      .toFile(path.join(ICONS_DIR, 'icon-512x512.png'));
    console.log('✅ Created icon-512x512.png\n');

    // Generate maskable icon (with safe zone)
    // Maskable icons need content in the center 80% (safe zone)
    // For this icon, we'll just use the full source image since it already
    // has appropriate padding and a full-bleed gradient background
    console.log('📱 Generating maskable 512x512 icon...');
    await sharp(SOURCE_IMAGE)
      .resize(512, 512, {
        fit: 'cover', // Use 'cover' to fill the entire canvas
        position: 'center',
      })
      .png()
      .toFile(path.join(ICONS_DIR, 'maskable-icon-512x512.png'));
    console.log('✅ Created maskable-icon-512x512.png\n');

    // Generate favicon (32x32)
    console.log('🔖 Generating favicon...');
    await sharp(SOURCE_IMAGE)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 109, g: 74, b: 255, alpha: 1 },
      })
      .png()
      .toFile(FAVICON_PATH);
    console.log('✅ Created favicon.ico\n');

    // Also create apple-touch-icon
    console.log('🍎 Generating apple-touch-icon...');
    await sharp(SOURCE_IMAGE)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 109, g: 74, b: 255, alpha: 1 },
      })
      .png()
      .toFile(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'));
    console.log('✅ Created apple-touch-icon.png\n');

    console.log('🎉 All PWA icons generated successfully!');
    console.log('\n📋 Files created:');
    console.log('  • public/icons/icon-192x192.png');
    console.log('  • public/icons/icon-512x512.png');
    console.log('  • public/icons/maskable-icon-512x512.png');
    console.log('  • public/favicon.ico');
    console.log('  • public/apple-touch-icon.png');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
