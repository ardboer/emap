# Onboarding Component System

A comprehensive onboarding flow for first-time users with platform-specific steps and full navigation control.

## Features

- ✅ Multi-step onboarding flow
- ✅ Platform-specific steps (iOS tracking permissions)
- ✅ Skip and back navigation
- ✅ Progress indicator
- ✅ AsyncStorage persistence
- ✅ Debug reset functionality
- ✅ Fully typed with TypeScript
- ✅ Consistent theming with app

## Components

### OnboardingContainer

Main container that manages the onboarding flow.

**Props:**

- `onComplete: () => void` - Callback when onboarding is completed

**Features:**

- Manages step navigation (next, back, skip)
- Shows progress indicator
- Automatically skips iOS-specific steps on Android
- Saves completion status to AsyncStorage

### Individual Screens

1. **WelcomeScreen** - Welcome message with editor picture placeholder
2. **NotificationAlertScreen** - Explains notification benefits
3. **NotificationPermissionScreen** - Requests notification permission
4. **TopicSelectionScreen** - Allows users to select notification topics
5. **TrackingAlertScreen** - Explains tracking benefits (iOS only)
6. **TrackingPermissionScreen** - Requests tracking permission (iOS only)
7. **LoginScreen** - Login/signup or continue without account

## Usage

### Basic Implementation

```tsx
import React, { useState, useEffect } from "react";
import { OnboardingContainer } from "@/components/onboarding";
import { hasCompletedOnboarding } from "@/services/onboarding";

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    const completed = await hasCompletedOnboarding();
    setShowOnboarding(!completed);
    setIsLoading(false);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingContainer onComplete={handleOnboardingComplete} />
      )}
      <YourMainApp />
    </>
  );
}
```

### In Root Layout (\_layout.tsx)

```tsx
import { useState, useEffect } from "react";
import { OnboardingContainer } from "@/components/onboarding";
import { hasCompletedOnboarding } from "@/services/onboarding";

export default function RootLayout() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const completed = await hasCompletedOnboarding();
    setShowOnboarding(!completed);
  };

  return (
    <>
      <Stack>{/* Your routes */}</Stack>
      {showOnboarding && (
        <OnboardingContainer onComplete={() => setShowOnboarding(false)} />
      )}
    </>
  );
}
```

## Services

### onboarding.ts

Provides functions to manage onboarding state:

```tsx
import {
  hasCompletedOnboarding,
  setOnboardingCompleted,
  resetOnboarding,
} from "@/services/onboarding";

// Check if user has completed onboarding
const completed = await hasCompletedOnboarding(); // Returns boolean

// Mark onboarding as completed
await setOnboardingCompleted();

// Reset onboarding (for debugging)
await resetOnboarding();
```

## Debug Features

A "Reset Onboarding" button has been added to the Settings screen (Development section, only visible in `__DEV__` mode):

1. Open Settings
2. Scroll to "Development" section
3. Tap "Reset Onboarding"
4. Restart the app to see the onboarding flow again

## Customization

### Adding New Steps

1. Add the step type to `types.ts`:

```tsx
export type OnboardingStep =
  | 'welcome'
  | 'your-new-step'
  | ...
```

2. Create the screen component:

```tsx
// YourNewStepScreen.tsx
export function YourNewStepScreen({
  onNext,
  onBack,
  onSkip,
}: OnboardingStepProps) {
  return <ThemedView style={styles.container}>{/* Your content */}</ThemedView>;
}
```

3. Add to OnboardingContainer:

```tsx
import { YourNewStepScreen } from './YourNewStepScreen';

// In getSteps():
const baseSteps: OnboardingStep[] = [
  'welcome',
  'your-new-step',
  ...
];

// In renderCurrentStep():
case 'your-new-step':
  return <YourNewStepScreen {...stepProps} />;
```

### Modifying Topics

Edit the `MOCK_TOPICS` array in `types.ts`:

```tsx
export const MOCK_TOPICS: TopicOption[] = [
  {
    id: "your-topic",
    label: "Your Topic",
    description: "Description of your topic",
  },
  // Add more topics...
];
```

### Styling

All screens use the app's themed components (`ThemedView`, `ThemedText`) and follow the existing color scheme. To customize:

1. Modify individual screen styles
2. Update the primary button color (currently `#0a7ea4`)
3. Adjust spacing and layout in component styles

## Platform-Specific Behavior

### iOS

- Shows all 7 steps including tracking permission screens
- Tracking screens automatically skip on Android

### Android

- Shows 5 steps (excludes tracking-related screens)
- Platform check happens automatically in OnboardingContainer

## Future Enhancements

### TODO: Implement Actual Permissions

Currently, permission screens are UI-only. To implement actual permissions:

1. **Notifications:**

```tsx
import * as Notifications from "expo-notifications";

const handleRequestPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status === "granted") {
    onNext();
  }
};
```

2. **iOS Tracking:**

```tsx
import * as TrackingTransparency from "expo-tracking-transparency";

const handleRequestPermission = async () => {
  const { status } =
    await TrackingTransparency.requestTrackingPermissionsAsync();
  if (status === "granted") {
    onNext();
  }
};
```

### TODO: Save User Preferences

Save selected topics and other preferences:

```tsx
import AsyncStorage from "@react-native-async-storage/async-storage";

const saveTopics = async (topics: string[]) => {
  await AsyncStorage.setItem("@notification_topics", JSON.stringify(topics));
};
```

### TODO: Add Authentication

Integrate with your authentication system in `LoginScreen.tsx`.

## File Structure

```
components/onboarding/
├── index.ts                          # Exports
├── types.ts                          # TypeScript types
├── OnboardingContainer.tsx           # Main container
├── WelcomeScreen.tsx                 # Welcome screen
├── NotificationAlertScreen.tsx       # Notification benefits
├── NotificationPermissionScreen.tsx  # Notification permission
├── TopicSelectionScreen.tsx          # Topic selection
├── TrackingAlertScreen.tsx           # Tracking benefits (iOS)
├── TrackingPermissionScreen.tsx      # Tracking permission (iOS)
├── LoginScreen.tsx                   # Login/signup
└── README.md                         # This file

services/
└── onboarding.ts                     # AsyncStorage service
```

## Testing

1. **First Launch:** App should show onboarding automatically
2. **Skip Functionality:** Test skipping from each step
3. **Back Navigation:** Test going back through steps
4. **Platform Detection:** Test on both iOS and Android
5. **Reset:** Use debug button to reset and test again
6. **Completion:** Verify onboarding doesn't show on subsequent launches

## Notes

- Onboarding uses a full-screen modal presentation
- All screens are responsive and work on different device sizes
- Progress indicator shows current step and total steps
- Editor image is currently a placeholder emoji (👤)
- All permission requests are mocked for now
