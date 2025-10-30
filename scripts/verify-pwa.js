#!/usr/bin/env node

/**
 * PWA Configuration Verification Script
 * Validates that all PWA components are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 TaskTracker AI - PWA Configuration Verification');
console.log('='.repeat(60));
console.log('');

let hasErrors = false;

// 1. Check manifest.json
console.log('1️⃣  Checking manifest.json...');
try {
  const manifestPath = path.join(__dirname, '../public/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const checks = [
    { name: 'Name', value: manifest.name, expected: 'TaskTracker AI' },
    { name: 'Display mode', value: manifest.display, expected: 'standalone' },
    { name: 'Start URL', value: manifest.start_url, expected: '/?source=pwa' },
    { name: 'Scope', value: manifest.scope, expected: '/' },
    { name: 'Theme color', value: manifest.theme_color, expected: '#6D4AFF' },
    { name: 'Icon count', value: manifest.icons.length, min: 3 },
  ];

  checks.forEach((check) => {
    if (check.min) {
      if (check.value >= check.min) {
        console.log(`   ✅ ${check.name}: ${check.value}`);
      } else {
        console.log(
          `   ❌ ${check.name}: ${check.value} (expected >= ${check.min})`
        );
        hasErrors = true;
      }
    } else {
      if (check.value === check.expected) {
        console.log(`   ✅ ${check.name}: ${check.value}`);
      } else {
        console.log(
          `   ❌ ${check.name}: ${check.value} (expected: ${check.expected})`
        );
        hasErrors = true;
      }
    }
  });

  console.log('');
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  hasErrors = true;
  console.log('');
}

// 2. Check service worker
console.log('2️⃣  Checking service worker...');
try {
  const swPath = path.join(__dirname, '../public/service-worker.js');
  if (fs.existsSync(swPath)) {
    const swContent = fs.readFileSync(swPath, 'utf8');
    console.log('   ✅ Service worker file exists');
    console.log(`   ✅ Size: ${(swContent.length / 1024).toFixed(2)} KB`);

    // Check for key SW features
    const features = [
      { name: 'Install event', pattern: /addEventListener\('install'/ },
      { name: 'Activate event', pattern: /addEventListener\('activate'/ },
      { name: 'Fetch event', pattern: /addEventListener\('fetch'/ },
      { name: 'Cache API', pattern: /caches\.(open|match)/ },
    ];

    features.forEach((feature) => {
      if (feature.pattern.test(swContent)) {
        console.log(`   ✅ ${feature.name} implemented`);
      } else {
        console.log(`   ⚠️  ${feature.name} not found`);
      }
    });
  } else {
    console.log('   ❌ Service worker file not found');
    hasErrors = true;
  }
  console.log('');
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  hasErrors = true;
  console.log('');
}

// 3. Check service worker registration
console.log('3️⃣  Checking service worker registration...');
try {
  const pwaRegisterPath = path.join(__dirname, '../src/lib/pwa-register.ts');
  if (fs.existsSync(pwaRegisterPath)) {
    const pwaRegisterContent = fs.readFileSync(pwaRegisterPath, 'utf8');

    // Check if registration code exists (not commented out or early return)
    // Handle multiline code by removing newlines within the function
    const contentOneLine = pwaRegisterContent.replace(/\n\s*/g, ' ');
    const hasRegisterCall =
      contentOneLine.includes('navigator.serviceWorker.register') ||
      (pwaRegisterContent.includes('navigator.serviceWorker') &&
        pwaRegisterContent.includes('.register('));
    const hasDisablingReturn = /^\s*return;\s*$/m.test(
      pwaRegisterContent.split('navigator.serviceWorker')[0]
    );

    if (hasRegisterCall && !hasDisablingReturn) {
      console.log('   ✅ Service worker registration enabled');
      console.log('   ✅ Registration path: /service-worker.js');

      // Check for scope configuration
      if (pwaRegisterContent.includes("scope: '/'")) {
        console.log('   ✅ Scope configured: /');
      }
    } else if (!hasRegisterCall) {
      console.log('   ❌ Service worker registration code not found');
      hasErrors = true;
    } else {
      console.log(
        '   ⚠️  Service worker registration might be disabled by early return'
      );
      console.log(
        '   💡 Check if there is a "return;" statement before the registration'
      );
    }
  } else {
    console.log('   ❌ pwa-register.ts file not found');
    hasErrors = true;
  }
  console.log('');
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  hasErrors = true;
  console.log('');
}

// 4. Check PWA icons
console.log('4️⃣  Checking PWA icons...');
try {
  const iconsDir = path.join(__dirname, '../public/icons');
  const requiredIcons = [
    'icon-192x192.png',
    'icon-512x512.png',
    'maskable-icon-512x512.png',
  ];

  requiredIcons.forEach((icon) => {
    const iconPath = path.join(iconsDir, icon);
    if (fs.existsSync(iconPath)) {
      const stats = fs.statSync(iconPath);
      console.log(`   ✅ ${icon} (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
      console.log(`   ❌ ${icon} not found`);
      hasErrors = true;
    }
  });

  const appleIcon = path.join(__dirname, '../public/apple-touch-icon.png');
  if (fs.existsSync(appleIcon)) {
    const stats = fs.statSync(appleIcon);
    console.log(
      `   ✅ apple-touch-icon.png (${(stats.size / 1024).toFixed(2)} KB)`
    );
  } else {
    console.log('   ⚠️  apple-touch-icon.png not found');
  }
  console.log('');
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  hasErrors = true;
  console.log('');
}

// 5. Check layout metadata
console.log('5️⃣  Checking layout metadata...');
try {
  const layoutPath = path.join(__dirname, '../src/app/layout.tsx');
  if (fs.existsSync(layoutPath)) {
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    const metaChecks = [
      {
        name: 'Manifest link',
        pattern: /manifest:\s*['"]\/manifest\.json['"]/,
      },
      { name: 'Apple Web App capable', pattern: /capable:\s*true/ },
      {
        name: 'Apple mobile web app capable',
        pattern: /'apple-mobile-web-app-capable':\s*'yes'/,
      },
      { name: 'Viewport settings', pattern: /viewport:/ },
    ];

    metaChecks.forEach((check) => {
      if (check.pattern.test(layoutContent)) {
        console.log(`   ✅ ${check.name}`);
      } else {
        console.log(`   ⚠️  ${check.name} not found`);
      }
    });
  } else {
    console.log('   ❌ layout.tsx file not found');
    hasErrors = true;
  }
  console.log('');
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  hasErrors = true;
  console.log('');
}

// 6. Check PWA initialization component
console.log('6️⃣  Checking PWA initialization...');
try {
  const pwaInitPath = path.join(
    __dirname,
    '../src/components/system/PWAInit.tsx'
  );
  if (fs.existsSync(pwaInitPath)) {
    const pwaInitContent = fs.readFileSync(pwaInitPath, 'utf8');

    if (pwaInitContent.includes('registerSW()')) {
      console.log('   ✅ PWAInit component calls registerSW()');
    } else {
      console.log('   ❌ PWAInit component does not call registerSW()');
      hasErrors = true;
    }

    if (pwaInitContent.includes('useEffect')) {
      console.log('   ✅ PWAInit uses useEffect');
    } else {
      console.log('   ⚠️  PWAInit does not use useEffect');
    }
  } else {
    console.log('   ❌ PWAInit.tsx file not found');
    hasErrors = true;
  }
  console.log('');
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  hasErrors = true;
  console.log('');
}

// Summary
console.log('='.repeat(60));
if (hasErrors) {
  console.log('❌ PWA configuration has errors that need to be fixed');
  process.exit(1);
} else {
  console.log('✅ PWA configuration is valid!');
  console.log('');
  console.log('📱 Next Steps:');
  console.log('   1. Deploy your app to production (Vercel, Netlify, etc.)');
  console.log('   2. Test on mobile device using HTTPS');
  console.log('   3. Clear browser cache and uninstall old PWA if exists');
  console.log(
    '   4. Refresh the page and wait for "Add to Home Screen" prompt'
  );
  console.log('   5. Install and test standalone mode');
  console.log('');
  process.exit(0);
}
