const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_IMAGE = path.join(__dirname, '..', 'public', 'app-icon-source.png');
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

    const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
    const iosIconSizes = [120, 152, 180];
    const splashSizes = [
      { width: 2048, height: 2732, name: 'apple-splash-2048-2732.png' },
      { width: 1668, height: 2388, name: 'apple-splash-1668-2388.png' },
      { width: 1536, height: 2048, name: 'apple-splash-1536-2048.png' },
      { width: 1125, height: 2436, name: 'apple-splash-1125-2436.png' },
      { width: 1242, height: 2688, name: 'apple-splash-1242-2688.png' },
      { width: 828, height: 1792, name: 'apple-splash-828-1792.png' },
      { width: 1242, height: 2208, name: 'apple-splash-1242-2208.png' },
      { width: 750, height: 1334, name: 'apple-splash-750-1334.png' },
      { width: 640, height: 1136, name: 'apple-splash-640-1136.png' },
    ];

    // Generate standard PWA icons
    console.log('📱 Generating standard PWA icons...');
    for (const size of iconSizes) {
      await sharp(SOURCE_IMAGE)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 109, g: 74, b: 255, alpha: 1 } // #6D4AFF
        })
        .png()
        .toFile(path.join(ICONS_DIR, `icon-${size}x${size}.png`));
      console.log(`✅ Created icon-${size}x${size}.png`);
    }
    console.log('');

    // Generate iOS icons
    console.log('🍎 Generating iOS icons...');
    for (const size of iosIconSizes) {
      await sharp(SOURCE_IMAGE)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 109, g: 74, b: 255, alpha: 1 }
        })
        .png()
        .toFile(path.join(ICONS_DIR, `icon-${size}x${size}.png`));
      console.log(`✅ Created icon-${size}x${size}.png`);
    }
    console.log('');

    // Generate apple-touch-icon (180x180)
    console.log('🍎 Generating apple-touch-icon...');
    await sharp(SOURCE_IMAGE)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 109, g: 74, b: 255, alpha: 1 }
      })
      .png()
      .toFile(path.join(ICONS_DIR, 'apple-touch-icon.png'));
    console.log('✅ Created apple-touch-icon.png\n');

    // Generate iOS splash screens
    console.log('🖼️  Generating iOS splash screens...');
    for (const splash of splashSizes) {
      await sharp(SOURCE_IMAGE)
        .resize(splash.width, splash.height, {
          fit: 'contain',
          background: { r: 109, g: 74, b: 255, alpha: 1 }
        })
        .png()
        .toFile(path.join(ICONS_DIR, splash.name));
      console.log(`✅ Created ${splash.name}`);
    }
    console.log('');

    // Generate maskable icon (with safe zone)
    console.log('📱 Generating maskable 512x512 icon...');
    await sharp(SOURCE_IMAGE)
      .resize(512, 512, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(path.join(ICONS_DIR, 'maskable-icon-512x512.png'));
    console.log('✅ Created maskable-icon-512x512.png\n');

    // Generate favicon (32x32)
    console.log('🔖 Generating favicon...');
    await sharp(SOURCE_IMAGE)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 109, g: 74, b: 255, alpha: 1 }
      })
      .png()
      .toFile(FAVICON_PATH);
    console.log('✅ Created favicon.ico\n');

    console.log('🎉 All PWA icons and splash screens generated successfully!');
    console.log('\n📋 Summary:');
    console.log(`  • ${iconSizes.length} standard PWA icons`);
    console.log(`  • ${iosIconSizes.length} iOS icons`);
    console.log(`  • ${splashSizes.length} iOS splash screens`);
    console.log('  • 1 maskable icon');
    console.log('  • 1 favicon');
    console.log('  • 1 apple-touch-icon');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();

