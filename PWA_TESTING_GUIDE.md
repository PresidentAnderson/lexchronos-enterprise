# LexChronos PWA Testing Guide

## Overview
This guide provides comprehensive instructions for testing the Progressive Web App (PWA) functionality of LexChronos on iOS and Android devices.

## Pre-Testing Setup

### Development Server
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Access the app via your mobile device using your computer's IP address:
   ```
   http://[YOUR_IP]:3000
   ```

### Production Testing
1. Build and deploy the application:
   ```bash
   npm run build
   npm run start
   ```

2. Access via HTTPS (required for PWA features):
   - Deploy to Vercel, Netlify, or similar
   - Or use ngrok for local testing: `ngrok http 3000`

## PWA Feature Testing Checklist

### 1. PWA Installation
#### iOS Safari (iOS 11.3+)
- [ ] Open app in Safari
- [ ] Tap Share button (📤)
- [ ] Tap "Add to Home Screen"
- [ ] Verify custom icon appears
- [ ] Verify splash screen on launch
- [ ] Test standalone mode (no Safari UI)

#### Android Chrome (Chrome 70+)
- [ ] Open app in Chrome
- [ ] Verify install banner appears
- [ ] Tap "Install" or "Add to Home Screen"
- [ ] Verify app opens in standalone mode
- [ ] Check app appears in app drawer
- [ ] Test uninstall process

#### Desktop Chrome/Edge
- [ ] Open app in Chrome/Edge
- [ ] Check for install button in address bar
- [ ] Click install button
- [ ] Verify desktop app opens
- [ ] Test window controls (minimize, maximize, close)

### 2. Offline Functionality
#### Service Worker Registration
- [ ] Open DevTools → Application → Service Workers
- [ ] Verify service worker is registered and active
- [ ] Check scope is set to "/"
- [ ] Verify service worker updates properly

#### Cache Storage
- [ ] Check DevTools → Application → Storage → Cache Storage
- [ ] Verify "lexchronos-v1" cache exists
- [ ] Confirm static assets are cached
- [ ] Test cache updates on new deployments

#### Offline Experience
- [ ] Load app while online
- [ ] Disconnect from internet
- [ ] Navigate to different pages
- [ ] Verify offline page appears for uncached routes
- [ ] Test form submissions while offline
- [ ] Reconnect and verify data syncs

### 3. Touch Gestures & Mobile UI
#### Timeline Touch Interactions
- [ ] Pinch to zoom in/out on timeline
- [ ] Two-finger pan around timeline
- [ ] Double-tap to reset zoom
- [ ] Single-finger swipe left/right
- [ ] Test on different screen sizes

#### General Touch Experience
- [ ] Tap targets are at least 44px × 44px
- [ ] Touch feedback is immediate
- [ ] Scroll momentum feels natural
- [ ] No accidental zooms on input focus
- [ ] Viewport meta tag prevents zooming

### 4. Camera Integration
#### iOS Camera Access
- [ ] Tap document scanner button
- [ ] Grant camera permissions when prompted
- [ ] Verify camera preview appears
- [ ] Test photo capture
- [ ] Verify flash/torch toggle works
- [ ] Test camera switching (front/back)
- [ ] Test file upload from gallery

#### Android Camera Access
- [ ] Same tests as iOS
- [ ] Additionally test with different camera apps
- [ ] Verify permissions persist after app restart
- [ ] Test with multiple camera lenses if available

### 5. Push Notifications
#### Permission Request
- [ ] Request notification permission
- [ ] Test on both granted and denied states
- [ ] Verify permission persists after app restart

#### Notification Display
- [ ] Send test notification
- [ ] Verify notification appears in system tray
- [ ] Test notification actions (if implemented)
- [ ] Test notification click behavior
- [ ] Verify notifications work when app is closed

#### Background Sync
- [ ] Make changes while offline
- [ ] Verify sync occurs when back online
- [ ] Test with poor network conditions
- [ ] Check sync queue in IndexedDB

### 6. Performance Testing
#### Core Web Vitals
- [ ] Run Lighthouse audit (PWA, Performance, Best Practices)
- [ ] Verify LCP (Largest Contentful Paint) < 2.5s
- [ ] Check FID (First Input Delay) < 100ms
- [ ] Measure CLS (Cumulative Layout Shift) < 0.1
- [ ] Test on slow networks (3G simulation)

#### Mobile-Specific Performance
- [ ] Test on older devices (2-3 years old)
- [ ] Monitor battery usage during extended use
- [ ] Check memory usage in DevTools
- [ ] Test with reduced motion preferences
- [ ] Verify app works on low battery mode

### 7. Network Conditions Testing
#### Connection Types
- [ ] Test on WiFi
- [ ] Test on 4G/LTE
- [ ] Test on 3G (Chrome DevTools simulation)
- [ ] Test on 2G (Chrome DevTools simulation)
- [ ] Test intermittent connectivity

#### Data Saving
- [ ] Enable "Data Saver" mode on Android
- [ ] Verify reduced quality images load
- [ ] Test with metered connections
- [ ] Check preloading behavior

### 8. Cross-Platform Testing
#### iOS Devices to Test
- [ ] iPhone SE (small screen)
- [ ] iPhone 12/13/14 (standard size)
- [ ] iPhone 14 Pro Max (large screen)
- [ ] iPad (tablet experience)
- [ ] Different iOS versions (14+)

#### Android Devices to Test
- [ ] Small screen device (< 5.5")
- [ ] Standard Android phone
- [ ] Large screen device (6.5"+)
- [ ] Tablet/foldable device
- [ ] Different Android versions (8+)

### 9. Security & Privacy
#### Permissions
- [ ] Camera access properly requested
- [ ] Location access (if implemented)
- [ ] Notification permissions
- [ ] Verify permissions can be revoked

#### Data Security
- [ ] HTTPS enforced
- [ ] Secure headers present
- [ ] No mixed content warnings
- [ ] Local storage encryption (sensitive data)

### 10. App Store Guidelines Compliance
#### iOS App Store
- [ ] App meets iOS Human Interface Guidelines
- [ ] No violations of App Store policies
- [ ] Proper handling of platform conventions

#### Google Play Store
- [ ] Meets Android Design Guidelines
- [ ] Complies with Play Store policies
- [ ] Proper Material Design implementation

## Testing Tools

### Browser DevTools
- **Chrome DevTools**: Application tab, Network tab, Performance tab
- **Safari Web Inspector**: Storage tab, Network tab
- **Firefox Developer Tools**: Application tab

### Online Testing Tools
- **Lighthouse**: https://developers.google.com/web/tools/lighthouse/
- **WebPageTest**: https://www.webpagetest.org/
- **PWA Builder**: https://www.pwabuilder.com/
- **Manifest Validator**: https://manifest-validator.appspot.com/

### Physical Device Testing
- **BrowserStack**: Cross-browser testing platform
- **Device Farm**: AWS, Firebase, or similar
- **Real devices**: Essential for accurate testing

## Common Issues & Solutions

### Installation Issues
- **Problem**: Install prompt doesn't appear
- **Solution**: Check HTTPS, manifest file, service worker registration

### Performance Issues
- **Problem**: Slow loading on mobile
- **Solution**: Optimize images, enable compression, lazy loading

### Camera Issues
- **Problem**: Camera not working
- **Solution**: Check HTTPS, permissions, device compatibility

### Offline Issues
- **Problem**: App doesn't work offline
- **Solution**: Verify service worker, check cache strategy

## Automated Testing Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Generate PWA icons
node scripts/generate-pwa-assets.js

# Convert SVG icons to PNG (requires imagemagick)
./scripts/convert-icons.sh
```

## Deployment Notes

### Vercel Deployment
1. Connect to Git repository
2. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
3. Add environment variables if needed
4. Deploy and test PWA functionality

### Custom Domain Setup
1. Configure custom domain
2. Ensure HTTPS is enabled
3. Update manifest.json with production URLs
4. Test all PWA features on production URL

## Performance Benchmarks

Target metrics for mobile devices:
- **Time to Interactive**: < 3.5s on 3G
- **First Contentful Paint**: < 2s
- **Speed Index**: < 4s
- **Bundle Size**: < 250KB gzipped
- **Lighthouse PWA Score**: 90+

## Final Checklist

Before considering PWA implementation complete:
- [ ] All features tested on iOS and Android
- [ ] Performance meets target benchmarks
- [ ] Offline functionality works reliably
- [ ] Camera integration functions properly
- [ ] Push notifications work correctly
- [ ] App can be installed on home screen
- [ ] Splash screens display correctly
- [ ] Touch gestures work smoothly
- [ ] Data syncs properly when back online
- [ ] Security headers are configured
- [ ] App passes Lighthouse PWA audit
- [ ] Cross-device compatibility verified
- [ ] User experience is native-like

## Support Information

For PWA-related issues:
1. Check browser compatibility
2. Verify HTTPS is enabled
3. Test on real devices, not just simulators
4. Monitor service worker lifecycle
5. Check network conditions
6. Validate manifest file
7. Test with different user permissions

Remember: PWA features require HTTPS in production and may have different behavior in development vs. production environments.