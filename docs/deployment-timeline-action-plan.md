# Deployment Timeline and Action Plan

## Construction News & Nursing Times Apps

This document provides a detailed timeline and actionable steps for deploying both Construction News and Nursing Times applications to Apple App Store and Google Play Store.

## Executive Summary

**Project Duration:** 6-8 weeks from start to app store approval
**Team Requirements:** 2-3 developers, 1 designer, 1 project manager
**Budget Estimate:** £5,000-£15,000 (excluding development accounts)
**Success Metrics:** Both apps live on stores with 4+ star ratings

---

## Phase 1: Foundation Setup (Week 1-2)

### Week 1: Account Verification and Initial Setup

#### Day 1-2: Account Audit and Verification

**Responsible:** Project Manager + Lead Developer

**Apple Developer Account:**

- [ ] Verify EMAP Publishing Ltd Apple Developer Account status
- [ ] Check membership expiration (renew if needed)
- [ ] Audit team member access and permissions
- [ ] Enable two-factor authentication for all team members
- [ ] Review and update company information
- [ ] Document current certificates and provisioning profiles

**Google Play Console:**

- [ ] Verify EMAP Publishing Ltd Google Play Console access
- [ ] Check account standing and compliance status
- [ ] Review payment profile and tax information
- [ ] Audit user permissions and access levels
- [ ] Update developer profile information
- [ ] Configure notification preferences

**Deliverables:**

- Account status report
- Team access documentation
- Compliance checklist

#### Day 3-5: App Store Setup and Configuration

**Responsible:** Lead Developer + Project Manager

**Apple App Store Connect:**

- [ ] Create new app entry for Construction News
  - App Name: "Construction News"
  - Bundle ID: `com.emappublishing.constructionnews`
  - SKU: `CN-EMAP-2024`
  - Primary Language: English (UK)
- [ ] Create new app entry for Nursing Times
  - App Name: "Nursing Times"
  - Bundle ID: `com.emappublishing.nursingtimes`
  - SKU: `NT-EMAP-2024`
  - Primary Language: English (UK)
- [ ] Configure basic app information for both apps
- [ ] Set up app categories and age ratings

**Google Play Console:**

- [ ] Create new app for Construction News
  - Package name: `com.emappublishing.constructionnews`
- [ ] Create new app for Nursing Times
  - Package name: `com.emappublishing.nursingtimes`
- [ ] Configure basic app information
- [ ] Set up content ratings for both apps

**Deliverables:**

- App Store Connect app entries
- Play Console app entries
- Initial configuration documentation

### Week 2: Technical Foundation

#### Day 1-3: Certificate and Key Management

**Responsible:** Lead Developer + DevOps Engineer

**iOS Certificates and Provisioning:**

- [ ] Generate/update iOS Distribution certificates
- [ ] Create App IDs for both bundle identifiers
- [ ] Configure app capabilities (push notifications, associated domains)
- [ ] Generate provisioning profiles for both apps
- [ ] Set up push notification certificates (if needed)
- [ ] Document certificate expiration dates

**Android Signing Keys:**

- [ ] Generate upload keys for both apps
- [ ] Configure Google Play App Signing
- [ ] Secure key storage and backup procedures
- [ ] Document key information and passwords
- [ ] Set up EAS credentials for both brands

**EAS Configuration:**

```bash
# Configure credentials for Construction News
EXPO_PUBLIC_BRAND=cn eas credentials:configure --platform all

# Configure credentials for Nursing Times
EXPO_PUBLIC_BRAND=nt eas credentials:configure --platform all
```

**Deliverables:**

- Certificate and key documentation
- EAS credential configuration
- Security procedures document

#### Day 4-5: Build Configuration Setup

**Responsible:** Lead Developer

**EAS Build Profiles:**

- [ ] Update [`eas.json`](eas.json) with brand-specific profiles
- [ ] Create brand-specific [`app.json`](app.json) configurations
- [ ] Set up environment variables for each brand
- [ ] Configure build scripts in [`package.json`](package.json)
- [ ] Test build configurations locally

**Brand Configuration:**

- [ ] Verify brand configurations in [`brands/cn/config.json`](brands/cn/config.json)
- [ ] Verify brand configurations in [`brands/nt/config.json`](brands/nt/config.json)
- [ ] Test brand switching functionality
- [ ] Validate API configurations for both brands

**Deliverables:**

- Updated EAS configuration
- Brand-specific app configurations
- Build script documentation

---

## Phase 2: Asset Creation and Content Development (Week 3-4)

### Week 3: Asset Design and Creation

#### Day 1-2: Design Planning and Brand Guidelines

**Responsible:** UI/UX Designer + Brand Manager

**Design Requirements Analysis:**

- [ ] Review Apple App Store asset requirements
- [ ] Review Google Play Store asset requirements
- [ ] Analyze Construction News brand guidelines
- [ ] Analyze Nursing Times brand guidelines
- [ ] Create asset creation timeline
- [ ] Set up design tools and templates

**Brand-Specific Design Systems:**

- [ ] Construction News color palette and typography
- [ ] Nursing Times color palette and typography
- [ ] Icon design principles for both brands
- [ ] Screenshot composition guidelines
- [ ] Feature graphic design approach

**Deliverables:**

- Design requirements document
- Brand-specific design systems
- Asset creation timeline

#### Day 3-5: Icon and Graphic Asset Creation

**Responsible:** UI/UX Designer

**App Icons (Both Brands):**

- [ ] Design 1024×1024 App Store icons
- [ ] Generate all required iOS icon sizes
- [ ] Create 512×512 Google Play icons
- [ ] Test icons on various backgrounds
- [ ] Optimize for different screen densities

**Google Play Feature Graphics:**

- [ ] Design 1024×500 Construction News feature graphic
- [ ] Design 1024×500 Nursing Times feature graphic
- [ ] Include brand elements and key messaging
- [ ] Test readability at different sizes

**Quality Assurance:**

- [ ] Review icons on actual devices
- [ ] Test visibility in app stores
- [ ] Verify brand consistency
- [ ] Get stakeholder approval

**Deliverables:**

- Complete icon sets for both brands
- Feature graphics for Google Play
- Asset quality assurance report

### Week 4: Screenshot and Content Creation

#### Day 1-3: App Screenshot Creation

**Responsible:** UI/UX Designer + Developer

**Screenshot Planning:**

- [ ] Identify key app features to showcase
- [ ] Plan screenshot sequence and user flow
- [ ] Prepare sample content for screenshots
- [ ] Set up devices and simulators for capture

**Construction News Screenshots:**

- [ ] iPhone 6.7" screenshots (5 screens)
- [ ] iPhone 6.5" screenshots (5 screens)
- [ ] iPhone 5.5" screenshots (5 screens)
- [ ] iPad Pro 12.9" screenshots (5 screens)
- [ ] iPad Pro 11" screenshots (5 screens)
- [ ] Android phone screenshots (5 screens)

**Nursing Times Screenshots:**

- [ ] Complete same screenshot set as Construction News
- [ ] Ensure healthcare-appropriate content
- [ ] Highlight clinical and professional features

**Screenshot Content:**

1. Home screen with featured articles
2. Article reading experience
3. Search and browse functionality
4. Settings and personalization
5. Offline reading capabilities

**Deliverables:**

- Complete screenshot sets for both brands
- Screenshot content documentation
- Device-specific optimizations

#### Day 4-5: Metadata and Description Writing

**Responsible:** Content Writer + Marketing Manager

**App Store Descriptions:**

- [ ] Construction News app description (4000 chars)
- [ ] Nursing Times app description (4000 chars)
- [ ] Keyword research and optimization
- [ ] Feature highlights and benefits
- [ ] Professional tone and industry language

**Google Play Descriptions:**

- [ ] Construction News short description (80 chars)
- [ ] Construction News full description (4000 chars)
- [ ] Nursing Times short description (80 chars)
- [ ] Nursing Times full description (4000 chars)
- [ ] SEO optimization for Play Store

**Metadata Elements:**

- [ ] App subtitles and promotional text
- [ ] Keywords and tags
- [ ] Category selections
- [ ] Age ratings and content descriptions

**Deliverables:**

- Complete app store descriptions
- Keyword optimization report
- Metadata configuration guide

---

## Phase 3: Development and Testing (Week 5-6)

### Week 5: App Development and Integration

#### Day 1-3: Core Development Tasks

**Responsible:** Development Team

**Multi-Brand Implementation:**

- [ ] Implement dynamic app configuration based on brand
- [ ] Test brand switching functionality
- [ ] Verify API integrations for both brands
- [ ] Implement deep linking (if required)
- [ ] Add analytics and crash reporting

**Platform-Specific Features:**

- [ ] iOS-specific implementations
- [ ] Android-specific implementations
- [ ] Push notification setup (if required)
- [ ] Offline functionality testing
- [ ] Performance optimization

**Quality Assurance:**

- [ ] Unit testing for brand-specific functionality
- [ ] Integration testing with APIs
- [ ] Performance testing on various devices
- [ ] Memory usage and battery optimization

**Deliverables:**

- Feature-complete app builds
- Test coverage reports
- Performance benchmarks

#### Day 4-5: Privacy and Compliance Implementation

**Responsible:** Lead Developer + Legal/Compliance

**Privacy Policy Implementation:**

- [ ] Host privacy policies on HTTPS URLs
- [ ] Implement in-app privacy policy access
- [ ] Configure App Tracking Transparency (iOS)
- [ ] Set up consent management system
- [ ] Test GDPR compliance features

**Data Safety Configuration:**

- [ ] Complete Apple App Privacy details
- [ ] Complete Google Play Data Safety section
- [ ] Verify third-party service disclosures
- [ ] Test data collection and usage flows

**Compliance Testing:**

- [ ] Verify privacy policy accessibility
- [ ] Test consent mechanisms
- [ ] Validate data collection practices
- [ ] Review third-party integrations

**Deliverables:**

- Privacy policy implementations
- Compliance configuration documentation
- Privacy testing reports

### Week 6: Final Testing and Build Preparation

#### Day 1-3: Comprehensive Testing

**Responsible:** QA Team + Development Team

**Device Testing:**

- [ ] Test on iPhone (various models and iOS versions)
- [ ] Test on iPad (various models)
- [ ] Test on Android phones (various manufacturers)
- [ ] Test on Android tablets
- [ ] Verify functionality across screen sizes

**Brand-Specific Testing:**

- [ ] Test Construction News brand configuration
- [ ] Test Nursing Times brand configuration
- [ ] Verify brand-specific colors and themes
- [ ] Test API integrations for both brands
- [ ] Validate content rendering and display

**Performance Testing:**

- [ ] App launch time optimization
- [ ] Memory usage monitoring
- [ ] Battery consumption testing
- [ ] Network performance testing
- [ ] Offline functionality verification

**Deliverables:**

- Comprehensive testing reports
- Bug fixes and optimizations
- Performance benchmarks

#### Day 4-5: Production Build Creation

**Responsible:** Lead Developer + DevOps

**Build Generation:**

```bash
# Construction News production builds
EXPO_PUBLIC_BRAND=cn eas build --platform all --profile production-cn --non-interactive

# Nursing Times production builds
EXPO_PUBLIC_BRAND=nt eas build --platform all --profile production-nt --non-interactive
```

**Build Verification:**

- [ ] Verify app signing and certificates
- [ ] Test production builds on devices
- [ ] Validate app store metadata integration
- [ ] Check asset loading and display
- [ ] Confirm API connectivity in production mode

**Pre-Submission Checklist:**

- [ ] All required assets uploaded
- [ ] Metadata complete and accurate
- [ ] Privacy policies accessible
- [ ] Compliance requirements met
- [ ] Build testing completed successfully

**Deliverables:**

- Production-ready app builds
- Build verification reports
- Pre-submission checklists

---

## Phase 4: Store Submission and Launch (Week 7-8)

### Week 7: Store Submissions

#### Day 1-2: Apple App Store Submission

**Responsible:** Lead Developer + Project Manager

**Construction News Submission:**

- [ ] Upload production build to App Store Connect
- [ ] Complete all metadata fields
- [ ] Upload all required screenshots and assets
- [ ] Configure pricing and availability
- [ ] Submit for App Store review
- [ ] Monitor submission status

**Nursing Times Submission:**

- [ ] Upload production build to App Store Connect
- [ ] Complete all metadata fields
- [ ] Upload all required screenshots and assets
- [ ] Configure pricing and availability
- [ ] Submit for App Store review
- [ ] Monitor submission status

**Submission Verification:**

- [ ] Verify all required information is complete
- [ ] Check asset quality and compliance
- [ ] Confirm privacy policy accessibility
- [ ] Review app functionality description accuracy

**Deliverables:**

- App Store submission confirmations
- Submission status tracking
- Review feedback preparation

#### Day 3-5: Google Play Store Submission

**Responsible:** Lead Developer + Project Manager

**Construction News Submission:**

- [ ] Upload production AAB to Play Console
- [ ] Complete store listing information
- [ ] Upload all required assets
- [ ] Configure content rating and pricing
- [ ] Submit for Play Store review
- [ ] Monitor review status

**Nursing Times Submission:**

- [ ] Upload production AAB to Play Console
- [ ] Complete store listing information
- [ ] Upload all required assets
- [ ] Configure content rating and pricing
- [ ] Submit for Play Store review
- [ ] Monitor review status

**Play Console Configuration:**

- [ ] Set up release management
- [ ] Configure staged rollout (optional)
- [ ] Set up automated testing
- [ ] Configure user feedback monitoring

**Deliverables:**

- Play Store submission confirmations
- Release management configuration
- Review monitoring setup

### Week 8: Launch and Post-Launch Activities

#### Day 1-3: Review Response and Launch Preparation

**Responsible:** Full Team

**Review Monitoring:**

- [ ] Monitor Apple App Store review status
- [ ] Monitor Google Play Store review status
- [ ] Respond to any review feedback promptly
- [ ] Make necessary adjustments if required
- [ ] Resubmit if needed

**Launch Preparation:**

- [ ] Prepare launch communications
- [ ] Set up app store monitoring tools
- [ ] Configure analytics and reporting
- [ ] Prepare customer support procedures
- [ ] Plan post-launch marketing activities

**Contingency Planning:**

- [ ] Prepare for potential app rejections
- [ ] Have bug fix procedures ready
- [ ] Plan for immediate post-launch updates
- [ ] Set up emergency response procedures

**Deliverables:**

- Review response documentation
- Launch readiness checklist
- Contingency plans

#### Day 4-5: App Launch and Initial Monitoring

**Responsible:** Full Team

**Launch Activities:**

- [ ] Apps approved and live on both stores
- [ ] Verify app store listings are correct
- [ ] Test app downloads and installations
- [ ] Monitor initial user feedback
- [ ] Track download and usage metrics

**Post-Launch Monitoring:**

- [ ] Monitor app performance and stability
- [ ] Track user reviews and ratings
- [ ] Monitor crash reports and errors
- [ ] Analyze user engagement metrics
- [ ] Prepare for first post-launch update

**Success Metrics Tracking:**

- [ ] Download numbers and trends
- [ ] User ratings and reviews
- [ ] App store search rankings
- [ ] User engagement and retention
- [ ] Revenue metrics (if applicable)

**Deliverables:**

- Launch success report
- Initial performance metrics
- Post-launch improvement plan

---

## Resource Requirements

### Team Structure

**Core Team (Required):**

- **Project Manager** (1.0 FTE) - Overall coordination and timeline management
- **Lead Developer** (1.0 FTE) - Technical implementation and build management
- **UI/UX Designer** (0.5 FTE) - Asset creation and design work
- **QA Engineer** (0.5 FTE) - Testing and quality assurance

**Extended Team (As Needed):**

- **DevOps Engineer** (0.25 FTE) - Infrastructure and deployment
- **Content Writer** (0.25 FTE) - App descriptions and metadata
- **Legal/Compliance** (0.1 FTE) - Privacy policy and compliance review

### Budget Breakdown

**Development Costs:**

- Team salaries (6-8 weeks): £20,000-£35,000
- Design and asset creation: £2,000-£5,000
- Testing and QA: £1,000-£3,000

**Third-Party Services:**

- App store optimization tools: £200-£500
- Analytics and monitoring: £100-£300
- Legal review (optional): £500-£2,000

**Miscellaneous:**

- Device testing: £500-£1,000
- Marketing materials: £500-£1,500
- Contingency (10%): £2,000-£4,000

**Total Estimated Budget: £25,000-£50,000**

### Tools and Software

**Development Tools:**

- Expo CLI and EAS Build
- Xcode (for iOS development)
- Android Studio (for Android development)
- Git version control

**Design Tools:**

- Figma or Sketch (UI/UX design)
- Adobe Creative Suite (asset creation)
- App store screenshot generators

**Project Management:**

- Jira or Asana (task management)
- Slack or Teams (communication)
- Confluence (documentation)

**Monitoring and Analytics:**

- App Store Connect Analytics
- Google Play Console Analytics
- Firebase Analytics
- Crashlytics

---

## Risk Management

### Potential Risks and Mitigation Strategies

**Technical Risks:**

- **Build failures:** Maintain backup build configurations and test regularly
- **Certificate expiration:** Monitor certificate dates and renew proactively
- **API integration issues:** Test thoroughly and have fallback mechanisms

**Store Review Risks:**

- **App rejection:** Follow guidelines strictly and prepare for resubmission
- **Metadata issues:** Review all content multiple times before submission
- **Privacy compliance:** Work with legal team to ensure full compliance

**Timeline Risks:**

- **Scope creep:** Maintain strict scope control and change management
- **Resource availability:** Have backup team members identified
- **External dependencies:** Identify and manage third-party dependencies

**Business Risks:**

- **Market competition:** Monitor competitor activities and differentiate
- **User adoption:** Plan marketing and user acquisition strategies
- **Revenue impact:** Set realistic expectations and success metrics

### Success Criteria

**Technical Success:**

- Both apps successfully deployed to stores
- 99%+ uptime and stability
- Fast loading times and smooth performance
- Positive user experience across devices

**Business Success:**

- 4+ star average ratings on both stores
- Target download numbers achieved
- Positive user feedback and reviews
- Strong user engagement and retention

**Compliance Success:**

- Full privacy and data protection compliance
- No policy violations or store warnings
- Successful legal and security audits
- User trust and confidence maintained

This comprehensive timeline and action plan provides EMAP Publishing Ltd with a clear roadmap for successfully launching both Construction News and Nursing Times applications on Apple App Store and Google Play Store within the 6-8 week timeframe.
