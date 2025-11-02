# Google Ad Manager Setup Guide for Ad Operations Team

## Overview

This guide provides step-by-step instructions for the Ad Operations team to configure Google Ad Manager (GAM) to serve native ads in the app's Highlights carousel.

---

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] Access to Google Ad Manager account
- [ ] Admin or trafficking permissions in GAM
- [ ] App registered in AdMob (if using AdMob)
- [ ] iOS App ID and Android Package Name

---

## 🎯 Ad Placement Specifications

### Placement Details

- **Ad Format**: Native Advanced
- **Placement Name**: Highlights Carousel Native Ad
- **Location**: Home screen, Highlights tab
- **Position**: Every 5 articles (first ad at position 4)
- **Frequency**: Up to 3 ads per carousel session
- **User Experience**: Seamlessly integrated with editorial content

### Technical Specifications

- **Ad Type**: Native Advanced (Custom rendering)
- **Required Assets**:
  - Headline (required)
  - Body text (required)
  - Image (required, 1200x628px recommended)
  - Advertiser name (required)
  - Call-to-action button text (required)
  - Icon (optional)
- **Supported Platforms**: iOS and Android

---

## 📱 Step 1: Create Ad Units

### For iOS

1. **Navigate to Ad Units**

   - Go to: `Apps` → `Ad units` → `+ New ad unit`

2. **Configure Ad Unit**

   - **Ad unit name**: `Highlights_Carousel_Native_iOS`
   - **Platform**: iOS
   - **Ad format**: Native
   - **Native ad type**: Native Advanced
   - Click `Create ad unit`

3. **Note the Ad Unit ID**
   - Format: `ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY`
   - **Save this ID** - you'll need to provide it to the dev team

### For Android

1. **Create Android Ad Unit**

   - Follow same steps as iOS
   - **Ad unit name**: `Highlights_Carousel_Native_Android`
   - **Platform**: Android
   - **Ad format**: Native
   - **Native ad type**: Native Advanced

2. **Note the Ad Unit ID**
   - Format: `ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ`
   - **Save this ID** - you'll need to provide it to the dev team

---

## 🎨 Step 2: Configure Native Ad Template

### Required Ad Components

The app expects these native ad components:

| Component      | Required | Max Length | Notes                                       |
| -------------- | -------- | ---------- | ------------------------------------------- |
| Headline       | Yes      | 25 chars   | Main ad title                               |
| Body           | Yes      | 90 chars   | Description text                            |
| Image          | Yes      | 1200x628px | Main ad image                               |
| Advertiser     | Yes      | 25 chars   | Brand/company name                          |
| Call-to-action | Yes      | 15 chars   | Button text (e.g., "Install", "Learn More") |
| Icon           | Optional | 300x300px  | Small brand logo                            |
| Star Rating    | Optional | 0-5        | App ratings                                 |
| Store          | Optional | -          | App store name                              |
| Price          | Optional | -          | App price                                   |

### Template Configuration

1. **Go to Native Ad Styles**

   - Navigate to: `Delivery` → `Native` → `Native styles`

2. **Create New Style** (if needed)

   - Click `+ New native style`
   - **Style name**: `Highlights Carousel Style`
   - **Ad format**: Native Advanced

3. **Configure Required Fields**
   - Enable: Headline, Body, Image, Advertiser, Call-to-action
   - Set character limits as specified above
   - Set image dimensions: 1200x628px (16:9 aspect ratio)

---

## 💰 Step 3: Create Line Items

### Programmatic Line Item (Recommended)

1. **Create New Order**

   - Go to: `Delivery` → `Orders` → `+ New order`
   - **Order name**: `Native Ads - Highlights Carousel`
   - **Advertiser**: Select or create advertiser

2. **Create Line Item**

   - Click `+ New line item`
   - **Line item name**: `Highlights_Native_Programmatic`
   - **Line item type**: Price priority or Network
   - **Start/End dates**: Set campaign duration

3. **Configure Inventory**

   - **Targeting** → `Inventory`
   - Select the ad units created in Step 1:
     - `Highlights_Carousel_Native_iOS`
     - `Highlights_Carousel_Native_Android`

4. **Set Creative Requirements**

   - **Creative type**: Native
   - **Native ad format**: Native Advanced
   - **Size**: Fluid (responsive)

5. **Set Pricing**
   - **Rate**: Set your CPM/CPC rate
   - **Goal**: Set impressions or clicks target

### Direct Sold Line Item (Alternative)

For direct deals with advertisers:

1. **Line item type**: Sponsorship or Standard
2. **Priority**: 8-12 (depending on deal)
3. **Rate type**: CPM or Flat rate
4. **Delivery**: Even or As fast as possible

---

## 🎨 Step 4: Upload Creatives

### Native Creative Setup

1. **Create Native Creative**

   - Go to line item → `Creatives` → `+ New creative`
   - **Creative type**: Native
   - **Native format**: Native Advanced

2. **Upload Assets**

   - **Headline**: Enter ad headline (max 25 chars)
   - **Body**: Enter description (max 90 chars)
   - **Image**: Upload 1200x628px image
   - **Advertiser name**: Enter brand name
   - **Call-to-action**: Enter button text (e.g., "Install Now")
   - **Destination URL**: Enter landing page URL
   - **Icon** (optional): Upload 300x300px logo

3. **Preview Creative**

   - Use GAM's preview tool to verify all assets
   - Ensure text is readable and image quality is good

4. **Save and Associate**
   - Save creative
   - Associate with line item

---

## 🔧 Step 5: Provide Ad Unit IDs to Dev Team

### Information to Share

Create a document with:

```
PRODUCTION AD UNIT IDs

iOS:
- Ad Unit ID: ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY
- Ad Unit Name: Highlights_Carousel_Native_iOS

Android:
- Ad Unit ID: ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ
- Ad Unit Name: Highlights_Carousel_Native_Android

Test Mode: Currently enabled (using Google test IDs)
Action Required: Dev team will update config files with production IDs
```

### Configuration Files to Update

The dev team will update these files:

- `brands/cn/config.json` (CN brand)
- `brands/nt/config.json` (NT brand)

Example configuration:

```json
{
  "nativeAds": {
    "enabled": true,
    "testMode": false,
    "firstAdPosition": 4,
    "adFrequency": 5,
    "adUnitIds": {
      "ios": "ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY",
      "android": "ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ"
    }
  }
}
```

---

## 📊 Step 6: Monitoring and Optimization

### Key Metrics to Track

1. **Fill Rate**

   - Target: >80%
   - Monitor in GAM dashboard
   - Low fill rate? Check targeting and pricing

2. **Click-Through Rate (CTR)**

   - Benchmark: 0.5-2% for native ads
   - Optimize creative if CTR is low

3. **Viewability**

   - Target: >70%
   - Ads are in full-screen carousel (high viewability expected)

4. **Revenue**
   - Track eCPM (effective CPM)
   - Compare with other placements

### GAM Reports to Monitor

1. **Delivery Report**

   - Path: `Reports` → `Delivery`
   - Check: Impressions, clicks, CTR, fill rate

2. **Revenue Report**

   - Path: `Reports` → `Revenue`
   - Check: Revenue, eCPM, RPM

3. **Native Ad Performance**
   - Path: `Reports` → `Native`
   - Check: Asset performance, creative metrics

---

## 🧪 Testing Checklist

### Before Going Live

- [ ] Test ads load in development environment
- [ ] Verify all required assets display correctly
- [ ] Test click-through to landing page
- [ ] Verify AdChoices icon is clickable
- [ ] Check "Sponsored" badge is visible
- [ ] Test on both iOS and Android
- [ ] Verify analytics tracking works
- [ ] Check ad refresh behavior (should not auto-refresh)
- [ ] Test with different creative sizes
- [ ] Verify error handling (what happens if no fill)

### Test Ad Unit IDs

For testing, use Google's official test IDs:

- **iOS**: `ca-app-pub-3940256099942544/3986624511`
- **Android**: `ca-app-pub-3940256099942544/2247696110`

These are already configured in the app for testing.

---

## 🚨 Troubleshooting

### No Ads Showing

**Possible Causes:**

1. Ad unit IDs not configured correctly
2. Line items not active or paused
3. Targeting too restrictive
4. No creatives associated with line item
5. App not approved in AdMob

**Solutions:**

1. Verify ad unit IDs match in app config
2. Check line item status in GAM
3. Review targeting settings
4. Ensure creatives are approved and associated
5. Check app status in AdMob console

### Low Fill Rate

**Possible Causes:**

1. Limited demand for native ads
2. Pricing too high
3. Geographic targeting too narrow
4. Ad quality issues

**Solutions:**

1. Enable more demand sources (AdX, Open Bidding)
2. Adjust floor prices
3. Expand geographic targeting
4. Review creative quality and compliance

### Poor Performance

**Possible Causes:**

1. Creative not engaging
2. Poor image quality
3. Weak call-to-action
4. Irrelevant targeting

**Solutions:**

1. A/B test different creatives
2. Use high-quality images (1200x628px)
3. Test different CTA text
4. Refine audience targeting

---

## 📞 Support Contacts

### For GAM Issues

- **Google Ad Manager Support**: https://support.google.com/admanager
- **AdMob Support**: https://support.google.com/admob

### For App Integration Issues

- **Development Team**: [Your dev team contact]
- **Technical Documentation**: See `docs/native-ads-quick-start.md`

---

## 📚 Additional Resources

- [Google Ad Manager Native Ads Guide](https://support.google.com/admanager/answer/6366845)
- [Native Ads Best Practices](https://support.google.com/admanager/answer/6240809)
- [AdMob Native Ads Policy](https://support.google.com/admob/answer/6329638)
- [Native Ad Formats](https://support.google.com/admanager/answer/6366845)

---

## ✅ Quick Start Checklist

- [ ] Create iOS ad unit in GAM
- [ ] Create Android ad unit in GAM
- [ ] Note both ad unit IDs
- [ ] Configure native ad template
- [ ] Create order and line items
- [ ] Upload native creatives
- [ ] Test with test ad unit IDs
- [ ] Provide production ad unit IDs to dev team
- [ ] Monitor performance after launch
- [ ] Optimize based on metrics

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-02  
**Contact**: Ad Operations Team
