# App Store Deployment Guide for EMAP Publishing Ltd

## Construction News & Nursing Times Mobile Apps

### Executive Summary

This guide provides comprehensive setup plans for deploying two separate mobile applications (Construction News and Nursing Times) to both Apple App Store and Google Play Store. Both apps share the same codebase but will be deployed as distinct applications with separate listings, branding, and configurations.

**Project Overview:**

- **Company:** EMAP Publishing Ltd (UK-based)
- **Apps:** Construction News & Nursing Times
- **Architecture:** Multi-brand Expo React Native application
- **Deployment Strategy:** Separate app listings for each brand
- **Existing Resources:** Apple Developer Account & Google Play Console Account

---

## 1. Apple App Store Setup Plan

### 1.1 Apple Developer Account Requirements

Since EMAP Publishing Ltd already has an Apple Developer Account, verify the following:

**Account Verification Checklist:**

- [ ] Apple Developer Program membership is active ($99/year)
- [ ] Account holder has admin privileges
- [ ] Two-factor authentication is enabled
- [ ] Payment information is current
- [ ] Legal entity information matches EMAP Publishing Ltd

**Required Access Levels:**

- **Admin:** Full access to certificates, identifiers, profiles, and App Store Connect
- **Developer:** Can create certificates and provisioning profiles
- **App Manager:** Can manage app metadata and submissions

### 1.2 App Store Connect Configuration Strategy

**Separate App Listings Approach:**
Each brand will have its own App Store Connect entry with distinct:

- App IDs
- Bundle identifiers
- Metadata
- Assets
- Pricing and availability

**App Store Connect Setup Steps:**

1. **Create New Apps in App Store Connect**

   - Navigate to App Store Connect → My Apps → "+" → New App
   - Create separate entries for each brand

2. **App Information Configuration**

   ```
   Construction News:
   - Name: "Construction News"
   - Primary Language: English (UK)
   - Bundle ID: com.emappublishing.constructionnews
   - SKU: CN-EMAP-2024

   Nursing Times:
   - Name: "Nursing Times"
   - Primary Language: English (UK)
   - Bundle ID: com.emappublishing.nursingtimes
   - SKU: NT-EMAP-2024
   ```

### 1.3 iOS Bundle Identifier Strategy

**Recommended Bundle Identifiers:**

- **Construction News:** `com.emappublishing.constructionnews`
- **Nursing Times:** `com.emappublishing.nursingtimes`

**Bundle ID Configuration:**

1. Navigate to Apple Developer Portal → Certificates, Identifiers & Profiles
2. Select Identifiers → App IDs
3. Register new App ID for each brand:

```
Construction News App ID:
- Description: Construction News Mobile App
- Bundle ID: com.emappublishing.constructionnews
- Capabilities:
  - App Groups (for shared data)
  - Associated Domains (for deep linking)
  - Background App Refresh
  - Push Notifications
  - Universal Links

Nursing Times App ID:
- Description: Nursing Times Mobile App
- Bundle ID: com.emappublishing.nursingtimes
- Capabilities: [Same as above]
```

### 1.4 iOS Certificates and Provisioning Profiles

**Required Certificates:**

1. **Development Certificates**

   - iOS App Development (for testing)
   - One per developer who needs to test

2. **Distribution Certificates**
   - iOS Distribution (for App Store submission)
   - Apple Push Notification service SSL (for push notifications)

**Required Provisioning Profiles:**

1. **Development Profiles**

   - iOS App Development profile for each app
   - Links App ID, Development Certificate, and test devices

2. **Distribution Profiles**
   - App Store Distribution profile for each app
   - Links App ID and Distribution Certificate

**Setup Process:**

```bash
# Using Expo CLI with EAS
eas credentials:configure --platform ios

# Or manual setup in Apple Developer Portal:
# 1. Create certificates
# 2. Register devices (for development)
# 3. Create provisioning profiles
# 4. Download and install profiles
```

### 1.5 App Store Metadata Requirements

**Required Metadata for Each App:**

**App Information:**

- App Name (30 characters max)
- Subtitle (30 characters max)
- Primary Category
- Secondary Category (optional)
- Content Rights
- Age Rating

**Version Information:**

- Version Number (e.g., 1.0.0)
- Build Number (auto-incremented)
- What's New in This Version (4000 characters max)

**App Store Optimization (ASO):**

- Keywords (100 characters max, comma-separated)
- App Description (4000 characters max)
- Promotional Text (170 characters max)

**Suggested Metadata:**

```yaml
Construction News:
  name: "Construction News"
  subtitle: "UK Construction Industry News"
  primary_category: "News"
  secondary_category: "Business"
  keywords: "construction,news,building,UK,industry,architecture,engineering"
  description: |
    Stay informed with the latest construction industry news, insights, and analysis. 
    Construction News delivers breaking news, project updates, and expert commentary 
    covering the UK construction sector.

    Features:
    • Latest construction industry news
    • Project updates and analysis  
    • Expert commentary and insights
    • Event listings and networking
    • Offline reading capability
    • Push notifications for breaking news

Nursing Times:
  name: "Nursing Times"
  subtitle: "Professional Nursing News"
  primary_category: "Medical"
  secondary_category: "News"
  keywords: "nursing,healthcare,medical,professional,clinical,education,NHS"
  description: |
    The essential app for nursing professionals. Access the latest nursing news, 
    clinical updates, career guidance, and professional development resources.

    Features:
    • Breaking nursing and healthcare news
    • Clinical practice updates
    • Professional development resources
    • Career guidance and opportunities
    • Educational content and CPD
    • Expert analysis and commentary
```

### 1.6 Required Assets (Icons, Screenshots, App Previews)

**App Icons Required:**

| Size      | Usage           | Quantity |
| --------- | --------------- | -------- |
| 1024×1024 | App Store       | 1        |
| 180×180   | iPhone App (3x) | 1        |
| 120×120   | iPhone App (2x) | 1        |
| 167×167   | iPad Pro        | 1        |
| 152×152   | iPad App (2x)   | 1        |
| 76×76     | iPad App (1x)   | 1        |

**Screenshots Required:**

| Device         | Size      | Quantity |
| -------------- | --------- | -------- |
| iPhone 6.7"    | 1290×2796 | 3-10     |
| iPhone 6.5"    | 1242×2688 | 3-10     |
| iPhone 5.5"    | 1242×2208 | 3-10     |
| iPad Pro 12.9" | 2048×2732 | 3-10     |
| iPad Pro 11"   | 1668×2388 | 3-10     |

**App Preview Videos (Optional but Recommended):**

- Duration: 15-30 seconds
- Same sizes as screenshots
- Show key app functionality
- No audio narration allowed

**Asset Creation Strategy:**

1. Use brand-specific colors and themes
2. Show key features: news browsing, article reading, search
3. Include brand logos and visual identity
4. Ensure accessibility compliance
5. Test on actual devices

### 1.7 Privacy Policy and Compliance Requirements

**Privacy Policy Requirements:**

- Must be accessible via URL
- Must be in English (and other supported languages)
- Must describe data collection and usage
- Must be updated for iOS 14.5+ App Tracking Transparency

**Required Privacy Policy Sections:**

1. Data Collection Practices
2. Data Usage and Sharing
3. User Rights and Controls
4. Contact Information
5. Updates and Changes

**App Privacy Details (iOS 14.5+):**
Configure in App Store Connect → App Privacy:

```yaml
Data Types Collected:
  - Contact Info: Email addresses (for newsletters)
  - Usage Data: Product interaction, advertising data
  - Diagnostics: Crash data, performance data
  - Identifiers: User ID, device ID

Data Usage:
  - Analytics: App functionality, product personalization
  - App functionality: Customer support
  - Marketing: Third-party advertising

Third-Party Partners:
  - Analytics providers (Google Analytics)
  - Advertising networks
  - Content delivery networks
```

### 1.8 App Review Guidelines Considerations

**Key Guidelines to Follow:**

1. **Content Guidelines (2.0)**

   - Ensure news content is appropriate
   - No objectionable content
   - Respect intellectual property

2. **Business Guidelines (3.0)**

   - Clear value proposition
   - Appropriate pricing (if applicable)
   - No spam or duplicate apps

3. **Design Guidelines (4.0)**

   - Follow iOS Human Interface Guidelines
   - Proper use of iOS features
   - Consistent user experience

4. **Legal Guidelines (5.0)**
   - Privacy policy compliance
   - Terms of service
   - Age rating accuracy

**Common Rejection Reasons to Avoid:**

- Incomplete app information
- Missing privacy policy
- Poor app performance
- Inappropriate content
- Misleading metadata

---

## 2. Google Play Store Setup Plan

### 2.1 Google Play Console Account Setup

Since EMAP Publishing Ltd already has a Google Play Console account, verify:

**Account Verification Checklist:**

- [ ] Google Play Console account is active
- [ ] Developer registration fee paid ($25 one-time)
- [ ] Account in good standing
- [ ] Payment profile configured
- [ ] Tax information completed (if applicable)

**Account Access Management:**

- **Account Owner:** Full access to all features
- **Admin:** Manage users, financial data, and app releases
- **Developer:** Manage app releases and store listings
- **Viewer:** Read-only access

### 2.2 Android Package Name Strategy

**Recommended Package Names:**

- **Construction News:** `com.emappublishing.constructionnews`
- **Nursing Times:** `com.emappublishing.nursingtimes`

**Package Name Requirements:**

- Must be unique across Google Play
- Cannot be changed after first upload
- Should match iOS bundle identifiers for consistency
- Must follow reverse domain naming convention

### 2.3 Android Signing Key Requirements

**App Signing Strategy:**
Google Play App Signing (Recommended) - Google manages the app signing key

**Required Keys:**

1. **Upload Key**

   - Used to sign APKs/AABs for upload
   - Generated and managed by developer
   - Can be reset if compromised

2. **App Signing Key**
   - Used to sign APKs delivered to users
   - Managed by Google Play
   - Cannot be changed once set

**Key Generation Process:**

```bash
# Generate upload key using keytool
keytool -genkey -v -keystore construction-news-upload-key.keystore -alias construction-news -keyalg RSA -keysize 2048 -validity 10000

keytool -genkey -v -keystore nursing-times-upload-key.keystore -alias nursing-times -keyalg RSA -keysize 2048 -validity 10000

# Or using EAS CLI
eas credentials:configure --platform android
```

**Key Management Best Practices:**

- Store keys securely (password manager, secure server)
- Create backups of keystores
- Document key passwords and aliases
- Use different keys for each app
- Never share private keys

### 2.4 Play Store Listing Requirements

**Required Store Listing Elements:**

**App Details:**

- App name (50 characters max)
- Short description (80 characters max)
- Full description (4000 characters max)
- Category and tags
- Content rating
- Contact details

**Graphics Assets:**

- App icon (512×512 PNG)
- Feature graphic (1024×500 JPG/PNG)
- Screenshots (minimum 2, maximum 8)
- Phone screenshots (16:9 or 9:16 aspect ratio)
- Tablet screenshots (optional but recommended)

**Suggested Store Listings:**

```yaml
Construction News:
  app_name: "Construction News"
  short_description: "UK's leading construction industry news and insights app"
  category: "News & Magazines"
  tags: ["construction", "news", "building", "industry", "UK"]
  full_description: |
    Construction News is the UK's leading source for construction industry news, 
    analysis, and insights. Stay up-to-date with the latest developments in 
    building, infrastructure, and construction technology.

    KEY FEATURES:
    ✓ Breaking construction industry news
    ✓ In-depth project analysis and reports  
    ✓ Expert commentary and insights
    ✓ Industry event listings
    ✓ Offline reading capability
    ✓ Customizable news alerts
    ✓ Search and bookmark articles
    ✓ Share articles with colleagues

    CONTENT COVERAGE:
    • Commercial construction projects
    • Infrastructure developments
    • Building technology innovations
    • Industry regulations and policy
    • Market analysis and trends
    • Company news and appointments

Nursing Times:
  app_name: "Nursing Times"
  short_description: "Essential news and resources for nursing professionals"
  category: "Medical"
  tags: ["nursing", "healthcare", "medical", "professional", "clinical"]
  full_description: |
    Nursing Times is the essential app for nursing professionals, providing 
    the latest healthcare news, clinical updates, and professional development 
    resources for nurses across the UK and beyond.

    KEY FEATURES:
    ✓ Latest nursing and healthcare news
    ✓ Clinical practice guidelines
    ✓ Professional development resources
    ✓ Career guidance and job opportunities
    ✓ Educational content and CPD materials
    ✓ Expert analysis and commentary
    ✓ Offline reading capability
    ✓ Personalized content recommendations

    CONTENT AREAS:
    • Clinical practice and patient care
    • Healthcare policy and regulation
    • Professional development and education
    • Career guidance and opportunities
    • Research and evidence-based practice
    • Technology in healthcare
```

### 2.5 Required Assets and Metadata

**Graphic Assets Specifications:**

| Asset Type             | Size      | Format  | Quantity |
| ---------------------- | --------- | ------- | -------- |
| App Icon               | 512×512   | PNG     | 1        |
| Feature Graphic        | 1024×500  | JPG/PNG | 1        |
| Phone Screenshots      | Various   | JPG/PNG | 2-8      |
| 7" Tablet Screenshots  | Various   | JPG/PNG | 0-8      |
| 10" Tablet Screenshots | Various   | JPG/PNG | 0-8      |
| TV Screenshots         | 1920×1080 | JPG/PNG | 0-8      |
| Wear Screenshots       | 384×384   | JPG/PNG | 0-8      |

**Screenshot Requirements:**

- Minimum 2 screenshots required
- Maximum 8 screenshots allowed
- JPEG or 24-bit PNG format
- No alpha channel
- Minimum dimension: 320px
- Maximum dimension: 3840px
- Aspect ratio between 16:9 and 9:16

**Content Rating:**
Complete the content rating questionnaire for each app:

- Violence and blood
- Sexual content
- Profanity
- Controlled substances
- Gambling and contests
- User-generated content

### 2.6 Privacy Policy and Data Safety Requirements

**Data Safety Section (Required):**
Configure in Play Console → Policy → Data safety:

**Data Collection Categories:**

1. **Personal Info:** Name, email address
2. **App Activity:** Page views, in-app actions
3. **App Info and Performance:** Crash logs, diagnostics
4. **Device or Other IDs:** Advertising ID, device ID

**Data Usage Purposes:**

- App functionality
- Analytics
- Advertising or marketing
- Account management

**Data Sharing:**

- Specify if data is shared with third parties
- List third-party partners
- Describe data sharing purposes

**Data Security:**

- Data encryption in transit
- Data encryption at rest
- User data deletion process
- Data retention policies

**Privacy Policy Requirements:**

- Must be hosted on secure URL (HTTPS)
- Must be accessible and functional
- Must describe data practices accurately
- Must be written in clear, understandable language

### 2.7 Play Console Policies and Compliance

**Key Policy Areas:**

1. **Content Policy**

   - No restricted content
   - Accurate app descriptions
   - Appropriate content ratings

2. **Privacy and Security**

   - Privacy policy compliance
   - Data safety disclosure
   - Permissions usage justification

3. **Monetization and Ads**

   - Ad policy compliance (if applicable)
   - In-app purchase guidelines
   - Subscription policy adherence

4. **Technical Requirements**
   - App functionality requirements
   - Performance standards
   - Security requirements

**Pre-Launch Checklist:**

- [ ] App functions as described
- [ ] All required metadata completed
- [ ] Privacy policy accessible
- [ ] Data safety section completed
- [ ] Content rating obtained
- [ ] App signed with upload key
- [ ] Target API level requirements met

---

## 3. Multi-Brand Deployment Strategy

### 3.1 Separate App Listings Recommendation

**Benefits of Separate Listings:**

- **Brand Identity:** Each app maintains distinct branding
- **User Experience:** Targeted content and features per audience
- **App Store Optimization:** Separate keyword strategies
- **Analytics:** Independent performance tracking
- **Monetization:** Different pricing/subscription models possible
- **User Reviews:** Brand-specific feedback and ratings

**Implementation Strategy:**

1. Create separate app configurations in [`app.json`](app.json)
2. Use environment variables to build brand-specific versions
3. Maintain separate App Store Connect and Play Console entries
4. Deploy using EAS Build with brand-specific profiles

### 3.2 Asset Organization Strategy

**Directory Structure:**

```
assets/
├── construction-news/
│   ├── app-store/
│   │   ├── icon-1024.png
│   │   ├── screenshots/
│   │   └── app-preview.mp4
│   └── play-store/
│       ├── icon-512.png
│       ├── feature-graphic.png
│       └── screenshots/
└── nursing-times/
    ├── app-store/
    │   ├── icon-1024.png
    │   ├── screenshots/
    │   └── app-preview.mp4
    └── play-store/
        ├── icon-512.png
        ├── feature-graphic.png
        └── screenshots/
```

**Asset Management Workflow:**

1. Create brand-specific asset folders
2. Generate assets using brand colors and themes
3. Maintain version control for all assets
4. Use automated tools for resizing and optimization
5. Test assets on actual devices before submission

### 3.3 Metadata Management Approach

**Centralized Metadata Configuration:**
Create metadata configuration files for each brand:

```typescript
// config/app-store-metadata.ts
export const APP_STORE_METADATA = {
  constructionNews: {
    name: "Construction News",
    subtitle: "UK Construction Industry News",
    keywords: "construction,news,building,UK,industry",
    description: "...",
    categories: {
      primary: "News",
      secondary: "Business",
    },
  },
  nursingTimes: {
    name: "Nursing Times",
    subtitle: "Professional Nursing News",
    keywords: "nursing,healthcare,medical,professional",
    description: "...",
    categories: {
      primary: "Medical",
      secondary: "News",
    },
  },
};
```

**Metadata Synchronization:**

- Use scripts to generate store listing content
- Maintain consistency across platforms
- Version control all metadata changes
- Review and approve all content updates

### 3.4 Review and Approval Process Considerations

**Submission Strategy:**

1. **Staggered Submissions:** Submit one app first, learn from review feedback
2. **Parallel Submissions:** Submit both apps simultaneously for faster launch
3. **Platform Priority:** Choose iOS or Android first based on target audience

**Review Timeline Expectations:**

- **Apple App Store:** 24-48 hours (typically)
- **Google Play Store:** 1-3 days (typically)
- **First Submission:** May take longer due to additional review

**Common Review Issues:**

- Incomplete metadata
- Missing privacy policy
- App crashes or performance issues
- Content policy violations
- Misleading descriptions

**Mitigation Strategies:**

- Thorough testing before submission
- Complete all required fields
- Follow platform guidelines strictly
- Prepare for potential rejections
- Have contingency plans for quick fixes

---

## 4. Prerequisites and Account Setup

### 4.1 Step-by-Step Account Creation Processes

Since EMAP Publishing Ltd already has both developer accounts, focus on verification and optimization:

**Apple Developer Account Optimization:**

1. **Verify Account Status**

   - Log into Apple Developer Portal
   - Check membership expiration date
   - Verify payment information
   - Update company information if needed

2. **Team Management**

   - Review team member roles
   - Add necessary developers
   - Configure appropriate permissions
   - Enable two-factor authentication for all members

3. **Certificates Audit**
   - Review existing certificates
   - Remove expired certificates
   - Generate new certificates if needed
   - Document certificate usage

**Google Play Console Optimization:**

1. **Account Health Check**

   - Review account standing
   - Check for any policy violations
   - Update payment profile
   - Complete tax information

2. **User Management**

   - Review user permissions
   - Add team members as needed
   - Configure role-based access
   - Enable two-step verification

3. **Developer Profile**
   - Update company information
   - Add contact details
   - Configure notification preferences
   - Set up automated reports

### 4.2 Required Documentation and Verification

**Apple Developer Account:**

- [ ] D-U-N-S Number (for organization accounts)
- [ ] Legal entity verification
- [ ] Authorized signatory documentation
- [ ] Bank account information (for paid apps)
- [ ] Tax forms (if applicable)

**Google Play Console:**

- [ ] Developer identity verification
- [ ] Organization verification (if applicable)
- [ ] Payment profile setup
- [ ] Tax information (for paid apps)
- [ ] Bank account details

**Additional Documentation:**

- [ ] Privacy policy (hosted and accessible)
- [ ] Terms of service
- [ ] Content rating certificates
- [ ] Age verification (if applicable)
- [ ] Trademark documentation (if applicable)

### 4.3 Cost Breakdown for Developer Accounts

**Apple Developer Program:**

- **Annual Fee:** $99 USD (already paid)
- **Additional Costs:** None for basic app distribution
- **Optional:** Apple Developer Enterprise Program ($299/year) - not needed

**Google Play Console:**

- **Registration Fee:** $25 USD one-time (already paid)
- **Additional Costs:** None for basic app distribution
- **Transaction Fees:** 30% of revenue (for paid apps/in-app purchases)

**Additional Costs to Consider:**

- **App Store Optimization Tools:** $50-200/month (optional)
- **Analytics Tools:** $0-100/month (optional)
- **Testing Services:** $100-500/month (optional)
- **Legal Review:** $500-2000 one-time (recommended)
- **Professional Asset Creation:** $1000-5000 one-time

### 4.4 Timeline Expectations

**Pre-Launch Phase (4-6 weeks):**

**Week 1-2: Setup and Configuration**

- Configure app identifiers and certificates
- Set up App Store Connect and Play Console entries
- Create initial app configurations
- Begin asset creation

**Week 3-4: Asset Creation and Testing**

- Create all required icons and screenshots
- Write app descriptions and metadata
- Conduct thorough testing
- Prepare privacy policy and legal documents

**Week 5-6: Submission Preparation**

- Final testing and bug fixes
- Complete all store listing requirements
- Prepare for submission
- Create submission checklist

**Launch Phase (1-2 weeks):**

**Week 1: Initial Submissions**

- Submit to Apple App Store
- Submit to Google Play Store
- Monitor review status
- Respond to any review feedback

**Week 2: Launch and Monitoring**

- Apps approved and live
- Monitor initial user feedback
- Track download and usage metrics
- Prepare for post-launch updates

**Post-Launch Phase (Ongoing):**

- Regular app updates
- Performance monitoring
- User feedback management
- Store listing optimization
- Feature development and enhancement

---

## 5. Implementation Checklist

### 5.1 Pre-Development Checklist

- [ ] Verify Apple Developer Account access
- [ ] Verify Google Play Console access
- [ ] Create bundle identifiers/package names
- [ ] Set up certificates and signing keys
- [ ] Create App Store Connect entries
- [ ] Create Play Console entries
- [ ] Prepare legal documents (privacy policy, terms)

### 5.2 Development Phase Checklist

- [ ] Configure [`app.json`](app.json) for each brand
- [ ] Set up EAS Build profiles
- [ ] Create brand-specific build configurations
- [ ] Implement deep linking (if required)
- [ ] Add analytics and crash reporting
- [ ] Test on physical devices
- [ ] Conduct accessibility testing

### 5.3 Asset Creation Checklist

- [ ] Design app icons for both platforms
- [ ] Create screenshots for all device sizes
- [ ] Design feature graphics (Android)
- [ ] Create app preview videos (optional)
- [ ] Optimize all assets for different screen densities
- [ ] Test assets on actual devices

### 5.4 Store Listing Checklist

- [ ] Write compelling app descriptions
- [ ] Research and select optimal keywords
- [ ] Set appropriate content ratings
- [ ] Configure pricing and availability
- [ ] Set up app categories and tags
- [ ] Complete privacy and data safety sections

### 5.5 Submission Checklist

- [ ] Final testing on production builds
- [ ] Verify all metadata is complete
- [ ] Check privacy policy accessibility
- [ ] Confirm all assets meet requirements
- [ ] Submit to Apple App Store
- [ ] Submit to Google Play Store
- [ ] Monitor review status
- [ ] Prepare for potential feedback

---

## 6. Conclusion

This comprehensive deployment guide provides EMAP Publishing Ltd with a detailed roadmap for successfully launching both Construction News and Nursing Times applications on Apple App Store and Google Play Store. The separate app listing strategy will allow each brand to maintain its distinct identity while leveraging the shared codebase architecture.

**Key Success Factors:**

1. **Thorough Preparation:** Complete all requirements before submission
2. **Brand Consistency:** Maintain strong brand identity across all touchpoints
3. **Quality Assurance:** Extensive testing before and after launch
4. **Compliance Focus:** Strict adherence to platform guidelines
5. **User Experience:** Prioritize user needs and feedback
6. **Continuous Improvement:** Regular updates and feature enhancements

**Next Steps:**

1. Review and approve this deployment plan
2. Begin implementation following the provided timeline
3. Set up project management and tracking systems
4. Assign team members to specific tasks
5. Begin asset creation and development work

For questions or clarifications regarding this deployment guide, please refer to the official Apple and Google developer documentation or consult with the development team.
