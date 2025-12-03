const fs = require('fs');
const path = require('path');

console.log('🔍 Testing PWA Setup...\n');

// Check if manifest.json exists and is valid
const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log('✅ manifest.json exists and is valid');
    console.log(`   - Name: ${manifest.name}`);
    console.log(`   - Short name: ${manifest.short_name}`);
    console.log(`   - Theme color: ${manifest.theme_color}`);
    console.log(`   - Start URL: ${manifest.start_url}`);
    console.log(`   - Icons: ${manifest.icons.length} icons defined`);
  } catch (error) {
    console.log('❌ manifest.json is invalid JSON');
  }
} else {
  console.log('❌ manifest.json not found');
}

// Check if service worker exists
const swPath = path.join(__dirname, '..', 'public', 'service-worker.js');
if (fs.existsSync(swPath)) {
  console.log('✅ service-worker.js exists');
} else {
  console.log('❌ service-worker.js not found');
}

// Check if icons exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const requiredIcons = [
  'icon-192x192.png',
  'icon-512x512.png',
  'maskable-icon-512x512.png',
];

requiredIcons.forEach((icon) => {
  const iconPath = path.join(iconsDir, icon);
  if (fs.existsSync(iconPath)) {
    console.log(`✅ ${icon} exists`);
  } else {
    console.log(`❌ ${icon} not found`);
  }
});

// Check if PWA provider exists
const pwaProviderPath = path.join(
  __dirname,
  '..',
  'src',
  'app',
  'pwa-provider.tsx'
);
if (fs.existsSync(pwaProviderPath)) {
  console.log('✅ PWA provider exists');
} else {
  console.log('❌ PWA provider not found');
}

// Check if toast component exists
const toastPath = path.join(
  __dirname,
  '..',
  'src',
  'components',
  'ui',
  'toast-pwa.tsx'
);
if (fs.existsSync(toastPath)) {
  console.log('✅ PWA toast component exists');
} else {
  console.log('❌ PWA toast component not found');
}

console.log('\n🎯 PWA Setup Complete!');
console.log('\nNext steps:');
console.log('1. Run "npm install" to install workbox dependencies');
console.log('2. Run "npm run build" to build the app');
console.log('3. Run "npm start" to test PWA functionality');
console.log(
  '4. Open Chrome DevTools > Application > Manifest to verify manifest'
);
console.log(
  '5. Open Chrome DevTools > Application > Service Workers to verify SW registration'
);
console.log('6. Test offline functionality by going offline in DevTools');
