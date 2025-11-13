# Debug Mode Seven-Tap Toggle Implementation

## Overview

Implemented a hidden feature that enables debug mode by tapping seven times rapidly on the version number in the Settings screen. This provides an intuitive way for power users and testers to access debug options without needing to use the search field.

## Implementation Details

### Changes Made

#### File: [`components/SettingsContent.tsx`](../components/SettingsContent.tsx)

**1. Added State Variables (lines ~69-70)**

```typescript
const [versionTapCount, setVersionTapCount] = React.useState(0);
const [lastTapTime, setLastTapTime] = React.useState<number>(0);
```

**2. Added Handler Function (lines ~660-697)**

```typescript
const handleVersionTap = async () => {
  const now = Date.now();
  const timeSinceLastTap = now - lastTapTime;

  // Reset counter if more than 3 seconds since last tap
  if (timeSinceLastTap > 3000) {
    setVersionTapCount(1);
    setLastTapTime(now);
    return;
  }

  const newCount = versionTapCount + 1;
  setVersionTapCount(newCount);
  setLastTapTime(now);

  // Activate debug mode on 7th tap
  if (newCount >= 7) {
    try {
      await AsyncStorage.setItem("debug_mode_enabled", "true");
      setDebugModeEnabled(true);
      setVersionTapCount(0); // Reset counter

      Alert.alert(
        "Debug Mode Activated",
        "Debug options are now available below.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error activating debug mode:", error);
      Alert.alert("Error", "Failed to activate debug mode. Please try again.", [
        { text: "OK" },
      ]);
    }
  }
};
```

**3. Modified Version SettingsItem (lines ~956-961)**

- Removed `noBackground` prop to make it tappable
- Added `onPress={handleVersionTap}` handler

```typescript
<SettingsItem
  title="Version"
  subtitle="1.0.0"
  icon="info.circle.fill"
  onPress={handleVersionTap}
/>
```

## How It Works

### Tap Detection Logic

1. **First Tap**: Initializes counter to 1 and records timestamp
2. **Subsequent Taps**:
   - If tap occurs within 3 seconds of last tap: increment counter
   - If tap occurs after 3 seconds: reset counter to 1
3. **Seventh Tap**:
   - Activates debug mode
   - Stores flag in AsyncStorage
   - Updates component state
   - Shows success alert
   - Resets counter

### Time Window

- **Duration**: 3 seconds between taps
- **Rationale**: Long enough for deliberate activation, short enough to prevent accidental activation

### User Experience

- No visual feedback during tapping (keeps feature hidden)
- Alert confirmation on successful activation
- Debug section appears immediately after activation
- Can be disabled via existing "Disable Debug Mode" button in debug section

## Testing Instructions

### Manual Testing

1. **Basic Activation Test**

   ```
   1. Open Settings drawer
   2. Scroll to "About" section
   3. Tap "Version" item 7 times rapidly (within 3 seconds)
   4. Verify alert appears: "Debug Mode Activated"
   5. Verify Debug section appears below
   ```

2. **Slow Tap Test (Should NOT Activate)**

   ```
   1. Open Settings drawer
   2. Tap "Version" item slowly (>3 seconds between taps)
   3. Verify debug mode does NOT activate
   4. Verify no alert appears
   ```

3. **Counter Reset Test**

   ```
   1. Open Settings drawer
   2. Tap "Version" 3 times rapidly
   3. Wait 4 seconds
   4. Tap "Version" 7 times rapidly
   5. Verify debug mode activates (counter was reset)
   ```

4. **Already Enabled Test**

   ```
   1. Enable debug mode via search ("debugmode on")
   2. Open Settings drawer
   3. Tap "Version" 7 times rapidly
   4. Verify alert still appears
   5. Verify debug section remains visible
   ```

5. **Production Build Test**
   ```
   1. Build app in production mode
   2. Verify debug section is NOT visible initially
   3. Tap "Version" 7 times rapidly
   4. Verify debug mode activates
   5. Verify debug section appears
   ```

### Automated Testing Checklist

- [ ] Seven rapid taps activate debug mode
- [ ] Slow taps (>3s apart) don't activate
- [ ] Alert appears on successful activation
- [ ] Debug section becomes visible immediately
- [ ] Works in production build (not just **DEV**)
- [ ] Counter resets after activation
- [ ] No interference with existing search activation method
- [ ] AsyncStorage flag persists across app restarts

## Technical Specifications

### Constants

- **Required Taps**: 7
- **Time Window**: 3000ms (3 seconds)
- **AsyncStorage Key**: `"debug_mode_enabled"`
- **Storage Value**: `"true"` (string)

### State Management

- `versionTapCount`: Number of taps in current sequence
- `lastTapTime`: Timestamp of last tap (milliseconds)
- `debugModeEnabled`: Boolean flag for debug mode state

### Error Handling

- Try-catch block around AsyncStorage operations
- User-friendly error alert if activation fails
- Console error logging for debugging

## Integration with Existing Features

### Compatible With

- ✅ Search-based activation ("debugmode on")
- ✅ Existing debug section visibility logic
- ✅ "Disable Debug Mode" button
- ✅ All existing debug toggles and features

### No Conflicts With

- ✅ Version display
- ✅ Other settings items
- ✅ Settings drawer functionality
- ✅ Production/development mode detection

## Future Enhancements (Optional)

1. **Haptic Feedback**: Add vibration on each tap or on success
2. **Visual Feedback**: Subtle animation during tapping
3. **Configurable Values**: Make tap count and time window configurable
4. **Analytics**: Track activation attempts for usage insights
5. **Easter Egg**: Different tap patterns for different features

## Troubleshooting

### Issue: Debug mode doesn't activate

- **Check**: Are you tapping fast enough? (within 3 seconds)
- **Check**: Are you tapping exactly 7 times?
- **Check**: Is AsyncStorage working properly?

### Issue: Accidental activation

- **Solution**: Increase time window or tap count
- **Current**: 7 taps in 3 seconds is unlikely to be accidental

### Issue: Version item not tappable

- **Check**: Verify `noBackground` prop was removed
- **Check**: Verify `onPress` handler is attached
- **Check**: Verify `disabled` prop is not set

## Related Files

- [`components/SettingsContent.tsx`](../components/SettingsContent.tsx) - Main implementation
- [`app/search.tsx`](../app/search.tsx) - Alternative activation method
- [`services/onboarding.ts`](../services/onboarding.ts) - AsyncStorage utilities

## References

- Similar pattern used in iOS Settings app (tap Build Number)
- Common mobile app pattern for hidden developer features
- Follows existing debug mode architecture in the app
