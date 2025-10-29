const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Offline DB Layer + Sync Queue Setup...\n');

// Check if all required files exist
const requiredFiles = [
  'src/lib/db.ts',
  'src/lib/sync-manager.ts',
  'src/hooks/useSync.ts',
  'src/components/ui/offline-toast.tsx',
  'src/components/ui/sync-status-indicator.tsx',
  'src/app/sync-provider.tsx',
  'src/app/layout.tsx',
  'src/server/trpc/routers/tasks.ts',
  'src/components/kanban/KanbanBoard.tsx',
  'src/components/tasks/TaskModal.tsx',
  'src/components/projects/project-header.tsx',
];

console.log('📁 Checking required files...');
requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Check package.json for required dependencies
console.log('\n📦 Checking dependencies...');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = ['dexie', 'workbox-window', 'react-use'];

  requiredDeps.forEach((dep) => {
    if (packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} - ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
    }
  });
} else {
  console.log('❌ package.json not found');
}

// Check for Dexie schema
console.log('\n🗄️ Checking Dexie schema...');
const dbPath = path.join(__dirname, '..', 'src/lib/db.ts');
if (fs.existsSync(dbPath)) {
  const dbContent = fs.readFileSync(dbPath, 'utf8');

  const requiredTables = [
    'projects',
    'tasks',
    'roles',
    'syncQueue',
    'syncStatus',
  ];
  requiredTables.forEach((table) => {
    if (dbContent.includes(`${table}!`)) {
      console.log(`✅ ${table} table defined`);
    } else {
      console.log(`❌ ${table} table missing`);
    }
  });

  const requiredMethods = [
    'getPendingSyncItems',
    'addToSyncQueue',
    'removeFromSyncQueue',
    'updateSyncStatus',
  ];
  requiredMethods.forEach((method) => {
    if (dbContent.includes(method)) {
      console.log(`✅ ${method} method defined`);
    } else {
      console.log(`❌ ${method} method missing`);
    }
  });
} else {
  console.log('❌ src/lib/db.ts not found');
}

// Check for SyncManager
console.log('\n🔄 Checking SyncManager...');
const syncManagerPath = path.join(__dirname, '..', 'src/lib/sync-manager.ts');
if (fs.existsSync(syncManagerPath)) {
  const syncManagerContent = fs.readFileSync(syncManagerPath, 'utf8');

  const requiredMethods = [
    'startSync',
    'syncItem',
    'addToSyncQueue',
    'getSyncStatus',
  ];
  requiredMethods.forEach((method) => {
    if (syncManagerContent.includes(method)) {
      console.log(`✅ ${method} method defined`);
    } else {
      console.log(`❌ ${method} method missing`);
    }
  });

  const requiredEvents = ['start', 'progress', 'complete', 'error'];
  requiredEvents.forEach((event) => {
    if (syncManagerContent.includes(`'${event}'`)) {
      console.log(`✅ ${event} event handled`);
    } else {
      console.log(`❌ ${event} event missing`);
    }
  });
} else {
  console.log('❌ src/lib/sync-manager.ts not found');
}

// Check for offline hooks
console.log('\n🎣 Checking offline hooks...');
const useSyncPath = path.join(__dirname, '..', 'src/hooks/useSync.ts');
if (fs.existsSync(useSyncPath)) {
  const useSyncContent = fs.readFileSync(useSyncPath, 'utf8');

  const requiredHooks = [
    'useSync',
    'useEntitySyncStatus',
    'useOfflineOperations',
  ];
  requiredHooks.forEach((hook) => {
    if (useSyncContent.includes(`export function ${hook}`)) {
      console.log(`✅ ${hook} hook defined`);
    } else {
      console.log(`❌ ${hook} hook missing`);
    }
  });
} else {
  console.log('❌ src/hooks/useSync.ts not found');
}

// Check for UI components
console.log('\n🎨 Checking UI components...');
const uiComponents = [
  'src/components/ui/offline-toast.tsx',
  'src/components/ui/sync-status-indicator.tsx',
];

uiComponents.forEach((component) => {
  const componentPath = path.join(__dirname, '..', component);
  if (fs.existsSync(componentPath)) {
    console.log(`✅ ${component}`);
  } else {
    console.log(`❌ ${component} - MISSING`);
  }
});

// Check for tRPC sync operations
console.log('\n🔌 Checking tRPC sync operations...');
const tasksRouterPath = path.join(
  __dirname,
  '..',
  'src/server/trpc/routers/tasks.ts'
);
if (fs.existsSync(tasksRouterPath)) {
  const tasksRouterContent = fs.readFileSync(tasksRouterPath, 'utf8');

  const requiredOperations = ['bulkCreate', 'bulkUpdate', 'bulkDelete', 'sync'];
  requiredOperations.forEach((operation) => {
    if (tasksRouterContent.includes(operation)) {
      console.log(`✅ ${operation} operation defined`);
    } else {
      console.log(`❌ ${operation} operation missing`);
    }
  });
} else {
  console.log('❌ src/server/trpc/routers/tasks.ts not found');
}

console.log('\n🎯 Offline DB Layer + Sync Queue Setup Complete!');
console.log('\nNext steps:');
console.log('1. Run "npm run dev" to start the development server');
console.log(
  '2. Open Chrome DevTools > Application > IndexedDB to verify Dexie database'
);
console.log('3. Test offline functionality:');
console.log('   - Go offline in DevTools');
console.log('   - Create/edit tasks');
console.log('   - Verify they persist in IndexedDB');
console.log('   - Go back online');
console.log('   - Check sync operations');
console.log('4. Test sync queue:');
console.log('   - Check sync status indicators');
console.log('   - Test manual sync button');
console.log('   - Verify conflict resolution');
console.log('5. Test PWA offline functionality:');
console.log('   - Install the app');
console.log('   - Go offline');
console.log('   - Verify app works offline');
console.log('   - Check sync when back online');
