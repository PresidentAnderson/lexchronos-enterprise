# Troubleshooting Guide

Quick solutions to common issues in LexChronos.

## 🚨 Quick Help

**Need immediate assistance?**
- 🔴 **Critical Issues**: Email emergency@lexchronos.com
- 💬 **Live Chat**: Click the chat icon in your dashboard
- 📧 **Email Support**: support@lexchronos.com
- 📞 **Phone**: 1-800-LEXCHRO (Premium/Enterprise)

## 📋 Table of Contents

1. [Login & Account Issues](#login--account-issues)
2. [Performance Problems](#performance-problems)
3. [Document Issues](#document-issues)
4. [Mobile App Problems](#mobile-app-problems)
5. [Collaboration Issues](#collaboration-issues)
6. [Billing & Subscription](#billing--subscription)
7. [Integration Problems](#integration-problems)
8. [Data Sync Issues](#data-sync-issues)

## 🔐 Login & Account Issues

### Cannot Log In

**Problem**: Unable to access your LexChronos account

**Solutions:**

1. **Check Your Credentials**
   ```
   ✓ Verify email address is correct
   ✓ Ensure password is entered correctly
   ✓ Check for Caps Lock being enabled
   ✓ Try typing password in notepad first
   ```

2. **Reset Your Password**
   - Click "Forgot Password" on login page
   - Enter your email address
   - Check email for reset link (including spam folder)
   - Follow reset instructions

3. **Clear Browser Cache**
   ```bash
   # Chrome/Edge
   Ctrl+Shift+Delete → Clear browsing data
   
   # Firefox
   Ctrl+Shift+Delete → Clear recent history
   
   # Safari
   Cmd+Option+E → Empty caches
   ```

4. **Check Two-Factor Authentication**
   - Ensure your phone has correct time
   - Try generating new 2FA code
   - Use backup recovery codes if available

### Account Locked

**Problem**: Account temporarily locked due to multiple failed login attempts

**Solutions:**

1. **Wait for Auto-Unlock**
   - Accounts unlock automatically after 15 minutes
   - Do not attempt more logins during lockout

2. **Contact Support**
   - Email support@lexchronos.com with your email address
   - Include "Account Locked" in subject line
   - Provide approximate time of lockout

### Email Verification Issues

**Problem**: Cannot verify email address or didn't receive verification email

**Solutions:**

1. **Check Email Folders**
   - Look in spam/junk folders
   - Check promotions tab (Gmail)
   - Search for "lexchronos" in email

2. **Resend Verification**
   - Go to account settings
   - Click "Resend verification email"
   - Wait up to 10 minutes for delivery

3. **Email Server Issues**
   - Try different email address
   - Contact your IT department about email filters
   - Use personal email temporarily

## ⚡ Performance Problems

### Slow Loading Times

**Problem**: LexChronos takes too long to load or respond

**Solutions:**

1. **Check Internet Connection**
   ```bash
   # Test connection speed
   Visit: speedtest.net
   
   # Recommended minimum:
   Download: 10 Mbps
   Upload: 5 Mbps
   Latency: < 100ms
   ```

2. **Browser Optimization**
   ```
   ✓ Close unnecessary browser tabs
   ✓ Clear browser cache and cookies
   ✓ Disable unnecessary browser extensions
   ✓ Update browser to latest version
   ```

3. **Device Performance**
   - Close other applications
   - Check available RAM (minimum 4GB recommended)
   - Restart your device
   - Check for system updates

4. **Network Issues**
   - Switch to wired connection if using WiFi
   - Try different network (mobile hotspot)
   - Contact your ISP if persistent

### Browser Compatibility

**Problem**: Features not working properly in your browser

**Supported Browsers:**
- Chrome 90+ (Recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

**Solutions:**

1. **Update Browser**
   - Check for and install updates
   - Restart browser after updating

2. **Enable JavaScript**
   ```
   Chrome: Settings → Privacy and Security → Site Settings → JavaScript
   Firefox: about:config → javascript.enabled = true
   Safari: Preferences → Security → Enable JavaScript
   ```

3. **Disable Ad Blockers**
   - Temporarily disable ad blockers
   - Add lexchronos.com to whitelist
   - Try incognito/private browsing mode

## 📄 Document Issues

### Cannot Upload Documents

**Problem**: Document upload fails or gets stuck

**Solutions:**

1. **Check File Requirements**
   ```
   ✓ Maximum file size: 100MB
   ✓ Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG
   ✓ File name: No special characters (!@#$%^&*)
   ✓ File not corrupted or password protected
   ```

2. **Upload Troubleshooting**
   - Try smaller files first
   - Use different browser
   - Disable browser extensions
   - Check internet stability

3. **Alternative Methods**
   - Try mobile app upload
   - Use email-to-case feature
   - Contact support for large files

### Document Not Displaying

**Problem**: Documents appear broken or won't open

**Solutions:**

1. **Browser PDF Settings**
   ```
   Chrome: Settings → Advanced → Content → PDF documents
   Firefox: Options → Applications → PDF
   Safari: Preferences → Websites → PDF
   ```

2. **Clear Document Cache**
   - Refresh the page (F5 or Ctrl+R)
   - Hard refresh (Ctrl+Shift+R)
   - Clear browser cache

3. **Download and Open Locally**
   - Download document to computer
   - Open with appropriate application
   - Verify document is not corrupted

### OCR Not Working

**Problem**: Text extraction from scanned documents failing

**Solutions:**

1. **Document Quality**
   ```
   ✓ Image resolution: Minimum 300 DPI
   ✓ Text clarity: High contrast, legible text
   ✓ Orientation: Document right-side up
   ✓ Format: PDF, JPG, PNG
   ```

2. **Processing Time**
   - OCR can take 2-5 minutes for large documents
   - Check processing status in document list
   - Refresh page to see updated status

3. **Manual Re-processing**
   - Click "Reprocess OCR" in document menu
   - Try uploading higher quality scan
   - Contact support for persistent issues

## 📱 Mobile App Problems

### App Won't Start

**Problem**: Mobile app crashes on startup or won't open

**Solutions:**

1. **Basic Troubleshooting**
   ```
   ✓ Force close and restart app
   ✓ Restart your device
   ✓ Check for app updates
   ✓ Ensure sufficient storage space (1GB+ free)
   ```

2. **iOS Specific**
   ```
   Settings → General → iPhone Storage → LexChronos → Offload App
   Reinstall from App Store
   ```

3. **Android Specific**
   ```
   Settings → Apps → LexChronos → Storage → Clear Cache
   If persistent: Clear Data (will need to re-login)
   ```

### Sync Issues

**Problem**: Changes not syncing between devices

**Solutions:**

1. **Check Connectivity**
   - Ensure stable internet connection
   - Try switching between WiFi and cellular
   - Check if other apps are syncing

2. **Force Sync**
   - Pull down on main screen to refresh
   - Log out and log back in
   - Clear app cache (Android)

3. **Account Verification**
   - Ensure same account on all devices
   - Check subscription status
   - Verify account not suspended

### Camera Scanner Problems

**Problem**: Document scanner not working properly

**Solutions:**

1. **Camera Permissions**
   ```
   iOS: Settings → Privacy → Camera → LexChronos → Enable
   Android: Settings → Apps → LexChronos → Permissions → Camera → Allow
   ```

2. **Scanning Tips**
   ```
   ✓ Ensure good lighting
   ✓ Hold device steady
   ✓ Keep document flat
   ✓ Clean camera lens
   ```

3. **Alternative Methods**
   - Use device's built-in camera app
   - Upload from photo gallery
   - Use web browser upload

## 🤝 Collaboration Issues

### Real-Time Features Not Working

**Problem**: Live editing, chat, or presence indicators not functioning

**Solutions:**

1. **WebSocket Connection**
   - Check firewall settings
   - Ensure ports 80 and 443 are open
   - Try different network

2. **Browser Settings**
   - Disable VPN temporarily
   - Check browser extensions
   - Try incognito/private mode

3. **Network Restrictions**
   - Contact IT department about WebSocket blocking
   - Try mobile hotspot
   - Use mobile app as alternative

### Cannot See Team Members

**Problem**: Team members not appearing in collaboration features

**Solutions:**

1. **Permission Check**
   - Verify team members have case access
   - Check user roles and permissions
   - Ensure active subscription

2. **Invitation Status**
   - Check if invitations were accepted
   - Resend invitations if needed
   - Verify email addresses are correct

3. **Organization Settings**
   - Confirm users are in same organization
   - Check organization subscription status
   - Review user management settings

## 💳 Billing & Subscription

### Payment Failed

**Problem**: Payment declined or subscription suspended

**Solutions:**

1. **Payment Method**
   ```
   ✓ Check card expiration date
   ✓ Verify billing address
   ✓ Ensure sufficient funds
   ✓ Contact bank about transaction blocking
   ```

2. **Update Payment Information**
   - Go to Account → Billing
   - Add new payment method
   - Set as default
   - Retry payment

3. **Alternative Payment**
   - Try different credit card
   - Use PayPal (if available)
   - Contact support for manual payment

### Subscription Issues

**Problem**: Features suddenly unavailable or plan downgraded

**Solutions:**

1. **Check Subscription Status**
   - Go to Account → Subscription
   - Verify current plan and status
   - Check payment history

2. **Grace Period**
   - Account may be in grace period
   - Update payment method quickly
   - Contact billing support

3. **Plan Changes**
   - Verify intended plan changes
   - Check for accidental downgrades
   - Review change history

## 🔗 Integration Problems

### Email Integration Not Working

**Problem**: Emails not importing or syncing properly

**Solutions:**

1. **Re-authenticate**
   - Go to Settings → Integrations
   - Disconnect email account
   - Reconnect with fresh authentication
   - Test with new email

2. **Email Rules**
   - Check email filtering rules
   - Verify case tagging is correct
   - Test with simple subject line

3. **Provider Issues**
   ```
   Outlook: Check Microsoft 365 admin settings
   Gmail: Verify Google Workspace permissions
   ```

### Calendar Sync Issues

**Problem**: Court dates not appearing in calendar or vice versa

**Solutions:**

1. **Calendar Permissions**
   - Check calendar sharing settings
   - Verify write permissions
   - Test with new calendar event

2. **Sync Frequency**
   - Check sync settings (every 15 minutes)
   - Force manual sync
   - Allow time for propagation

3. **Time Zone Issues**
   - Verify time zones match
   - Check daylight saving settings
   - Confirm court date times

## 🔄 Data Sync Issues

### Changes Not Saving

**Problem**: Edits or new data not being saved

**Solutions:**

1. **Connection Check**
   - Verify internet connectivity
   - Check for network interruptions
   - Try refreshing the page

2. **Browser Issues**
   - Clear browser cache
   - Try different browser
   - Disable browser extensions

3. **Server Status**
   - Check status.lexchronos.com
   - Wait for maintenance completion
   - Contact support if widespread

### Data Missing

**Problem**: Cases, documents, or other data appears to be missing

**Solutions:**

1. **Search and Filters**
   - Clear all search filters
   - Check archived/closed items
   - Try different date ranges

2. **Permission Changes**
   - Verify you still have access permissions
   - Check with organization administrator
   - Review recent permission changes

3. **Account Verification**
   - Ensure logged into correct account
   - Check organization membership
   - Verify subscription status

## 🛠️ Advanced Troubleshooting

### Browser Console Errors

**For technical users:**

1. **Open Developer Tools**
   ```
   Chrome/Edge: F12 or Ctrl+Shift+I
   Firefox: F12 or Ctrl+Shift+K
   Safari: Cmd+Option+I
   ```

2. **Check Console Tab**
   - Look for red error messages
   - Copy error text for support
   - Note when errors occur

3. **Network Tab**
   - Check for failed requests
   - Look for 400/500 error codes
   - Monitor request timing

### System Requirements

**Minimum Requirements:**
```
Operating System:
- Windows 10 or later
- macOS 10.14 or later
- Linux (Ubuntu 18.04+)

Browser:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Hardware:
- RAM: 4GB minimum, 8GB recommended
- Storage: 1GB free space
- Internet: 10 Mbps download, 5 Mbps upload
```

## 📞 When to Contact Support

### Contact Support Immediately For:

- 🔴 **Data Loss**: Missing cases or documents
- 🔴 **Security Concerns**: Unauthorized access
- 🔴 **Payment Issues**: Billing problems
- 🔴 **System Outages**: Complete system unavailability

### Contact Information:

- **Emergency**: emergency@lexchronos.com
- **General Support**: support@lexchronos.com
- **Billing**: billing@lexchronos.com
- **Live Chat**: Available in application
- **Phone**: 1-800-LEXCHRO (Premium/Enterprise)

### Information to Include:

```
✓ Your email address
✓ Organization name
✓ Detailed description of issue
✓ Steps to reproduce problem
✓ Browser and version
✓ Operating system
✓ Screenshots (if applicable)
✓ Error messages (exact text)
```

## 🔍 Self-Help Resources

### Knowledge Base
- Comprehensive help articles
- Step-by-step tutorials
- Video demonstrations
- Feature guides

### Community Forum
- User discussions
- Best practices sharing
- Feature requests
- Peer support

### Status Page
- Real-time system status
- Maintenance notifications
- Historical uptime data
- Subscribe to updates

---

**Still need help?** Our support team is here to assist you. Contact us using the information above, and we'll resolve your issue quickly.