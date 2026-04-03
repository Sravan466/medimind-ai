# MediMindAI App Icons Setup Guide

## Overview
This guide explains how to add your MediMindAI logo to the app. The app.json is already configured to use icons from this assets directory.

## Required Icon Files

Based on your app.json configuration, you need to create the following icon files:

### 1. Main App Icon
- **File**: `icon.png`
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Usage**: Main app icon for all platforms

### 2. Splash Screen
- **File**: `splash.png`
- **Size**: 1242x2436 pixels (iPhone X resolution)
- **Format**: PNG
- **Background**: Should match your app's primary color (#2196F3)

### 3. Android Adaptive Icon
- **File**: `adaptive-icon.png`
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Usage**: Android adaptive icon foreground

### 4. Web Favicon
- **File**: `favicon.png`
- **Size**: 48x48 pixels
- **Format**: PNG
- **Usage**: Web browser favicon

### 5. Notification Icon
- **File**: `notification-icon.png`
- **Size**: 96x96 pixels
- **Format**: PNG with transparency
- **Usage**: Push notification icon

## Logo Design Specifications

Based on your MediMindAI logo description:

### Design Elements
- **Pill Icon**: Vertical capsule with turquoise top and white bottom
- **Speech Bubble**: Turquoise outline with checkmark inside
- **Text**: "MediMindAI" in white
- **Background**: Vibrant blue (#2196F3 or similar)

### Color Palette
- **Primary Blue**: #2196F3 (matches app.json)
- **Turquoise**: #00BCD4 (for pill and speech bubble)
- **White**: #FFFFFF (for text and pill bottom)
- **Dark Turquoise**: #0097A7 (for speech bubble outline)

## Implementation Steps

### Step 1: Create Icon Files
1. Open your logo in a design tool (Photoshop, Figma, etc.)
2. Export the following sizes:
   - `icon.png` (1024x1024)
   - `splash.png` (1242x2436)
   - `adaptive-icon.png` (1024x1024)
   - `favicon.png` (48x48)
   - `notification-icon.png` (96x96)

### Step 2: Place Files in Assets Directory
Copy all icon files to the `MediMindAI/assets/` directory.

### Step 3: Test the Icons
```bash
# Clear Expo cache
npx expo start --clear

# Or rebuild the app
npx expo run:android
npx expo run:ios
```

## Alternative: Using Expo Icon Generator

If you have the original logo file, you can use Expo's icon generator:

```bash
# Install expo-cli if not already installed
npm install -g @expo/cli

# Generate icons from your logo
npx expo install expo-asset-utils
```

## File Structure
```
MediMindAI/
├── assets/
│   ├── icon.png              # Main app icon
│   ├── splash.png            # Splash screen
│   ├── adaptive-icon.png     # Android adaptive icon
│   ├── favicon.png           # Web favicon
│   ├── notification-icon.png # Notification icon
│   └── README.md             # This file
├── app.json                  # Icon configuration
└── ...
```

## Troubleshooting

### Icons Not Showing
1. Clear Expo cache: `npx expo start --clear`
2. Check file paths in app.json
3. Verify file formats are PNG
4. Ensure correct file sizes

### Splash Screen Issues
1. Make sure splash.png has proper dimensions
2. Check that backgroundColor matches in app.json
3. Test on different device sizes

### Android Icon Issues
1. Verify adaptive-icon.png has transparency
2. Check that backgroundColor is set in app.json
3. Test on different Android versions

## Notes
- All icons should maintain the same design language
- Use consistent colors across all icon variants
- Test icons on both light and dark backgrounds
- Ensure good contrast for accessibility
