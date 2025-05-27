# 🧪 NextAuth Testing Guide - Cross-Device Compatibility

## 🎯 Testing Overview

This guide provides comprehensive testing protocols to ensure NextAuth works consistently across all devices, browsers, and scenarios, including mobile and incognito modes.

## 🔧 Pre-Testing Setup

### **Environment Variables to Verify**
```bash
# Verify these are set correctly in production
echo $NEXTAUTH_URL          # Should be: https://www.beanbuiltai.com
echo $NEXTAUTH_SECRET       # Should be: your-secret-key
echo $GOOGLE_CLIENT_ID      # Should be: your-google-client-id
echo $GOOGLE_CLIENT_SECRET  # Should be: your-google-client-secret
```

### **Google OAuth Console Setup**
1. **Authorized JavaScript Origins:**
   - `https://www.beanbuiltai.com`
   - `https://beanbuiltai.com` (fallback)

2. **Authorized Redirect URIs:**
   - `https://www.beanbuiltai.com/api/auth/callback/google`
   - `https://beanbuiltai.com/api/auth/callback/google` (fallback)

## 📱 Device & Browser Testing Matrix

### **Desktop Browsers**
| Browser | Normal Mode | Incognito/Private | Third-Party Cookies Disabled |
|---------|-------------|-------------------|------------------------------|
| Chrome  | ✅ Test     | ✅ Test          | ✅ Test                     |
| Firefox | ✅ Test     | ✅ Test          | ✅ Test                     |
| Safari  | ✅ Test     | ✅ Test          | ✅ Test                     |
| Edge    | ✅ Test     | ✅ Test          | ✅ Test                     |

### **Mobile Browsers**
| Browser | Normal Mode | Private Mode | Cross-Site Tracking Disabled |
|---------|-------------|--------------|------------------------------|
| iOS Safari | ✅ Test   | ✅ Test     | ✅ Test                     |
| iOS Chrome | ✅ Test   | ✅ Test     | ✅ Test                     |
| Android Chrome | ✅ Test | ✅ Test   | ✅ Test                     |
| Android Firefox | ✅ Test | ✅ Test  | ✅ Test                     |
| Samsung Internet | ✅ Test | ✅ Test | ✅ Test                     |

## 🧪 Test Scenarios

### **Test 1: Fresh User Sign-Up Flow**
**Objective:** Verify complete onboarding works from start to finish

**Steps:**
1. Clear all browser data (cookies, localStorage, sessionStorage)
2. Navigate to `https://www.beanbuiltai.com`
3. Click "Sign in with Google"
4. Complete Google OAuth flow
5. Complete onboarding form
6. Verify redirect to dashboard
7. Refresh page and verify session persists

**Expected Results:**
- ✅ Smooth OAuth flow without errors
- ✅ Session cookie set with correct domain
- ✅ Successful redirect to dashboard
- ✅ Session persists after page refresh
- ✅ No infinite redirect loops

**Console Logs to Watch:**
```
🚀 Initiating sign-in with provider: google
✅ Sign-in successful, redirecting to: /dashboard
🔄 StoreProvider: Creating profile from session data
✅ StoreProvider: Profile created with onboarding status: true
```

### **Test 2: Existing User Sign-In**
**Objective:** Verify returning users can sign in smoothly

**Steps:**
1. Clear browser data
2. Navigate to sign-in page
3. Sign in with existing Google account
4. Verify immediate redirect to dashboard
5. Check that all user data loads correctly

**Expected Results:**
- ✅ Immediate recognition of existing user
- ✅ Direct redirect to dashboard (no onboarding)
- ✅ All plans and progress data loads
- ✅ Session persists across tabs

### **Test 3: Session Persistence**
**Objective:** Verify sessions work across different scenarios

**Steps:**
1. Sign in normally
2. Open new tab - verify auto-login
3. Close browser completely
4. Reopen browser and navigate to site
5. Verify still logged in
6. Wait 25 hours and test session refresh

**Expected Results:**
- ✅ Auto-login in new tabs
- ✅ Session survives browser restart
- ✅ Session refreshes automatically after 24 hours
- ✅ Session expires after 30 days

### **Test 4: Mobile-Specific Testing**
**Objective:** Verify mobile browser compatibility

**Steps:**
1. Test on actual mobile devices (not just browser dev tools)
2. Test with mobile data vs WiFi
3. Test with poor network conditions
4. Test app-like behavior (add to home screen)
5. Test landscape/portrait orientation changes

**Expected Results:**
- ✅ Touch interactions work smoothly
- ✅ OAuth popup/redirect works on mobile
- ✅ Session persists through network changes
- ✅ Responsive design works correctly

### **Test 5: Incognito/Private Mode Testing**
**Objective:** Verify functionality in privacy modes

**Steps:**
1. Open incognito/private window
2. Navigate to site and sign in
3. Verify full functionality
4. Open another incognito tab
5. Verify session sharing within incognito session

**Expected Results:**
- ✅ Sign-in works in incognito mode
- ✅ Session persists within incognito session
- ✅ All features work normally
- ✅ Session properly isolated from normal browsing

### **Test 6: Cross-Device Testing**
**Objective:** Verify sessions work across different devices

**Steps:**
1. Sign in on desktop
2. Open site on mobile device
3. Verify need to sign in again (expected)
4. Sign in on mobile
5. Verify both sessions work independently

**Expected Results:**
- ✅ Independent sessions on different devices
- ✅ No interference between device sessions
- ✅ Both sessions persist correctly

### **Test 7: Network Interruption Testing**
**Objective:** Verify resilience to network issues

**Steps:**
1. Sign in normally
2. Disconnect internet during session
3. Reconnect and refresh page
4. Verify session recovery
5. Test with slow/intermittent connections

**Expected Results:**
- ✅ Graceful handling of network issues
- ✅ Session recovery after reconnection
- ✅ No data loss during interruptions

## 🔍 Debugging & Monitoring

### **Browser Developer Tools Checklist**

**Application Tab:**
- [ ] Session cookie present with correct name
- [ ] Cookie domain set to `.beanbuiltai.com`
- [ ] Cookie marked as `Secure` and `HttpOnly`
- [ ] Cookie `SameSite` set to `Lax`
- [ ] Cookie expiration ~30 days from creation

**Network Tab:**
- [ ] `/api/auth/session` calls return 200
- [ ] OAuth redirect URLs match configuration
- [ ] No CORS errors in console
- [ ] Proper redirect chains (302/307 responses)

**Console Tab:**
- [ ] No authentication errors
- [ ] Session loading logs appear correctly
- [ ] Profile creation logs show success
- [ ] No infinite redirect warnings

### **Key Metrics to Monitor**

**Success Rates:**
- Sign-in completion rate: >95%
- Session persistence rate: >99%
- Cross-browser compatibility: >95%
- Mobile compatibility: >90%

**Performance Metrics:**
- OAuth flow completion time: <10 seconds
- Session validation time: <500ms
- Page load after sign-in: <3 seconds

## 🚨 Common Issues & Troubleshooting

### **Issue: "Session callback URL mismatch"**
**Symptoms:** OAuth fails with callback URL error
**Solution:** Verify Google Console has both www and non-www URLs
**Test:** Check both `https://www.beanbuiltai.com/api/auth/callback/google` and `https://beanbuiltai.com/api/auth/callback/google`

### **Issue: "Session lost on mobile"**
**Symptoms:** User gets logged out frequently on mobile
**Solution:** Verify `sameSite: "lax"` in cookie configuration
**Test:** Check cookie settings in mobile browser dev tools

### **Issue: "Infinite redirect loop"**
**Symptoms:** Page keeps redirecting between auth and dashboard
**Solution:** Ensure middleware waits for session loading
**Test:** Check console for "Session loading..." logs

### **Issue: "Sign-in fails in incognito"**
**Symptoms:** OAuth doesn't work in private browsing
**Solution:** Verify first-party cookie configuration
**Test:** Check if cookies are being set in incognito mode

### **Issue: "Cross-subdomain problems"**
**Symptoms:** Session doesn't work across subdomains
**Solution:** Set cookie domain to `.beanbuiltai.com`
**Test:** Verify cookie domain in browser dev tools

## ✅ Testing Checklist

### **Pre-Production Testing**
- [ ] All desktop browsers tested (Chrome, Firefox, Safari, Edge)
- [ ] All mobile browsers tested (iOS Safari, Chrome, Android Chrome, Firefox)
- [ ] Incognito/private mode tested on all browsers
- [ ] Cross-device functionality verified
- [ ] Network interruption recovery tested
- [ ] Session persistence tested (24+ hours)
- [ ] Cookie settings verified in production environment

### **Production Monitoring**
- [ ] Authentication success rate monitoring
- [ ] Session duration tracking
- [ ] Mobile vs desktop performance comparison
- [ ] Error rate monitoring by browser/device
- [ ] OAuth callback success rate tracking

### **User Experience Validation**
- [ ] Sign-in flow is intuitive and fast
- [ ] No unexpected logouts during normal usage
- [ ] Consistent behavior across all devices
- [ ] Graceful error handling and recovery
- [ ] Clear feedback during authentication process

## 🎯 Success Criteria

**The NextAuth configuration is considered successful when:**

1. **Universal Compatibility:** Works on all major browsers and devices
2. **Reliable Sessions:** 99%+ session persistence rate
3. **Fast Authentication:** <10 second OAuth flow completion
4. **Mobile Optimized:** Smooth experience on mobile devices
5. **Privacy Compliant:** Works in incognito/private modes
6. **Resilient:** Handles network issues gracefully
7. **Secure:** Proper cookie security settings in production

---

**🚀 With this testing protocol, BeanBuilt AI's authentication will be bulletproof across all devices and scenarios!** 