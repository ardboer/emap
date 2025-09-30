# Google Play Console Admin Setup Guide

This guide provides step-by-step instructions for the Google Play Console admin to set up everything needed for app publishing, including what information and access needs to be provided to the development team.

## 📋 Table of Contents

- [Overview](#overview)
- [Google Play Console Account Setup](#google-play-console-account-setup)
- [App Creation and Configuration](#app-creation-and-configuration)
- [Service Account Setup](#service-account-setup)
- [Team Access Management](#team-access-management)
- [Information to Provide to Development Team](#information-to-provide-to-development-team)
- [Ongoing Admin Responsibilities](#ongoing-admin-responsibilities)

## 🎯 Overview

### Admin Responsibilities

As the Google Play Console admin, you need to:

1. Set up the Google Play Console account
2. Create app entries for both Construction News and Nursing Times
3. Configure service accounts for automated deployment
4. Manage team access and permissions
5. Provide necessary information to the development team

### Apps to Create

- **Construction News**: Package name `metropolis.co.uk.constructionnews`
- **Nursing Times**: Package name `metropolis.net.nursingtimes`

## 🏪 Google Play Console Account Setup

### Step 1: Create Google Play Console Account

1. **Go to Google Play Console**

   - Visit: https://play.google.com/console/
   - Sign in with your Google account (use company account)

2. **Accept Developer Agreement**

   - Read and accept the Google Play Developer Distribution Agreement
   - Pay the one-time $25 registration fee

3. **Complete Account Setup**

   - **Developer name**: EMAP Publishing Ltd
   - **Website**: https://www.emappublishing.com (or appropriate company website)
   - **Contact email**: Use your company email
   - **Phone number**: Company phone number

4. **Verify Identity**
   - Complete identity verification if prompted
   - This may require government ID verification

### Step 2: Configure Account Settings

1. **Go to Setup → Account details**
2. **Complete all required fields**:

   - Developer name: EMAP Publishing Ltd
   - Website: Company website
   - Contact details: Company contact information
   - Developer address: Company address

3. **Set up payment profile** (if planning paid apps or in-app purchases)
   - Go to Setup → Payments profile
   - Add payment method and tax information

## 📱 App Creation and Configuration

### Step 1: Create Construction News App

1. **Create New App**

   - Click "Create app" button
   - **App name**: Construction News
   - **Default language**: English (United Kingdom)
   - **App or game**: App
   - **Free or paid**: Free
   - Click "Create app"

2. **Set Package Name**

   - **IMPORTANT**: Package name: `metropolis.co.uk.constructionnews`
   - **Note**: This cannot be changed later, ensure it's correct

3. **Complete App Information**
   - **Category**: News & Magazines
   - **Tags**: construction, news, industry
   - **Contact details**:
     - Email: support@constructionnews.co.uk
     - Phone: [Company phone]
     - Website: https://www.constructionnews.co.uk

### Step 2: Create Nursing Times App

1. **Create New App**

   - Click "Create app" button
   - **App name**: Nursing Times
   - **Default language**: English (United Kingdom)
   - **App or game**: App
   - **Free or paid**: Free
   - Click "Create app"

2. **Set Package Name**

   - **IMPORTANT**: Package name: `metropolis.net.nursingtimes`
   - **Note**: This cannot be changed later, ensure it's correct

3. **Complete App Information**
   - **Category**: Medical
   - **Tags**: nursing, healthcare, medical, times
   - **Contact details**:
     - Email: support@nursingtimes.net
     - Phone: [Company phone]
     - Website: https://www.nursingtimes.net

### Step 3: Configure App Content for Both Apps

For each app, complete the following sections:

1. **Privacy Policy**

   - Construction News: https://www.constructionnews.co.uk/privacy-policy
   - Nursing Times: https://www.nursingtimes.net/privacy-policy

2. **Data Safety**

   - Complete the data safety questionnaire
   - Indicate what data is collected and how it's used
   - Specify data sharing practices
   - Confirm data security practices

3. **Content Rating**

   - Complete the content rating questionnaire
   - Both apps should receive appropriate ratings for news/medical content

4. **Target Audience**
   - Select "Adults" as primary target audience
   - Complete any additional audience questions

## 🔐 Service Account Setup

### Step 1: Enable Google Play Console API

1. **Go to Google Cloud Console**

   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing project
   - **Project name**: EMAP Play Console API

2. **Enable API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Play Android Developer API"
   - Click on it and click "Enable"

### Step 2: Create Service Account

1. **Create Service Account**

   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - **Service account name**: emap-play-console-deployment
   - **Service account ID**: emap-play-console-deployment
   - **Description**: Service account for automated app deployment
   - Click "Create and Continue"

2. **Skip Role Assignment**

   - Click "Continue" (we'll set permissions in Play Console)
   - Click "Done"

3. **Generate JSON Key**
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Select "JSON" format
   - Click "Create"
   - **IMPORTANT**: Save this JSON file securely - you'll need to send it to the development team

### Step 3: Grant Permissions in Play Console

1. **Go to Play Console**

   - Navigate to Setup → API access
   - Click "Link Google Cloud Project"
   - Select your Google Cloud project
   - Click "Link project"

2. **Grant Service Account Access**
   - Find your service account in the list
   - Click "Grant access"
   - Select the following permissions:
     - **Release manager**: Can manage releases and edit store listing
     - **View app information**: Can view app information and download reports
   - **Apply to**: Select both Construction News and Nursing Times apps
   - Click "Invite user"

## 👥 Team Access Management

### Step 1: Add Development Team Members

1. **Go to Setup → Users and permissions**
2. **Click "Invite new users"**
3. **For each team member, provide**:
   - Email address
   - **Permissions**:
     - Release manager (for senior developers)
     - View app information (for all team members)
   - **App access**: Grant access to both Construction News and Nursing Times

### Step 2: Recommended Team Structure

- **Project Lead**: Admin access to everything
- **Senior Developers**: Release manager access
- **Developers**: View app information access
- **QA Team**: View app information access

## 📋 Information to Provide to Development Team

### Essential Information Package

Create a secure document with the following information and send to the development team:

#### 1. Service Account Information

```
Google Play Service Account JSON Key:
[Attach the JSON file downloaded in Step 2.3 above]

Service Account Email:
emap-play-console-deployment@[project-id].iam.gserviceaccount.com
```

#### 2. App Package Names

```
Construction News Package Name: metropolis.co.uk.constructionnews
Nursing Times Package Name: metropolis.net.nursingtimes
```

#### 3. Google Play Console Access

```
Play Console URL: https://play.google.com/console/
Developer Account: [Your Google account email]

Team members with access:
- [List team member emails and their permission levels]
```

#### 4. App Store URLs (once apps are created)

```
Construction News:
- Console: https://play.google.com/console/u/0/developers/[developer-id]/app/[app-id]
- Store: [Will be available after first release]

Nursing Times:
- Console: https://play.google.com/console/u/0/developers/[developer-id]/app/[app-id]
- Store: [Will be available after first release]
```

### Security Instructions for Development Team

Include these security instructions:

```
SECURITY REQUIREMENTS:
1. Store the service account JSON file securely
2. Never commit the JSON file to version control
3. Set restrictive file permissions: chmod 600 google-play-service-account.json
4. Use the JSON file only for automated deployment
5. Report any suspected security issues immediately

FILE LOCATION:
Place the JSON file at: ./fastlane/google-play-service-account.json
```

## 📧 Email Template for Development Team

Use this template to send information to your development team:

```
Subject: Google Play Console Setup Complete - Deployment Information

Hi Team,

I've completed the Google Play Console setup for both Construction News and Nursing Times apps. Here's everything you need for deployment:

APPS CREATED:
✅ Construction News (metropolis.co.uk.constructionnews)
✅ Nursing Times (metropolis.net.nursingtimes)

ATTACHED FILES:
📎 google-play-service-account.json (Service account key for automated deployment)

NEXT STEPS FOR DEVELOPMENT TEAM:
1. Place the JSON file at: ./fastlane/google-play-service-account.json
2. Set file permissions: chmod 600 ./fastlane/google-play-service-account.json
3. Update your .env.fastlane file with: GOOGLE_PLAY_JSON_KEY_PATH=./fastlane/google-play-service-account.json
4. Test the setup with: fastlane validate_env

PLAY CONSOLE ACCESS:
- URL: https://play.google.com/console/
- All team members have been granted appropriate access
- Check your email for invitation links

IMPORTANT SECURITY NOTES:
- Never commit the JSON file to version control
- Store it securely and restrict access
- Report any security concerns immediately

The apps are ready for your first internal test deployment. Let me know if you need any additional information or access.

Best regards,
[Your name]
[Your title]
[Contact information]
```

## 🔄 Ongoing Admin Responsibilities

### Weekly Tasks

- [ ] Monitor app review status
- [ ] Check for policy updates from Google
- [ ] Review team access and permissions
- [ ] Monitor app performance metrics

### Monthly Tasks

- [ ] Review service account access logs
- [ ] Update app information if needed
- [ ] Check for Google Play Console updates
- [ ] Review and update team permissions

### Quarterly Tasks

- [ ] Audit all team access
- [ ] Review app store optimization opportunities
- [ ] Update privacy policies if needed
- [ ] Plan for new features or apps

### Annual Tasks

- [ ] Renew service account keys
- [ ] Complete compliance reviews
- [ ] Update developer account information
- [ ] Review and update security practices

## 🚨 Important Notes and Warnings

### Critical Information

- **Package names cannot be changed** once apps are published
- **Service account JSON key** must be kept secure and never shared publicly
- **App names** can be changed later, but package names cannot
- **Developer account** must remain in good standing to publish apps

### Security Best Practices

- Use strong passwords and 2FA on all accounts
- Regularly audit team access and permissions
- Monitor for suspicious activity
- Keep service account keys secure and rotate annually

### Support Resources

- **Google Play Console Help**: https://support.google.com/googleplay/android-developer/
- **Google Cloud Console Help**: https://cloud.google.com/support
- **Developer Policy Center**: https://play.google.com/about/developer-content-policy/

---

**Created**: December 2024  
**Version**: 1.0  
**Next Review**: After first app deployment

This guide ensures the Google Play Console admin has everything needed to set up app publishing and provide the development team with all necessary information and access.
