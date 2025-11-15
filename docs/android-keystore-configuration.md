# Android Keystore Configuration

## Overview

Android builds are now configured to use different keystores for debug and release builds:

- **Debug builds**: `emap-master-debug-upload-key.keystore`
- **Release builds**: `emap-master-upload-production-key.keystore`

## Configuration Details

### Debug Keystore

- **File**: `android/app/emap-master-debug-upload-key.keystore`
- **Alias**: `nursing-times-debug-key`
- **Store Password**: `hjd774trg0YGv6fA545tg`
- **Key Password**: `hjd774trg0YGv6fA545tg` (same as store password for PKCS12)
- **SHA-256**: `AD:61:76:75:51:53:47:6D:53:83:3C:79:5A:13:CE:B7:AA:EF:08:7F:B2:E3:0B:31:9D:CA:29:EF:02:7A:EB:B1`

### Release Keystore

- **File**: `android/app/emap-master-upload-production-key.keystore`
- **Alias**: `nursing-times-key`
- **Store Password**: `If435i34344df8T`
- **Key Password**: `If435i34344df8T` (same as store password for PKCS12)
- **SHA-256**: `DC:01:78:97:53:B5:99:7A:7A:D5:DA:E7:AF:DD:30:80:76:C3:AF:03:57:84:36:4A:69:2B:25:06:7E:11:23:62`

## Build Variants

The configuration applies to the following build variants:

### Debug Variants (using debug keystore)

- `debug` - Standard debug build
- `debugOptimized` - Optimized debug build
- `debugAndroidTest` - Debug build for Android tests

### Release Variants (using production keystore)

- `release` - Production release build
- `debugRelease` - Debug-signed release build (for testing release features)

## Files Modified

### 1. `android/gradle.properties`

Added debug keystore configuration properties:

```properties
# Debug keystore configuration
MYAPP_DEBUG_STORE_FILE=emap-master-debug-upload-key.keystore
MYAPP_DEBUG_KEY_ALIAS=nursing-times-debug-key
MYAPP_DEBUG_STORE_PASSWORD=hjd774trg0YGv6fA545tg
MYAPP_DEBUG_KEY_PASSWORD=hjd774trg0YGv6fA545tg

# Release keystore configuration
MYAPP_RELEASE_STORE_FILE=emap-master-upload-production-key.keystore
MYAPP_RELEASE_KEY_ALIAS=nursing-times-key
MYAPP_RELEASE_STORE_PASSWORD=If435i34344df8T
MYAPP_RELEASE_KEY_PASSWORD=If435i34344df8T
```

### 2. `android/app/build.gradle`

Updated `signingConfigs` section to use debug keystore properties:

```gradle
signingConfigs {
    debug {
        if (project.hasProperty('MYAPP_DEBUG_STORE_FILE')) {
            storeFile file(MYAPP_DEBUG_STORE_FILE)
            storePassword System.getenv('MYAPP_DEBUG_STORE_PASSWORD') ?: project.findProperty('MYAPP_DEBUG_STORE_PASSWORD')
            keyAlias MYAPP_DEBUG_KEY_ALIAS
            keyPassword System.getenv('MYAPP_DEBUG_KEY_PASSWORD') ?: project.findProperty('MYAPP_DEBUG_KEY_PASSWORD')
        }
    }
    release {
        if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword System.getenv('MYAPP_RELEASE_STORE_PASSWORD') ?: project.findProperty('MYAPP_RELEASE_STORE_PASSWORD')
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword System.getenv('MYAPP_RELEASE_KEY_PASSWORD') ?: project.findProperty('MYAPP_RELEASE_KEY_PASSWORD')
        }
    }
}
```

## Verification

To verify the signing configuration, run:

```bash
cd android && ./gradlew :app:signingReport
```

This will display the keystore information for each build variant, including:

- Store location
- Key alias
- Certificate fingerprints (MD5, SHA1, SHA-256)
- Validity period

## Security Notes

1. **PKCS12 Format**: Both keystores use PKCS12 format, which requires the same password for both store and key access.

2. **Password Storage**: Passwords are stored in `gradle.properties`. For CI/CD environments, use environment variables instead:

   - `MYAPP_DEBUG_STORE_PASSWORD`
   - `MYAPP_DEBUG_KEY_PASSWORD`
   - `MYAPP_RELEASE_STORE_PASSWORD`
   - `MYAPP_RELEASE_KEY_PASSWORD`

3. **Keystore Backup**: Ensure both keystores are backed up securely. Loss of the production keystore will prevent publishing updates to the app.

## Additional Keystores

Both keystores contain multiple key aliases for different brands:

### Debug Keystore Aliases

- `construction-news-debug-key`
- `jnl-nursing-times-debug-key`
- `nursing-times-debug-key` (currently used)

### Production Keystore Aliases

- `construction-news-key`
- `jnl-nursing-times-production-key`
- `nursing-times-key` (currently used)

To switch to a different brand's key, update the `MYAPP_DEBUG_KEY_ALIAS` and `MYAPP_RELEASE_KEY_ALIAS` properties in `gradle.properties`.
