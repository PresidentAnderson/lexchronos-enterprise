# Gmail SMTP Configuration for LexChronos

## Current Configuration
- **Email**: info@richereverydayineveryway.com
- **Password**: J0n8th8n (stored securely in Vercel)
- **SMTP Host**: smtp.gmail.com
- **SMTP Port**: 587
- **Security**: TLS/STARTTLS

## ⚠️ IMPORTANT: Gmail Security Requirements

### Option 1: Enable "Less Secure App Access" (Quick but Less Secure)
1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to Security
3. Scroll to "Less secure app access"
4. Turn ON "Allow less secure apps"

⚠️ **Note**: Google is phasing out this option. It may not be available for all accounts.

### Option 2: Use App-Specific Password (RECOMMENDED - More Secure)
This is the recommended approach for production applications:

1. **Enable 2-Factor Authentication**:
   - Go to: https://myaccount.google.com/security
   - Click on "2-Step Verification"
   - Follow the setup process

2. **Generate App-Specific Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other (Custom name)"
   - Enter: "LexChronos"
   - Click "Generate"
   - Copy the 16-character password (looks like: xxxx xxxx xxxx xxxx)

3. **Update Password in Vercel**:
   ```bash
   vercel env rm SMTP_PASS production --yes
   echo "your-16-char-app-password" | vercel env add SMTP_PASS production
   ```

### Option 3: Use Google Workspace (Best for Business)
If you have Google Workspace for your domain:
1. Admin Console → Apps → Google Workspace → Gmail
2. Enable SMTP relay service
3. Configure allowed senders

## Testing Email Configuration

### Test Endpoint
Once deployed, test your email configuration:
```
POST https://lexchronos-9ni8z8n36-axaiinovation.vercel.app/api/test-email
```

### Manual Test
```javascript
// Test in browser console
fetch('https://lexchronos-9ni8z8n36-axaiinovation.vercel.app/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'your-test-email@gmail.com',
    subject: 'Test Email from LexChronos',
    text: 'This is a test email'
  })
})
```

## Troubleshooting

### Common Issues:

1. **"Username and Password not accepted"**
   - Enable 2FA and use app-specific password
   - Check if "Less secure app access" is enabled
   - Verify credentials are correct

2. **"Please log in via your web browser"**
   - Google is blocking the login attempt
   - Sign in to Gmail from browser first
   - Complete any security challenges
   - Try using app-specific password

3. **Connection Timeout**
   - Check firewall settings
   - Verify SMTP settings (port 587, TLS)
   - Try port 465 with SSL if 587 doesn't work

4. **Daily Sending Limits**
   - Gmail Free: 500 emails/day
   - Google Workspace: 2,000 emails/day
   - Consider using SendGrid/Mailgun for high volume

## Alternative Email Services (If Gmail Issues Persist)

### SendGrid (Recommended for Production)
```bash
vercel env rm SMTP_HOST production --yes
vercel env rm SMTP_PORT production --yes
echo "smtp.sendgrid.net" | vercel env add SMTP_HOST production
echo "587" | vercel env add SMTP_PORT production
echo "apikey" | vercel env add SMTP_USER production
echo "your-sendgrid-api-key" | vercel env add SMTP_PASS production
```

### Mailgun
```bash
echo "smtp.mailgun.org" | vercel env add SMTP_HOST production
echo "587" | vercel env add SMTP_PORT production
```

### Amazon SES
```bash
echo "email-smtp.us-east-1.amazonaws.com" | vercel env add SMTP_HOST production
echo "587" | vercel env add SMTP_PORT production
```

## Current Environment Variables in Vercel
- ✅ SMTP_HOST=smtp.gmail.com
- ✅ SMTP_PORT=587
- ✅ SMTP_SECURE=false
- ✅ SMTP_USER=info@richereverydayineveryway.com
- ✅ SMTP_PASS=J0n8th8n
- ✅ FROM_NAME=LexChronos Legal
- ✅ FROM_EMAIL=info@richereverydayineveryway.com
- ✅ SUPPORT_EMAIL=support@richereverydayineveryway.com

## Security Notes
⚠️ **IMPORTANT**: 
- Never commit passwords to Git
- Use environment variables for all credentials
- Rotate passwords regularly
- Monitor for suspicious activity
- Consider using OAuth2 for better security

## Next Steps
1. Enable 2FA on your Google account
2. Generate an app-specific password
3. Update SMTP_PASS in Vercel with the app password
4. Test email sending functionality
5. Monitor email delivery rates