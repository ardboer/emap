# Authentication Implementation Testing Guide

## Overview

This guide provides comprehensive documentation for testing and understanding the JWT-based authentication system implemented in the app. The authentication flow uses expo-web-browser for secure OAuth-style login with JWT token signing and validation.

### Key Features

- **JWT Token Generation**: Secure token signing with HS256 algorithm
- **Browser-Based Login**: Uses expo-web-browser for secure authentication sessions
- **Token Management**: Automatic token storage, validation, and refresh
- **Deep Link Protection**: Auth URLs automatically open in browser instead of in-app
- **Persistent Sessions**: Tokens stored in AsyncStorage for session persistence
- **User State Management**: React Context for global authentication state

### Technologies Used

- **expo-crypto**: HMAC-SHA256 signing and cryptographically secure random nonce generation (React Native compatible)
- **expo-web-browser**: Secure browser-based authentication
- **AsyncStorage**: Secure local token storage
- **React Context**: Global authentication state management

### Important: React Native Compatibility

This implementation uses a **custom JWT creation function** that is fully compatible with React Native. Unlike the Node.js `jsonwebtoken` library (which requires Node's `crypto` module and doesn't work in React Native), our implementation uses `expo-crypto` for HMAC-SHA256 signing. This ensures the authentication system works seamlessly on iOS and Android devices.

The custom JWT implementation in [`services/auth.ts`](../services/auth.ts:50-95) manually creates JWT tokens following the JWT specification:

- Base64URL encoding of header and payload
- HMAC-SHA256 signature using expo-crypto
- Proper JWT format: `header.payload.signature`

---

## Architecture

### Files Created/Modified

#### 1. [`services/auth.ts`](../services/auth.ts:1)

**Purpose**: Core authentication service with all auth-related functions

**Key Functions**:

- [`generateLoginUrl()`](../services/auth.ts:69) - Creates JWT-signed login URL
- [`parseTokensFromUrl()`](../services/auth.ts:143) - Extracts tokens from callback URL
- [`validateAccessToken()`](../services/auth.ts:179) - Validates token with API
- [`refreshAccessToken()`](../services/auth.ts:244) - Refreshes expired tokens
- [`storeTokens()`](../services/auth.ts:303) - Securely stores tokens
- [`getStoredTokens()`](../services/auth.ts:329) - Retrieves stored tokens
- [`completeAuthentication()`](../services/auth.ts:471) - Completes auth flow
- [`logout()`](../services/auth.ts:439) - Clears all auth data

#### 2. [`contexts/AuthContext.tsx`](../contexts/AuthContext.tsx:1)

**Purpose**: React Context for global authentication state management

**Key Features**:

- User state management with reducer pattern
- Token storage and retrieval
- Login/logout functionality
- Token refresh capability
- Authentication status checking

**Exported Hook**: [`useAuth()`](../contexts/AuthContext.tsx:374)

#### 3. [`components/SettingsContent.tsx`](../components/SettingsContent.tsx:1)

**Purpose**: UI implementation for login/logout functionality

**Key Features**:

- Login button with loading state
- User profile display when authenticated
- Logout functionality
- Error handling and display

#### 4. [`app/_layout.tsx`](../app/_layout.tsx:1)

**Purpose**: Root layout with AuthProvider integration

**Changes**:

- Wrapped app with [`<AuthProvider>`](../app/_layout.tsx:236)
- Provides auth context to entire app

#### 5. [`app/[...slug].tsx`](../app/[...slug].tsx:1)

**Purpose**: Deep linking handler with auth path protection

**Key Features**:

- Detects authentication-related paths
- Opens auth URLs in external browser
- Prevents in-app handling of auth flows

---

## Authentication Flow

### Step-by-Step Login Process

#### 1. **User Initiates Login**

```typescript
// User taps "Login" button in SettingsContent
const { login } = useAuth();
await login();
```

#### 2. **Generate JWT-Signed URL**

```typescript
// In AuthContext.login()
const loginUrl = await generateLoginUrl({
  redirectUri: "nt://auth/callback", // App's custom scheme
  pageUrl: "https://example.com/app-login",
  ttl: 3600, // 1 hour validity
  secret: process.env.EXPO_PUBLIC_JWT_SECRET,
});
```

**JWT Payload Structure**:

```json
{
  "redirect_uri": "nt://auth/callback",
  "nonce": "a1b2c3d4e5f6...",
  "timestamp": 1698765432,
  "ttl": 3600
}
```

#### 3. **Open Browser Session**

```typescript
const result = await WebBrowser.openAuthSessionAsync(loginUrl, redirectUri);
```

- Opens system browser with login page
- User enters credentials on website
- Website validates credentials
- Website redirects to app with tokens

#### 4. **Handle Callback**

```typescript
// Callback URL format:
// nt://auth/callback?access_token=xxx&refresh_token=yyy

const tokens = parseTokensFromUrl(result.url);
```

#### 5. **Validate and Store**

```typescript
// Validate token with API
const validation = await validateAccessToken(tokens.access_token);

// Store tokens and user info
await storeTokens(tokens);
await storeUserInfo(validation.data);
```

#### 6. **Update UI State**

```typescript
// Update React Context state
dispatch({ type: "SET_USER", payload: userInfo });
dispatch({ type: "SET_TOKENS", payload: tokens });
```

---

## Testing in Simulator

### Prerequisites

1. **Install Dependencies**:

```bash
npm install
```

2. **Environment Variables**:
   Create `.env` file with:

```env
EXPO_PUBLIC_JWT_SECRET=your-secret-key-here
```

3. **Brand Configuration**:
   Ensure your brand config has:

```json
{
  "apiConfig": {
    "baseUrl": "https://your-api.com"
  },
  "domain": "your-domain.com"
}
```

### Starting the App

```bash
# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android
```

### Testing Login Flow

#### Step 1: Open Settings

1. Launch the app
2. Navigate to Settings (usually in tab bar or menu)
3. Scroll to "Account" section

#### Step 2: Initiate Login

1. Tap "Login" button
2. Watch console for logs

**Expected Console Logs**:

```
🔐 Starting login flow...
📱 Login configuration: {
  redirectUri: 'nt://auth/callback',
  loginPageUrl: 'https://...',
  brand: 'nt'
}
🔐 Generated login URL: { ... }
📝 JWT Token Content: { ... }
🌐 Opening authentication session...
```

#### Step 3: Browser Opens

- System browser should open automatically
- Login page should load
- URL should contain `?signature=` parameter

#### Step 4: Complete Login

1. Enter credentials on website
2. Submit login form
3. Website should redirect back to app

**Expected Console Logs**:

```
📥 Browser session result: success
✅ Authentication callback received
🔑 Tokens parsed successfully
🔍 Validating access token...
✅ Token validated successfully
✅ Tokens stored successfully
✅ User info stored successfully
✅ Login successful
```

#### Step 5: Verify Authentication State

1. Check Settings screen
2. Should show user profile with:
   - User email
   - User name
   - Logout button

### Testing Logout

1. Tap "Logout" button
2. Confirm logout if prompted

**Expected Console Logs**:

```
🚪 Logging out...
✅ User logged out successfully
```

**Verification**:

- User profile should disappear
- Login button should reappear
- AsyncStorage should be cleared

### Testing Token Persistence

1. Login successfully
2. Close the app completely
3. Reopen the app

**Expected Console Logs**:

```
🔍 Checking authentication status...
✅ Authentication status restored from storage
```

**Verification**:

- User should remain logged in
- Profile should display immediately
- No need to login again

---

## Configuration Requirements

### Environment Variables

**Required**:

```env
EXPO_PUBLIC_JWT_SECRET=your-secret-key-here
```

**Important**:

- Must match the secret used on the backend
- Should be at least 32 characters
- Keep secret and never commit to version control

### Brand Configuration

Each brand must have in `brands/{brand}/config.json`:

```json
{
  "apiConfig": {
    "baseUrl": "https://api.example.com",
    "hash": "your-api-hash"
  },
  "domain": "example.com"
}
```

### API Endpoints Required

The backend must provide these endpoints:

#### 1. Token Validation

```
GET /wp-json/mbm-apps/v1/jwt-validate-token/
Parameters:
  - hash: API hash
  - token: Access token to validate
Response:
  {
    "success": true,
    "data": {
      "user_id": "123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
```

#### 2. Token Refresh

```
GET /wp-json/mbm-apps/v1/jwt-refresh-token/
Parameters:
  - hash: API hash
  - refresh_token: Refresh token
  - user_id: User ID
Response:
  {
    "success": true,
    "access_token": "new_access_token",
    "refresh_token": "new_refresh_token"
  }
```

#### 3. Login Page

```
GET /app-login?signature={jwt_token}
```

- Validates JWT signature
- Shows login form
- Redirects to app with tokens on success

---

## Deep Linking Protection

### Why It's Needed

Authentication flows require:

- Secure browser environment
- Cookie support
- Session management
- OAuth redirects

In-app WebViews don't provide the same security guarantees as the system browser.

### How It Works

The catch-all route [`app/[...slug].tsx`](../app/[...slug].tsx:1) checks for auth-related paths:

```typescript
const authPaths = [
  "auth",
  "login",
  "register",
  "account",
  "callback",
  "oauth",
  "signin",
  "signup",
  "mobile-app-login",
];

if (authPaths.includes(firstSegment)) {
  // Open in external browser
  await Linking.openURL(`https://${domain}/${slug}`);
  router.replace("/");
  return;
}
```

### Testing Auth URL Protection

#### Test 1: Direct Auth URL

```bash
# iOS
xcrun simctl openurl booted "nt://auth/login"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "nt://auth/login"
```

**Expected Behavior**:

- System browser opens
- Shows login page
- App returns to home screen

**Console Logs**:

```
🔗 Auth path detected, opening in browser: auth/login
🔗 Redirecting back to home after opening auth URL in browser
```

#### Test 2: Regular Deep Link

```bash
# iOS
xcrun simctl openurl booted "nt://article/test-article"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "nt://article/test-article"
```

**Expected Behavior**:

- Opens in-app
- Resolves to article
- Shows article content

---

## Troubleshooting

### Common Issues

#### Issue 1: "Failed to generate login URL"

**Symptoms**:

```
❌ Error generating login URL: ...
```

**Solutions**:

1. Check JWT secret is set in `.env`
2. Verify expo-crypto is installed
3. Check console for specific error message

#### Issue 2: "Token validation failed"

**Symptoms**:

```
⚠️ Token validation failed: Invalid token
```

**Solutions**:

1. Verify API endpoint is accessible
2. Check API hash in brand config
3. Ensure token hasn't expired
4. Verify backend JWT secret matches

#### Issue 3: Browser doesn't open

**Symptoms**:

- Login button pressed
- Nothing happens
- No browser opens

**Solutions**:

1. Check expo-web-browser is installed
2. Verify URL scheme in app.json
3. Check console for errors
4. Try on physical device (simulator may have issues)

#### Issue 4: Tokens not persisting

**Symptoms**:

- User logged out after app restart
- Tokens not found in storage

**Solutions**:

1. Check AsyncStorage permissions
2. Verify storage keys are correct
3. Check for storage errors in console
4. Clear app data and try again

### Checking AsyncStorage

To inspect stored tokens:

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";

// Check all auth keys
const keys = await AsyncStorage.getAllKeys();
console.log("Storage keys:", keys);

// Get specific values
const accessToken = await AsyncStorage.getItem("@auth_access_token");
const refreshToken = await AsyncStorage.getItem("@auth_refresh_token");
const userInfo = await AsyncStorage.getItem("@auth_user_info");

console.log("Access Token:", accessToken);
console.log("Refresh Token:", refreshToken);
console.log("User Info:", userInfo);
```

### Clearing Authentication State

To manually clear auth state:

```typescript
import { logout } from "@/services/auth";

// Clear all auth data
await logout();
```

Or directly:

```typescript
await AsyncStorage.multiRemove([
  "@auth_access_token",
  "@auth_refresh_token",
  "@auth_user_info",
]);
```

### Console Log Patterns

#### Successful Login

```
🔐 Starting login flow...
🔐 Generated login URL: ...
🌐 Opening authentication session...
📥 Browser session result: success
✅ Authentication callback received
🔑 Tokens parsed successfully
🔍 Validating access token...
✅ Token validated successfully
✅ Tokens stored successfully
✅ User info stored successfully
✅ Login successful
```

#### Failed Login

```
🔐 Starting login flow...
🔐 Generated login URL: ...
🌐 Opening authentication session...
📥 Browser session result: cancel
ℹ️ User cancelled login
```

#### Token Refresh

```
🔄 Refreshing access token...
✅ Token refreshed successfully
```

#### Logout

```
🚪 Logging out...
✅ User logged out successfully
```

---

## Next Steps

### Production Deployment Considerations

1. **Secure JWT Secret**:

   - Use environment-specific secrets
   - Never commit secrets to version control
   - Rotate secrets periodically

2. **Token Expiration**:

   - Implement automatic token refresh
   - Handle expired token gracefully
   - Show re-login prompt when needed

3. **Error Handling**:

   - Add user-friendly error messages
   - Implement retry logic
   - Log errors to monitoring service

4. **Security Enhancements**:
   - Implement certificate pinning
   - Add biometric authentication option
   - Enable secure storage encryption

### Security Best Practices

1. **Token Storage**:

   - Use secure storage on production
   - Consider expo-secure-store for sensitive data
   - Encrypt tokens before storage

2. **Network Security**:

   - Always use HTTPS
   - Implement certificate pinning
   - Validate SSL certificates

3. **Token Handling**:

   - Never log full tokens
   - Clear tokens on logout
   - Implement token rotation

4. **User Privacy**:
   - Don't store passwords
   - Clear sensitive data on logout
   - Implement proper session timeout

### Future Enhancements

1. **Biometric Authentication**:

   - Add Face ID / Touch ID support
   - Quick re-authentication
   - Secure token access

2. **Social Login**:

   - Add Google Sign-In
   - Add Apple Sign-In
   - Add Facebook Login

3. **Multi-Factor Authentication**:

   - SMS verification
   - Email verification
   - Authenticator app support

4. **Session Management**:

   - Multiple device support
   - Session listing
   - Remote logout capability

5. **Analytics**:
   - Track login success/failure rates
   - Monitor token refresh patterns
   - Identify authentication issues

---

## Testing Checklist

### Basic Functionality

- [ ] Login button appears when not authenticated
- [ ] Login opens browser successfully
- [ ] Tokens are received from callback
- [ ] User profile displays after login
- [ ] Logout clears authentication state
- [ ] Login button reappears after logout

### Token Management

- [ ] Tokens persist after app restart
- [ ] Token validation works correctly
- [ ] Token refresh works when expired
- [ ] Tokens are cleared on logout

### Deep Linking

- [ ] Auth URLs open in browser
- [ ] Regular deep links work in-app
- [ ] Callback URLs are handled correctly
- [ ] No duplicate navigation occurs

### Error Handling

- [ ] Network errors are handled gracefully
- [ ] Invalid tokens show appropriate errors
- [ ] User cancellation is handled properly
- [ ] API errors display user-friendly messages

### UI/UX

- [ ] Loading states display correctly
- [ ] Error messages are clear
- [ ] Success feedback is provided
- [ ] Navigation flows smoothly

---

## Support

For issues or questions:

1. Check console logs for error details
2. Verify configuration settings
3. Test on physical device if simulator issues
4. Review this guide's troubleshooting section
5. Check API endpoint availability

---

**Last Updated**: 2025-10-27  
**Version**: 1.0.0
