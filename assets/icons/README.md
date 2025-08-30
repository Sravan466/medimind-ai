# Adaptive Icon Assets

## Required Files

### 1. adaptive-foreground.png
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparent background
- **Content**: Main brand mark (pill + check) centered in safe area
- **Safe Area**: Leave ~20% padding around edges (content in center 60% of image)
- **No Text**: Do not include app name inside the icon

### 2. Background
- **Type**: Solid color background
- **Color**: #0E8BF8 (configured in app.json)
- **Alternative**: Can use backgroundImage if needed

## Current Status
- ✅ adaptive-foreground.png: Copied from existing adaptive-icon.png
- ✅ Background: Using backgroundColor #0E8BF8 in app.json

## Icon Cache Clearing Instructions
If the new icon doesn't appear after installing the new build:

1. Uninstall the app completely from device
2. Reboot the device (or clear launcher cache in system settings)
3. Install the new APK/AAB from EAS build
4. Verify the new icon appears in app drawer and home screen

## Notes
- Many Android launchers cache icons aggressively
- Version code was incremented to 2 to force icon refresh
- Using backgroundColor instead of background image for simplicity
- If you want to use a background image, create `adaptive-background.png` and add `"backgroundImage": "./assets/icons/adaptive-background.png"` to app.json
