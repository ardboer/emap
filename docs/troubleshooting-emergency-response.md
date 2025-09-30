# Troubleshooting and Emergency Response Guide

This comprehensive guide provides systematic troubleshooting procedures and emergency response protocols for the Construction News and Nursing Times deployment pipeline.

## 📋 Table of Contents

- [Overview](#overview)
- [Emergency Response Protocols](#emergency-response-protocols)
- [Build Issues Troubleshooting](#build-issues-troubleshooting)
- [Deployment Failures](#deployment-failures)
- [Credential Problems](#credential-problems)
- [Store Submission Issues](#store-submission-issues)
- [Performance Problems](#performance-problems)
- [Security Incidents](#security-incidents)
- [Recovery Procedures](#recovery-procedures)

## 🎯 Overview

### Incident Classification

**Critical (P0)**: Production apps down, security breach, data loss

- Response time: Immediate (< 15 minutes)
- Resolution time: < 2 hours

**High (P1)**: Deployment failures, build system down, certificate expired

- Response time: < 1 hour
- Resolution time: < 4 hours

**Medium (P2)**: Performance issues, non-critical feature failures

- Response time: < 4 hours
- Resolution time: < 24 hours

**Low (P3)**: Documentation issues, minor bugs, enhancement requests

- Response time: < 24 hours
- Resolution time: < 1 week

### Emergency Contacts

```bash
# Emergency contact information
TEAM_LEAD="[Team Lead Name] - [Phone] - [Email]"
DEVOPS_LEAD="[DevOps Lead Name] - [Phone] - [Email]"
SECURITY_TEAM="[Security Team] - [Phone] - [Email]"
APPLE_SUPPORT="Apple Developer Support - developer.apple.com/support"
GOOGLE_SUPPORT="Google Play Support - support.google.com/googleplay/android-developer"
EAS_SUPPORT="Expo Support - expo.dev/support"
```

## 🚨 Emergency Response Protocols

### Incident Response Workflow

```bash
#!/bin/bash
# incident-response.sh

INCIDENT_TYPE=${1:-"unknown"}
SEVERITY=${2:-"medium"}

echo "=== INCIDENT RESPONSE ACTIVATED ==="
echo "Type: $INCIDENT_TYPE"
echo "Severity: $SEVERITY"
echo "Time: $(date)"

# Step 1: Immediate assessment
echo ""
echo "STEP 1: IMMEDIATE ASSESSMENT"
echo "============================"
echo "[ ] Identify affected systems"
echo "[ ] Assess impact scope"
echo "[ ] Determine severity level"
echo "[ ] Notify appropriate team members"

# Step 2: Containment
echo ""
echo "STEP 2: CONTAINMENT"
echo "==================="
case $INCIDENT_TYPE in
    "security")
        echo "[ ] Isolate affected systems"
        echo "[ ] Revoke compromised credentials"
        echo "[ ] Block suspicious access"
        echo "[ ] Preserve evidence"
        ;;
    "deployment")
        echo "[ ] Stop ongoing deployments"
        echo "[ ] Rollback if necessary"
        echo "[ ] Isolate build environment"
        echo "[ ] Preserve logs"
        ;;
    "performance")
        echo "[ ] Monitor system resources"
        echo "[ ] Identify bottlenecks"
        echo "[ ] Scale resources if needed"
        echo "[ ] Implement temporary fixes"
        ;;
esac

# Step 3: Investigation
echo ""
echo "STEP 3: INVESTIGATION"
echo "===================="
echo "[ ] Collect relevant logs"
echo "[ ] Analyze error patterns"
echo "[ ] Identify root cause"
echo "[ ] Document findings"

# Step 4: Resolution
echo ""
echo "STEP 4: RESOLUTION"
echo "=================="
echo "[ ] Implement fix"
echo "[ ] Test solution"
echo "[ ] Deploy fix"
echo "[ ] Verify resolution"

# Step 5: Recovery
echo ""
echo "STEP 5: RECOVERY"
echo "================"
echo "[ ] Restore normal operations"
echo "[ ] Monitor for recurrence"
echo "[ ] Update documentation"
echo "[ ] Conduct post-incident review"

echo ""
echo "✅ Incident response protocol initiated"
echo "Follow each step systematically and document all actions"
```

### Critical Incident Checklist

**Immediate Actions (First 15 minutes):**

- [ ] Assess impact and severity
- [ ] Notify team lead and stakeholders
- [ ] Document incident start time
- [ ] Begin containment procedures
- [ ] Activate war room if needed

**Short-term Actions (First 2 hours):**

- [ ] Implement temporary fixes
- [ ] Communicate with affected users
- [ ] Escalate to appropriate teams
- [ ] Begin root cause analysis
- [ ] Prepare rollback plan

**Long-term Actions (First 24 hours):**

- [ ] Implement permanent fix
- [ ] Conduct post-incident review
- [ ] Update procedures and documentation
- [ ] Implement preventive measures
- [ ] Close incident with lessons learned

## 🏗️ Build Issues Troubleshooting

### EAS Build Failures

#### "Build failed to start"

**Symptoms:**

- Build never begins
- Error before compilation starts
- Configuration errors

**Diagnostic Steps:**

```bash
# Check EAS service status
curl -s https://status.expo.dev/api/v2/status.json | jq '.status.description'

# Verify project configuration
eas build:configure

# Check credentials
eas credentials:list --platform all

# Validate eas.json
jq empty eas.json
```

**Common Solutions:**

1. **Invalid eas.json:**

   ```bash
   # Validate JSON syntax
   jq empty eas.json

   # Fix syntax errors
   # Verify profile names match
   ```

2. **Missing credentials:**

   ```bash
   # Configure missing credentials
   eas credentials:configure --platform ios
   eas credentials:configure --platform android
   ```

3. **EAS service issues:**
   ```bash
   # Check service status
   # Wait for service restoration
   # Contact EAS support if needed
   ```

#### "Build failed during compilation"

**Symptoms:**

- Build starts but fails during compilation
- TypeScript errors
- Dependency issues

**Diagnostic Steps:**

```bash
# Get build logs
eas build:view BUILD_ID --logs

# Check for common issues
grep -i "error" build-logs.txt
grep -i "failed" build-logs.txt

# Local build test
npx expo run:ios --device
npx expo run:android --device
```

**Common Solutions:**

1. **TypeScript errors:**

   ```bash
   # Fix type errors locally
   npx tsc --noEmit

   # Update dependencies
   npm update
   ```

2. **Dependency conflicts:**

   ```bash
   # Clear and reinstall
   rm -rf node_modules package-lock.json
   npm install

   # Check for peer dependency issues
   npm ls
   ```

3. **Platform-specific issues:**
   ```bash
   # iOS: Check Xcode compatibility
   # Android: Check Java/Gradle versions
   # Update platform-specific dependencies
   ```

#### "Build succeeded but app crashes"

**Symptoms:**

- Build completes successfully
- App crashes on launch
- Runtime errors

**Diagnostic Steps:**

```bash
# Check app logs
# iOS: Xcode Console or Device Logs
# Android: adb logcat

# Test on different devices
# Check memory usage
# Verify all assets load correctly
```

**Common Solutions:**

1. **Missing assets:**

   ```bash
   # Verify all brand assets exist
   ls -la brands/cn/assets/
   ls -la brands/nt/assets/

   # Check asset references in config
   ```

2. **Memory issues:**

   ```bash
   # Optimize images
   # Reduce bundle size
   # Implement lazy loading
   ```

3. **Configuration errors:**
   ```bash
   # Verify brand configuration
   jq empty brands/cn/config.json
   jq empty brands/nt/config.json
   ```

### Build Performance Issues

#### "Builds taking too long"

**Diagnostic Steps:**

```bash
# Check build history
eas build:list --limit 10 --json | jq '.[] | {id, status, platform, createdAt, completedAt}'

# Analyze build times
# Compare with historical data
# Check for resource constraints
```

**Solutions:**

1. **Optimize dependencies:**

   ```bash
   # Remove unused dependencies
   npm prune

   # Use lighter alternatives
   # Implement code splitting
   ```

2. **Cache optimization:**
   ```bash
   # Clear build cache if needed
   # Optimize asset sizes
   # Use efficient build profiles
   ```

## 🚀 Deployment Failures

### Fastlane Deployment Issues

#### "Authentication failed"

**Symptoms:**

- Fastlane cannot authenticate
- API key errors
- Permission denied

**Diagnostic Steps:**

```bash
# Validate environment
fastlane validate_env

# Check credentials
ls -la fastlane/.env.fastlane
ls -la fastlane/AuthKey_*.p8
ls -la fastlane/google-play-service-account.json

# Test authentication
# iOS: Check Apple ID and 2FA
# Android: Test service account
```

**Solutions:**

1. **iOS authentication:**

   ```bash
   # Re-authenticate Apple ID
   # Generate new App Store Connect API key
   # Update .env.fastlane with new credentials
   ```

2. **Android authentication:**
   ```bash
   # Verify service account permissions
   # Generate new service account key
   # Update Google Play Console permissions
   ```

#### "Upload failed"

**Symptoms:**

- Build uploads but fails
- Store rejection
- File format issues

**Diagnostic Steps:**

```bash
# Check Fastlane logs
cat fastlane/report.xml

# Verify build artifacts
eas build:list --limit 1 --json | jq '.[0].artifacts'

# Check store requirements
```

**Solutions:**

1. **iOS upload issues:**

   ```bash
   # Verify IPA is valid
   # Check bundle ID matches
   # Ensure certificate is valid
   # Update provisioning profile
   ```

2. **Android upload issues:**
   ```bash
   # Verify AAB is valid
   # Check package name matches
   # Ensure keystore is correct
   # Update Play Console settings
   ```

### Store Submission Problems

#### "App Store rejection"

**Common Rejection Reasons:**

- Missing privacy policy
- Incomplete app information
- Binary issues
- Guideline violations

**Response Procedure:**

```bash
#!/bin/bash
# app-store-rejection-response.sh

echo "=== App Store Rejection Response ==="

echo "1. Review rejection details:"
echo "   [ ] Read rejection email carefully"
echo "   [ ] Identify specific issues"
echo "   [ ] Check App Store Connect for details"

echo ""
echo "2. Address each issue:"
echo "   [ ] Fix binary issues if any"
echo "   [ ] Update app information"
echo "   [ ] Add missing privacy policy"
echo "   [ ] Resolve guideline violations"

echo ""
echo "3. Resubmit process:"
echo "   [ ] Create new build if needed"
echo "   [ ] Update metadata"
echo "   [ ] Resubmit for review"
echo "   [ ] Monitor review status"

echo "✅ Rejection response procedure complete"
```

#### "Google Play rejection"

**Common Rejection Reasons:**

- Data safety section incomplete
- Content rating issues
- Policy violations
- Technical issues

**Response Procedure:**

```bash
#!/bin/bash
# play-store-rejection-response.sh

echo "=== Google Play Rejection Response ==="

echo "1. Review rejection details:"
echo "   [ ] Check Play Console notifications"
echo "   [ ] Review policy violation details"
echo "   [ ] Identify required changes"

echo ""
echo "2. Address each issue:"
echo "   [ ] Complete data safety section"
echo "   [ ] Update content rating"
echo "   [ ] Fix policy violations"
echo "   [ ] Resolve technical issues"

echo ""
echo "3. Resubmit process:"
echo "   [ ] Update app bundle if needed"
echo "   [ ] Complete store listing"
echo "   [ ] Resubmit for review"
echo "   [ ] Monitor review status"

echo "✅ Rejection response procedure complete"
```

## 🔐 Credential Problems

### Certificate Issues

#### "Certificate expired"

**Immediate Actions:**

```bash
#!/bin/bash
# certificate-expired-emergency.sh

echo "=== CERTIFICATE EXPIRED EMERGENCY ==="

echo "IMMEDIATE ACTIONS:"
echo "=================="
echo "1. Generate new certificate in Apple Developer Portal"
echo "2. Download and install new certificate"
echo "3. Update EAS credentials for all brands"
echo "4. Regenerate provisioning profiles"
echo "5. Test emergency build"

# Emergency certificate generation
echo ""
echo "Emergency certificate generation:"
echo "1. Go to developer.apple.com"
echo "2. Certificates, Identifiers & Profiles"
echo "3. Create new iOS Distribution certificate"
echo "4. Download and install"

# Update EAS credentials
echo ""
echo "Update EAS credentials:"
brands=("cn" "nt")
for brand in "${brands[@]}"; do
    echo "Brand: $brand"
    echo "export EXPO_PUBLIC_BRAND=$brand"
    echo "eas credentials:configure --platform ios"
done

echo ""
echo "⚠️  CRITICAL: Complete within 2 hours to avoid deployment disruption"
```

#### "Provisioning profile invalid"

**Diagnostic Steps:**

```bash
# Check provisioning profile status
eas credentials:list --platform ios --json | jq '.[] | select(.type=="ProvisioningProfile")'

# Verify bundle ID matches
# Check certificate inclusion
# Verify device list (if applicable)
```

**Solutions:**

```bash
# Regenerate provisioning profile
eas credentials:configure --platform ios
# Select "Generate new Provisioning Profile"

# Or update existing profile in Apple Developer Portal
# Download and update in EAS
```

### Keystore Issues

#### "Keystore corrupted or lost"

**Emergency Response:**

```bash
#!/bin/bash
# keystore-emergency.sh

echo "=== KEYSTORE EMERGENCY RESPONSE ==="

echo "⚠️  WARNING: Lost keystore means new app in Play Store"
echo "This will lose all existing users and reviews"

echo ""
echo "IMMEDIATE ACTIONS:"
echo "=================="
echo "1. Check all backup locations"
echo "2. Search entire system for keystore files"
echo "3. Contact team members for backups"
echo "4. Check encrypted storage/cloud backups"

# Search for keystore files
echo ""
echo "Searching for keystore files..."
find ~ -name "*.keystore" -type f 2>/dev/null
find ~ -name "*keystore*" -type f 2>/dev/null

echo ""
echo "If keystore cannot be recovered:"
echo "==============================="
echo "1. Create new keystore"
echo "2. Create new app in Google Play Console"
echo "3. Update EAS credentials"
echo "4. Plan user migration strategy"
echo "5. Communicate with stakeholders"

echo ""
echo "🚨 CRITICAL: Exhaust all recovery options before creating new app"
```

## 📱 Store Submission Issues

### App Store Connect Problems

#### "App not appearing in store"

**Diagnostic Steps:**

```bash
# Check App Store Connect status
echo "1. Verify app status in App Store Connect"
echo "2. Check release date and availability"
echo "3. Verify pricing and territories"
echo "4. Check app review status"
```

**Solutions:**

```bash
# Common fixes
echo "1. Ensure app is 'Ready for Sale'"
echo "2. Check availability in target countries"
echo "3. Verify pricing is set correctly"
echo "4. Wait for store propagation (up to 24 hours)"
```

### Google Play Console Problems

#### "App not visible in Play Store"

**Diagnostic Steps:**

```bash
# Check Play Console status
echo "1. Verify app is published"
echo "2. Check country availability"
echo "3. Verify device compatibility"
echo "4. Check content rating"
```

**Solutions:**

```bash
# Common fixes
echo "1. Ensure app is fully published"
echo "2. Check target API level requirements"
echo "3. Verify device compatibility settings"
echo "4. Wait for store indexing (up to 3 hours)"
```

## ⚡ Performance Problems

### Build Performance Issues

#### "Slow build times"

**Diagnostic Approach:**

```bash
#!/bin/bash
# build-performance-analysis.sh

echo "=== Build Performance Analysis ==="

# Analyze recent builds
echo "Recent build times:"
eas build:list --limit 10 --json | jq '.[] | {
    id,
    platform,
    status,
    createdAt,
    completedAt,
    duration: (if .completedAt and .createdAt then
        (.completedAt | fromdateiso8601) - (.createdAt | fromdateiso8601)
    else null end)
}'

# Check for patterns
echo ""
echo "Performance optimization checklist:"
echo "[ ] Remove unused dependencies"
echo "[ ] Optimize asset sizes"
echo "[ ] Use efficient build profiles"
echo "[ ] Clear build cache if needed"
echo "[ ] Check EAS service status"
```

### App Performance Issues

#### "App running slowly"

**Diagnostic Steps:**

```bash
# Performance profiling
echo "1. Profile app performance"
echo "2. Check memory usage"
echo "3. Analyze network requests"
echo "4. Review asset loading"
echo "5. Check for memory leaks"
```

**Optimization Strategies:**

```bash
# Performance improvements
echo "1. Optimize images and assets"
echo "2. Implement lazy loading"
echo "3. Reduce bundle size"
echo "4. Optimize API calls"
echo "5. Use performance monitoring tools"
```

## 🔒 Security Incidents

### Credential Compromise

#### "Credentials potentially compromised"

**Immediate Response:**

```bash
#!/bin/bash
# credential-compromise-response.sh

echo "=== CREDENTIAL COMPROMISE RESPONSE ==="

echo "IMMEDIATE ACTIONS (within 15 minutes):"
echo "======================================"
echo "1. Revoke compromised credentials immediately"
echo "2. Change all related passwords"
echo "3. Enable additional security measures"
echo "4. Audit access logs"
echo "5. Notify security team"

echo ""
echo "iOS Credential Response:"
echo "======================="
echo "1. Revoke certificates in Apple Developer Portal"
echo "2. Generate new certificates"
echo "3. Update all provisioning profiles"
echo "4. Update EAS credentials"
echo "5. Force new builds"

echo ""
echo "Android Credential Response:"
echo "==========================="
echo "1. Disable compromised service account"
echo "2. Create new service account"
echo "3. Update Google Play Console permissions"
echo "4. Update Fastlane configuration"
echo "5. Test new credentials"

echo ""
echo "🚨 CRITICAL: Complete credential rotation within 2 hours"
```

### Unauthorized Access

#### "Suspicious account activity"

**Investigation Steps:**

```bash
#!/bin/bash
# security-investigation.sh

echo "=== Security Investigation ==="

echo "1. Audit access logs:"
echo "   [ ] Apple Developer Portal access logs"
echo "   [ ] Google Play Console access logs"
echo "   [ ] EAS dashboard access logs"
echo "   [ ] GitHub repository access logs"

echo ""
echo "2. Check for unauthorized changes:"
echo "   [ ] Certificate modifications"
echo "   [ ] App configuration changes"
echo "   [ ] Team member additions/removals"
echo "   [ ] Permission changes"

echo ""
echo "3. Secure accounts:"
echo "   [ ] Force password resets"
echo "   [ ] Enable 2FA on all accounts"
echo "   [ ] Review team member access"
echo "   [ ] Update security policies"

echo "✅ Security investigation complete"
```

## 🔄 Recovery Procedures

### System Recovery

#### "Complete system failure"

**Recovery Steps:**

```bash
#!/bin/bash
# system-recovery.sh

echo "=== SYSTEM RECOVERY PROCEDURE ==="

echo "Phase 1: Assessment"
echo "=================="
echo "[ ] Identify scope of failure"
echo "[ ] Check backup availability"
echo "[ ] Assess data integrity"
echo "[ ] Determine recovery strategy"

echo ""
echo "Phase 2: Environment Restoration"
echo "==============================="
echo "[ ] Restore development environment"
echo "[ ] Reinstall required tools"
echo "[ ] Restore project files from backup"
echo "[ ] Verify project integrity"

echo ""
echo "Phase 3: Credential Restoration"
echo "==============================="
echo "[ ] Restore certificates from backup"
echo "[ ] Restore keystores from backup"
echo "[ ] Reconfigure EAS credentials"
echo "[ ] Test credential functionality"

echo ""
echo "Phase 4: Service Restoration"
echo "==========================="
echo "[ ] Restore build pipeline"
echo "[ ] Restore deployment automation"
echo "[ ] Test end-to-end workflow"
echo "[ ] Verify all brands work correctly"

echo ""
echo "Phase 5: Validation"
echo "=================="
echo "[ ] Run comprehensive tests"
echo "[ ] Verify all functionality"
echo "[ ] Check security measures"
echo "[ ] Document recovery process"

echo "✅ System recovery procedure complete"
```

### Data Recovery

#### "Configuration data lost"

**Recovery Steps:**

```bash
#!/bin/bash
# data-recovery.sh

echo "=== DATA RECOVERY PROCEDURE ==="

# Check Git history
echo "1. Check Git repository:"
git log --oneline -10
git status

# Restore from backups
echo ""
echo "2. Restore from backups:"
echo "[ ] Check automated backups"
echo "[ ] Restore from cloud storage"
echo "[ ] Recover from team member copies"

# Rebuild configurations
echo ""
echo "3. Rebuild if necessary:"
echo "[ ] Recreate brand configurations"
echo "[ ] Restore EAS configuration"
echo "[ ] Rebuild Fastlane setup"
echo "[ ] Restore deployment scripts"

echo "✅ Data recovery procedure complete"
```

## 📞 Escalation Procedures

### When to Escalate

**Escalate Immediately:**

- Security breaches
- Data loss
- Complete system failure
- Certificate/keystore loss
- Store account suspension

**Escalate Within 1 Hour:**

- Deployment pipeline failure
- Build system down
- Multiple build failures
- Performance degradation

**Escalate Within 4 Hours:**

- Single build failures
- Store submission issues
- Non-critical feature failures

### Escalation Contacts

```bash
# Escalation matrix
echo "=== ESCALATION MATRIX ==="

echo "Level 1: Team Lead"
echo "=================="
echo "- All P1 and P0 incidents"
echo "- Multiple P2 incidents"
echo "- Security concerns"

echo ""
echo "Level 2: Engineering Manager"
echo "=========================="
echo "- P0 incidents"
echo "- Security breaches"
echo "- Business impact issues"

echo ""
echo "Level 3: CTO/VP Engineering"
echo "=========================="
echo "- Critical security breaches"
echo "- Major business impact"
echo "- Legal/compliance issues"

echo ""
echo "External Escalation:"
echo "==================="
echo "- Apple Developer Support"
echo "- Google Play Support"
echo "- EAS/Expo Support"
echo "- Security incident response team"
```

## 📊 Post-Incident Procedures

### Post-Incident Review

```bash
#!/bin/bash
# post-incident-review.sh

INCIDENT_ID=${1:-"INC-$(date +%Y%m%d-%H%M)"}

echo "=== POST-INCIDENT REVIEW ==="
echo "Incident ID: $INCIDENT_ID"

# Create incident report
cat > "incident-report-$INCIDENT_ID.md" << EOF
# Incident Report - $INCIDENT_ID

**Date**: $(date)
**Duration**: [Start time] - [End time]
**Severity**: [P0/P1/P2/P3]
**Impact**: [Description of impact]

## Summary
[Brief description of what happened]

## Timeline
- [Time]: [Event description]
- [Time]: [Event description]
- [Time]: [Event description]

## Root Cause
[Detailed analysis of what caused the incident]

## Resolution
[How the incident was resolved]

## Lessons Learned
- [Lesson 1]
- [Lesson 2]
- [Lesson 3]

## Action Items
- [ ] [Action item 1] - [Owner] - [Due date]
- [ ] [Action item 2] - [Owner] - [Due date]
- [ ] [Action item 3] - [Owner] - [Due date]

## Prevention Measures
[What will be done to prevent similar incidents]

EOF

echo "✅ Incident report template created: incident-report-$INCIDENT_ID.md"
echo "Please complete all sections and share with the team"
```

### Continuous Improvement

- [ ] **Regular Reviews**: Monthly incident review meetings
- [ ] **Process Updates**: Update procedures based on lessons learned
- [ ] **Training**: Conduct incident response training
- [ ] **Documentation**: Keep troubleshooting guides current
- [ ] **Automation**: Automate common recovery procedures
- [ ] **Monitoring**: Improve monitoring and alerting

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Next Review**: After each major incident

This comprehensive troubleshooting and emergency response guide ensures rapid resolution of issues and minimal disruption to the Construction News and Nursing Times deployment pipeline.
