# Privacy Policy and Compliance Requirements

## Construction News & Nursing Times Apps

This document outlines the privacy policy requirements and compliance considerations for both Construction News and Nursing Times mobile applications.

## Overview

Both apps must comply with:

- **Apple App Store** privacy requirements
- **Google Play Store** data safety requirements
- **UK GDPR** (General Data Protection Regulation)
- **iOS 14.5+** App Tracking Transparency (ATT)
- **Android 12+** privacy dashboard requirements

---

## Privacy Policy Requirements

### Mandatory Privacy Policy Elements

1. **Company Information**

   - EMAP Publishing Ltd
   - Registered address in the UK
   - Contact information (email, phone, postal address)
   - Data Protection Officer contact (if applicable)

2. **Data Collection Practices**

   - Types of data collected
   - Methods of data collection
   - Legal basis for processing (GDPR requirement)
   - Data retention periods

3. **Data Usage and Sharing**

   - How collected data is used
   - Third-party data sharing practices
   - International data transfers
   - Marketing and advertising practices

4. **User Rights and Controls**

   - Access, rectification, and deletion rights
   - Data portability rights
   - Opt-out mechanisms
   - Cookie and tracking preferences

5. **Security Measures**

   - Data protection safeguards
   - Breach notification procedures
   - Data storage and transmission security

6. **Updates and Contact**
   - Policy update notification process
   - Contact information for privacy inquiries
   - Effective date and version information

### Privacy Policy Template Structure

```markdown
# Privacy Policy for [App Name]

**Effective Date:** [Date]
**Last Updated:** [Date]

## 1. Introduction

EMAP Publishing Ltd ("we," "our," or "us") operates the [App Name] mobile application. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.

## 2. Information We Collect

### 2.1 Personal Information

- Email addresses (for newsletter subscriptions)
- Name and professional information (for account creation)
- Device identifiers and usage analytics

### 2.2 Automatically Collected Information

- Device information (model, operating system, unique device identifiers)
- Usage data (pages viewed, time spent, user interactions)
- Location data (if permission granted)
- Crash reports and performance data

### 2.3 Cookies and Tracking Technologies

- Analytics cookies for app performance monitoring
- Advertising identifiers for personalized content
- Session cookies for app functionality

## 3. How We Use Your Information

We use collected information to:

- Provide and maintain our service
- Improve user experience and app functionality
- Send newsletters and updates (with consent)
- Analyze usage patterns and trends
- Provide customer support
- Comply with legal obligations

## 4. Information Sharing and Disclosure

We may share your information with:

- **Service Providers:** Analytics, hosting, and support services
- **Advertising Partners:** For personalized advertising (with consent)
- **Legal Requirements:** When required by law or legal process
- **Business Transfers:** In case of merger, acquisition, or sale

### 4.1 Third-Party Services

- Google Analytics (analytics and reporting)
- Firebase (app performance and crash reporting)
- [Other specific services used]

## 5. Data Security

We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

## 6. Your Rights (GDPR)

Under UK GDPR, you have the right to:

- Access your personal data
- Rectify inaccurate data
- Erase your data ("right to be forgotten")
- Restrict processing
- Data portability
- Object to processing
- Withdraw consent

## 7. Children's Privacy

Our app is not intended for children under 13. We do not knowingly collect personal information from children under 13.

## 8. International Data Transfers

Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place.

## 9. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.

## 10. Contact Us

For questions about this Privacy Policy, please contact us at:

- Email: privacy@emappublishing.com
- Address: [EMAP Publishing Ltd Address]
- Phone: [Contact Number]
```

---

## Apple App Store Privacy Requirements

### App Privacy Details Configuration

Configure in App Store Connect → App Privacy:

#### Construction News Privacy Configuration

```yaml
Data Types Collected:
  Contact Info:
    - Email Address: ✅
    - Name: ✅
    - Phone Number: ❌
    - Physical Address: ❌
    - Other User Contact Info: ❌

  Health & Fitness:
    - Health: ❌
    - Fitness: ❌

  Financial Info:
    - Payment Info: ❌
    - Credit Info: ❌
    - Other Financial Info: ❌

  Location:
    - Precise Location: ❌
    - Coarse Location: ✅ (for regional content)

  Sensitive Info:
    - Sensitive Info: ❌

  Contacts:
    - Contacts: ❌

  User Content:
    - Emails or Text Messages: ❌
    - Photos or Videos: ❌
    - Audio Data: ❌
    - Gameplay Content: ❌
    - Customer Support: ✅
    - Other User Content: ❌

  Browsing History:
    - Browsing History: ✅

  Search History:
    - Search History: ✅

  Identifiers:
    - User ID: ✅
    - Device ID: ✅
    - Purchase History: ❌
    - Advertising Data: ✅

  Usage Data:
    - Product Interaction: ✅
    - Advertising Data: ✅
    - Other Usage Data: ✅

  Diagnostics:
    - Crash Data: ✅
    - Performance Data: ✅
    - Other Diagnostic Data: ❌

Data Usage Purposes:
  Third-Party Advertising: ✅
  Developer's Advertising or Marketing: ✅
  Analytics: ✅
  Product Personalization: ✅
  App Functionality: ✅
  Other Purposes: ❌

Data Linked to User:
  - Email Address
  - User ID
  - Usage Data
  - Search History

Data Not Linked to User:
  - Device ID
  - Crash Data
  - Performance Data
  - Coarse Location

Third Parties with Access:
  - Google Analytics
  - Firebase
  - Advertising Networks (if applicable)
```

#### Nursing Times Privacy Configuration

```yaml
# Similar structure to Construction News with healthcare-specific considerations

Data Types Collected:
  # Same as Construction News with additional considerations:

  Health & Fitness:
    - Health: ❌ (unless clinical content tracking is implemented)
    - Fitness: ❌

  Sensitive Info:
    - Sensitive Info: ❌ (professional healthcare content is not considered sensitive personal data)
# Usage purposes and data handling remain similar
```

### App Tracking Transparency (ATT) Implementation

For iOS 14.5+, implement ATT if tracking users across apps/websites:

```typescript
// Example ATT implementation
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";

const requestTrackingPermission = async () => {
  const { status } = await requestTrackingPermissionsAsync();

  if (status === "granted") {
    // Enable tracking-based features
    enablePersonalizedAds();
    enableCrossAppAnalytics();
  } else {
    // Use non-tracking alternatives
    disablePersonalizedAds();
    useContextualAds();
  }
};
```

Add to [`app.json`](app.json):

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSUserTrackingUsageDescription": "This app uses tracking to provide personalized content and advertisements based on your interests."
      }
    }
  }
}
```

---

## Google Play Store Data Safety Requirements

### Data Safety Section Configuration

Configure in Play Console → Policy → Data safety:

#### Data Collection and Sharing

```yaml
Personal Info:
  - Name:
    Collected: Yes
    Shared: No
    Purpose: Account functionality
    Optional: Yes

  - Email address:
    Collected: Yes
    Shared: Yes (with email service providers)
    Purpose: Account functionality, marketing
    Optional: Yes

App Activity:
  - App interactions:
    Collected: Yes
    Shared: Yes (with analytics providers)
    Purpose: Analytics, app functionality
    Optional: No

  - In-app search history:
    Collected: Yes
    Shared: No
    Purpose: App functionality, analytics
    Optional: No

  - Installed apps:
    Collected: No
    Shared: No

  - Other user-generated content:
    Collected: Yes (support requests)
    Shared: No
    Purpose: Customer support
    Optional: Yes

Web Browsing:
  - Web browsing history:
    Collected: No
    Shared: No

App Info and Performance:
  - Crash logs:
    Collected: Yes
    Shared: Yes (with crash reporting services)
    Purpose: App functionality
    Optional: No

  - Diagnostics:
    Collected: Yes
    Shared: Yes (with analytics providers)
    Purpose: App functionality, analytics
    Optional: No

Device or Other IDs:
  - Device or other IDs:
    Collected: Yes
    Shared: Yes (with analytics and advertising providers)
    Purpose: Analytics, advertising
    Optional: No
```

#### Data Security Practices

```yaml
Data Encryption:
  - In transit: Yes (HTTPS/TLS)
  - At rest: Yes (encrypted databases)

Data Deletion:
  - Users can request deletion: Yes
  - Data deleted when app uninstalled: Partial
  - Automatic deletion timeline: 2 years of inactivity

Data Access Controls:
  - Access limited to authorized personnel: Yes
  - Regular security audits: Yes
  - Compliance certifications: ISO 27001 (if applicable)
```

---

## GDPR Compliance Requirements

### Legal Basis for Processing

For each type of data processing, identify the legal basis:

1. **Consent** - Newsletter subscriptions, marketing communications
2. **Contract** - Account creation, service provision
3. **Legitimate Interest** - Analytics, security, fraud prevention
4. **Legal Obligation** - Data retention for legal compliance

### Data Subject Rights Implementation

```typescript
// Example data subject rights implementation
interface DataSubjectRequest {
  type:
    | "access"
    | "rectification"
    | "erasure"
    | "portability"
    | "restriction"
    | "objection";
  userId: string;
  requestDate: Date;
  status: "pending" | "processing" | "completed" | "rejected";
}

class GDPRComplianceService {
  async handleDataSubjectRequest(request: DataSubjectRequest) {
    switch (request.type) {
      case "access":
        return await this.exportUserData(request.userId);
      case "erasure":
        return await this.deleteUserData(request.userId);
      case "portability":
        return await this.exportPortableData(request.userId);
      // ... other cases
    }
  }

  async exportUserData(userId: string) {
    // Compile all user data from various sources
    const userData = {
      profile: await this.getUserProfile(userId),
      preferences: await this.getUserPreferences(userId),
      activityLog: await this.getUserActivity(userId),
      // ... other data categories
    };

    return userData;
  }

  async deleteUserData(userId: string) {
    // Delete user data while preserving legal obligations
    await this.anonymizeUserData(userId);
    await this.removePersonalIdentifiers(userId);
    // Keep aggregated, anonymized analytics data
  }
}
```

### Cookie and Consent Management

```typescript
// Example consent management implementation
interface ConsentPreferences {
  necessary: boolean; // Always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

class ConsentManager {
  async requestConsent(): Promise<ConsentPreferences> {
    // Show consent dialog
    const preferences = await this.showConsentDialog();

    // Store preferences
    await this.storeConsentPreferences(preferences);

    // Configure services based on consent
    this.configureServices(preferences);

    return preferences;
  }

  private configureServices(preferences: ConsentPreferences) {
    if (preferences.analytics) {
      this.enableAnalytics();
    }

    if (preferences.marketing) {
      this.enableMarketingTracking();
    }

    if (preferences.personalization) {
      this.enablePersonalization();
    }
  }
}
```

---

## Compliance Checklist

### Pre-Launch Compliance Verification

#### Apple App Store

- [ ] Privacy policy hosted on accessible HTTPS URL
- [ ] App Privacy details completed in App Store Connect
- [ ] ATT implementation (if tracking across apps/websites)
- [ ] Privacy policy link in app metadata
- [ ] Data collection practices accurately described
- [ ] Third-party data sharing disclosed
- [ ] User consent mechanisms implemented

#### Google Play Store

- [ ] Data safety section completed in Play Console
- [ ] Privacy policy link provided and accessible
- [ ] Data collection and sharing practices disclosed
- [ ] Security practices documented
- [ ] User data deletion process implemented
- [ ] Consent management system in place

#### GDPR Compliance

- [ ] Legal basis identified for all data processing
- [ ] Data subject rights implementation
- [ ] Privacy policy includes GDPR-required information
- [ ] Consent mechanisms for non-essential processing
- [ ] Data retention policies defined and implemented
- [ ] Data breach notification procedures established
- [ ] Data Protection Impact Assessment (if required)

### Ongoing Compliance Maintenance

1. **Regular Privacy Policy Updates**

   - Review quarterly for accuracy
   - Update when new features are added
   - Notify users of material changes

2. **Data Audit and Cleanup**

   - Regular data retention policy enforcement
   - Remove inactive user data per policy
   - Audit third-party data sharing agreements

3. **User Request Handling**

   - Establish process for data subject requests
   - Train support team on privacy procedures
   - Maintain request logs and response times

4. **Security Monitoring**
   - Regular security assessments
   - Monitor for data breaches
   - Update security measures as needed

This comprehensive privacy and compliance framework ensures both Construction News and Nursing Times apps meet all regulatory requirements while maintaining user trust and transparency.
