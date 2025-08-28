#!/usr/bin/env node

/**
 * Icon Generation Script for MediMindAI
 * 
 * This script helps generate different icon sizes from a single logo file.
 * You'll need to install sharp: npm install sharp
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 MediMindAI Icon Generator');
console.log('============================\n');

console.log('To generate icons from your logo, follow these steps:\n');

console.log('1. Install sharp (image processing library):');
console.log('   npm install sharp\n');

console.log('2. Place your original logo file in the assets directory');
console.log('   Recommended: logo.png (1024x1024 or larger)\n');

console.log('3. Run the icon generation script:');
console.log('   node generate-icons.js\n');

console.log('Required icon files and sizes:');
console.log('├── icon.png (1024x1024) - Main app icon');
console.log('├── splash.png (1242x2436) - Splash screen');
console.log('├── adaptive-icon.png (1024x1024) - Android adaptive icon');
console.log('├── favicon.png (48x48) - Web favicon');
console.log('└── notification-icon.png (96x96) - Notification icon\n');

console.log('Manual Steps (if you prefer):');
console.log('1. Open your logo in a design tool (Photoshop, Figma, etc.)');
console.log('2. Export each size manually');
console.log('3. Place all files in the assets/ directory');
console.log('4. Run: npx expo start --clear\n');

console.log('Color Recommendations:');
console.log('Primary Blue: #2196F3');
console.log('Turquoise: #00BCD4');
console.log('White: #FFFFFF');
console.log('Dark Turquoise: #0097A7\n');

console.log('After adding icons:');
console.log('1. Clear Expo cache: npx expo start --clear');
console.log('2. Test on different devices');
console.log('3. Verify splash screen and app icon display correctly\n');

// Check if assets directory exists
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  console.log('❌ Assets directory not found. Creating...');
  fs.mkdirSync(assetsDir);
  console.log('✅ Assets directory created');
}

console.log('📁 Assets directory ready for your icon files!');
console.log('📖 See assets/README.md for detailed instructions');
