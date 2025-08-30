# Adaptive Icon Debug & Fix Guide

## 🚨 **CRITICAL ISSUE IDENTIFIED**

### **Root Cause: Conflicting Icon Files**
- **OLD FILE**: `./assets/adaptive-icon.png` (was still present)
- **NEW FILE**: `./assets/icons/adaptive-foreground.png` (correct path)
- **CONFIG**: `app.json` points to new file, but old file was interfering

### **EAS Build Cache Issues**
- EAS build was likely using cached assets from previous builds
- Version code wasn't forcing a complete asset refresh

## 🔧 **FIXES APPLIED**

### **1. Removed Conflicting File**
```bash
# Removed old conflicting file
rm assets/adaptive-icon.png
```

### **2. Updated Version Information**
```json
{
  "version": "1.0.1",        // Bumped from 1.0.0
  "android": {
    "versionCode": 6         // Bumped from 5
  }
}
```

### **3. Verified Correct Configuration**
```json
{
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/icons/adaptive-foreground.png",
      "backgroundColor": "#0E77D1"
    }
  }
}
```

## 📋 **COMPLETE FIX PROCESS**

### **Step 1: Clean Local Cache**
```bash
# Clear Expo cache
npx expo install --fix
rm -rf node_modules/.cache
rm -rf .expo

# Clear EAS cache (if available)
eas build:clean
```

### **Step 2: Force Clean Build**
```bash
# Build with clean cache
eas build --platform android --profile preview --clear-cache
```

### **Step 3: Complete Device Cache Clear**
```bash
# 1. Uninstall completely
adb uninstall com.medimind.ai

# 2. Clear ALL launcher caches
adb shell pm clear com.android.launcher3
adb shell pm clear com.google.android.apps.nexuslauncher
adb shell pm clear com.sec.android.app.launcher  # Samsung
adb shell pm clear com.miui.home  # Xiaomi
adb shell pm clear com.oneplus.launcher  # OnePlus

# 3. Clear system cache
adb shell pm clear com.android.systemui

# 4. Reboot device
adb reboot

# 5. Install fresh APK
adb install -r path/to/your-new-app.apk
```

## 🔍 **VERIFICATION STEPS**

### **Check APK Contents**
```bash
# Extract APK to verify icon assets
unzip your-app.apk -d extracted-apk

# Check adaptive icon files
find extracted-apk -name "*ic_launcher*" -o -name "*adaptive*"

# Should show:
# extracted-apk/res/mipmap-hdpi/ic_launcher_foreground.png
# extracted-apk/res/mipmap-hdpi/ic_launcher_background.png
# extracted-apk/res/mipmap-mdpi/ic_launcher_foreground.png
# extracted-apk/res/mipmap-mdpi/ic_launcher_background.png
# ... (and other density folders)
```

### **Verify Icon Assets**
```bash
# Check file sizes and dates
ls -la assets/icons/adaptive-foreground.png
ls -la assets/icon.png

# Should NOT show old adaptive-icon.png
ls -la assets/adaptive-icon.png  # Should fail
```

## 🚨 **TROUBLESHOOTING**

### **If Icon Still Shows Old Version:**

#### **1. Check Expo Dashboard**
- Go to Expo Dashboard → Your Project → Settings
- Check if "Adaptive Icon" is set in dashboard
- **Dashboard settings OVERRIDE local files**
- Remove dashboard icon setting if present

#### **2. Force EAS Cache Clear**
```bash
# Clear EAS build cache
eas build:clean

# Or use --clear-cache flag
eas build --platform android --profile preview --clear-cache
```

#### **3. Check Build Logs**
```bash
# Monitor build process for icon processing
eas build --platform android --profile preview --wait
```

Look for:
```
Processing adaptive icon...
Generating mipmap resources...
```

#### **4. Verify File Paths**
```bash
# Ensure correct file structure
ls -la assets/icons/adaptive-foreground.png
ls -la assets/icon.png

# Check file permissions
file assets/icons/adaptive-foreground.png
```

## 📱 **DEVICE-SPECIFIC FIXES**

### **Samsung Devices**
```bash
# Clear Samsung-specific caches
adb shell pm clear com.sec.android.app.launcher
adb shell pm clear com.samsung.android.app.launcher
adb shell pm clear com.samsung.android.themestore
```

### **Xiaomi/MIUI Devices**
```bash
# Clear MIUI caches
adb shell pm clear com.miui.home
adb shell pm clear com.miui.systemui
adb shell pm clear com.miui.thememanager
```

### **OnePlus Devices**
```bash
# Clear OnePlus caches
adb shell pm clear com.oneplus.launcher
adb shell pm clear com.oneplus.systemui
```

### **Google Pixel Devices**
```bash
# Clear Google launcher caches
adb shell pm clear com.google.android.apps.nexuslauncher
adb shell pm clear com.android.launcher3
```

## 🔧 **ADVANCED DEBUGGING**

### **Check Build Configuration**
```bash
# Verify EAS build configuration
cat eas.json

# Check if any build profiles override icon settings
```

### **Monitor Build Process**
```bash
# Build with verbose logging
eas build --platform android --profile preview --wait --verbose
```

### **Extract and Analyze APK**
```bash
# Extract APK contents
unzip your-app.apk -d extracted-apk

# Check all icon-related files
find extracted-apk -name "*.png" | grep -i icon

# Verify adaptive icon structure
ls -la extracted-apk/res/mipmap-*/ic_launcher*
```

## 🎯 **EXPECTED RESULTS**

### **After Fixes:**
1. **✅ No old adaptive-icon.png file exists**
2. **✅ app.json points to correct path**
3. **✅ Version code incremented to force refresh**
4. **✅ EAS build processes new icons**
5. **✅ APK contains new icon assets**
6. **✅ Device shows new icon after cache clear**

### **Success Indicators:**
- New icon appears on home screen
- New icon appears in app drawer
- New icon appears in recent apps
- Background color is #0E77D1
- No old icon visible anywhere

## 📞 **NEXT STEPS**

### **Immediate Actions:**
1. **Build with clean cache**: `eas build --platform android --profile preview --clear-cache`
2. **Complete device cache clear** (follow steps above)
3. **Verify APK contents** (extract and check)
4. **Test on multiple devices** if possible

### **If Still Not Working:**
1. **Check Expo Dashboard** for conflicting icon settings
2. **Try different device** to rule out device-specific caching
3. **Contact Expo support** if build system issues persist

---

**Status**: ✅ **FIXES APPLIED** - Ready for clean build and testing
