# App Store Deployment Documentation

## Construction News & Nursing Times Mobile Apps

This documentation package provides comprehensive guidance for deploying EMAP Publishing Ltd's multi-brand mobile applications to Apple App Store and Google Play Store.

## 📋 Documentation Overview

### Core Documents

1. **[App Store Deployment Guide](app-store-deployment-guide.md)**

   - Complete setup plans for both Apple App Store and Google Play Store
   - Account requirements and configuration strategies
   - Bundle identifier and package name recommendations
   - Metadata requirements and compliance guidelines
   - Multi-brand deployment strategy

2. **[EAS Build Configuration](eas-build-configuration.md)**

   - Brand-specific build profiles and configurations
   - Environment variable setup
   - Build commands and credential management
   - Troubleshooting and verification procedures

3. **[App Store Assets Checklist](app-store-assets-checklist.md)**

   - Detailed asset specifications for both platforms
   - Icon, screenshot, and graphic requirements
   - Brand-specific design guidelines
   - Quality assurance and testing procedures

4. **[Privacy Policy and Compliance](privacy-policy-compliance.md)**

   - GDPR, Apple ATT, and Google Play compliance requirements
   - Privacy policy templates and implementation guides
   - Data safety configuration for both platforms
   - Legal and regulatory considerations

5. **[Deployment Timeline and Action Plan](deployment-timeline-action-plan.md)**

   - 6-8 week implementation timeline
   - Phase-by-phase action items and deliverables
   - Resource requirements and budget estimates
   - Risk management and success criteria

6. **[Future Brand Expansion Guide](future-brand-expansion-guide.md)**
   - Scalable architecture for additional brands
   - Step-by-step process for adding new brands
   - Cost analysis and operational considerations
   - Long-term brand portfolio management strategy

## 🎯 Quick Start Guide

### Prerequisites

- ✅ Apple Developer Account (EMAP Publishing Ltd)
- ✅ Google Play Console Account (EMAP Publishing Ltd)
- ✅ Multi-brand Expo React Native codebase
- ✅ Brand configurations for Construction News and Nursing Times

### Recommended Bundle Identifiers

- **Construction News:** `com.emappublishing.constructionnews`
- **Nursing Times:** `com.emappublishing.nursingtimes`

### Key Implementation Steps

1. **Week 1-2: Foundation Setup**

   - Verify developer accounts and team access
   - Create app entries in App Store Connect and Play Console
   - Configure certificates, keys, and EAS build profiles

2. **Week 3-4: Asset Creation**

   - Design brand-specific icons and graphics
   - Create screenshots for all required device sizes
   - Write app descriptions and metadata

3. **Week 5-6: Development and Testing**

   - Implement multi-brand functionality
   - Configure privacy and compliance features
   - Comprehensive testing across devices and brands

4. **Week 7-8: Submission and Launch**
   - Submit to both app stores
   - Monitor review process and respond to feedback
   - Launch and post-launch monitoring

## 🏗️ Architecture Overview

### Multi-Brand Strategy

Both Construction News and Nursing Times will be deployed as **separate applications** with:

- Distinct app store listings
- Independent branding and metadata
- Shared codebase with brand-specific configurations
- Separate bundle identifiers and package names

### Brand Configurations

```
Construction News (cn):
- Primary Color: #FFDD00 (Yellow)
- Domain: constructionnews.co.uk
- Features: News, Events, Ask (no Clinical/Podcasts/Paper)

Nursing Times (nt):
- Primary Color: #00AECA (Teal)
- Domain: nursingtimes.net
- Features: News, Clinical, Events, Ask (no Podcasts/Paper)
```

## 📱 Platform Requirements

### Apple App Store

- **Bundle IDs:** Registered and configured in Apple Developer Portal
- **Certificates:** iOS Distribution certificates and provisioning profiles
- **Assets:** Icons (multiple sizes), screenshots (5 device categories), optional app previews
- **Metadata:** App descriptions, keywords, categories, age ratings
- **Compliance:** Privacy policy, App Tracking Transparency, App Privacy details

### Google Play Store

- **Package Names:** Unique identifiers matching iOS bundle IDs
- **Signing:** Upload keys and Google Play App Signing
- **Assets:** App icon, feature graphic, screenshots (multiple device types)
- **Metadata:** App descriptions, categories, content ratings
- **Compliance:** Data safety section, privacy policy, GDPR compliance

## 🔧 Technical Implementation

### EAS Build Profiles

```json
{
  "build": {
    "production-cn": {
      "env": { "EXPO_PUBLIC_BRAND": "cn" },
      "ios": { "bundleIdentifier": "com.emappublishing.constructionnews" },
      "android": { "package": "com.emappublishing.constructionnews" }
    },
    "production-nt": {
      "env": { "EXPO_PUBLIC_BRAND": "nt" },
      "ios": { "bundleIdentifier": "com.emappublishing.nursingtimes" },
      "android": { "package": "com.emappublishing.nursingtimes" }
    }
  }
}
```

### Build Commands

```bash
# Construction News
EXPO_PUBLIC_BRAND=cn eas build --platform all --profile production-cn

# Nursing Times
EXPO_PUBLIC_BRAND=nt eas build --platform all --profile production-nt
```

## 📊 Success Metrics

### Technical KPIs

- ✅ Both apps successfully deployed to stores
- ✅ 99%+ uptime and stability
- ✅ Fast loading times (<3 seconds)
- ✅ Crash rate <0.1%

### Business KPIs

- 🎯 4+ star average ratings on both stores
- 🎯 Target download numbers achieved within 30 days
- 🎯 Positive user feedback and reviews
- 🎯 Strong user engagement and retention rates

### Compliance KPIs

- ✅ Full GDPR and privacy compliance
- ✅ No app store policy violations
- ✅ Successful security and legal audits
- ✅ User trust and confidence maintained

## 💰 Budget Summary

### Estimated Costs

- **Development Team (6-8 weeks):** £20,000-£35,000
- **Design and Assets:** £2,000-£5,000
- **Testing and QA:** £1,000-£3,000
- **Third-Party Services:** £800-£2,300
- **Miscellaneous and Contingency:** £3,000-£6,500

**Total Estimated Budget: £25,000-£50,000**

_Note: Developer account fees already covered by existing EMAP accounts_

## ⚠️ Risk Mitigation

### Common Risks and Solutions

- **App Store Rejections:** Follow guidelines strictly, prepare for resubmission
- **Technical Issues:** Maintain backup configurations, test thoroughly
- **Timeline Delays:** Build in buffer time, manage scope carefully
- **Compliance Issues:** Work with legal team, implement privacy by design

## 📞 Support and Resources

### Key Contacts

- **Project Manager:** Overall coordination and timeline management
- **Lead Developer:** Technical implementation and troubleshooting
- **UI/UX Designer:** Asset creation and brand consistency
- **Legal/Compliance:** Privacy policy and regulatory compliance

### External Resources

- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

## 🚀 Next Steps

1. **Review Documentation:** Team review of all deployment plans
2. **Stakeholder Approval:** Get approval for timeline and budget
3. **Team Assignment:** Assign team members to specific tasks
4. **Project Kickoff:** Begin Phase 1 foundation setup
5. **Progress Tracking:** Set up project management and monitoring

---

## Document Status

**Created:** September 30, 2024  
**Version:** 1.0  
**Status:** Ready for Implementation  
**Next Review:** Upon project completion

This documentation package provides everything needed to successfully deploy both Construction News and Nursing Times applications to Apple App Store and Google Play Store, maintaining separate brand identities while leveraging the shared multi-brand codebase architecture.
