# 🔐 NextAuth Production Configuration Guide

## 🎯 Overview

This guide ensures consistent login session behavior across all devices, including mobile and incognito browsers, with enhanced security and reliability.

## 🔧 Environment Variables

### **Required Production Variables**
```bash
# NextAuth Configuration
NEXTAUTH_URL="https://www.beanbuiltai.com"
NEXTAUTH_SECRET="your-super-secure-secret-key-here"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Database
DATABASE_URL="postgresql://..."

# Environment
NODE_ENV="production"
```

### **Critical Configuration Notes**

1. **NEXTAUTH_URL Must Include www**
   - ✅ Correct: `https://www.beanbuiltai.com`
   - ❌ Wrong: `https://beanbuiltai.com`

2. **Google OAuth Callback URLs**
   - Add both URLs in Google Console:
   - `https://www.beanbuiltai.com/api/auth/callback/google`
   - `https://beanbuiltai.com/api/auth/callback/google` (fallback)

## 🍪 Cookie Configuration

### **Production Cookie Settings**
```typescript
cookies: {
  sessionToken: {
    name: "__Secure-next-auth.session-token",
    options: {
      httpOnly: true,
      sameSite: "lax", // Critical for mobile compatibility
      path: "/",
      secure: true, // HTTPS only in production
      domain: ".beanbuiltai.com", // Allow subdomains
    },
  },
  callbackUrl: {
    name: "__Secure-next-auth.callback-url",
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
      domain: ".beanbuiltai.com",
    },
  },
  csrfToken: {
    name: "__Host-next-auth.csrf-token",
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
    },
  },
}
```

### **Why These Settings Matter**

- **`sameSite: "lax"`** - Essential for mobile browsers and cross-site navigation
- **`secure: true`** - HTTPS-only cookies for production security
- **`domain: ".beanbuiltai.com"`** - Allows cookies to work across subdomains
- **`__Secure-` prefix** - Additional security for production cookies
- **`__Host-` prefix** - Maximum security for CSRF tokens

## 🔄 Session Strategy

### **JWT Strategy Benefits**
```typescript
session: {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60, // 24 hours
}
```

**Advantages for Mobile/Incognito:**
- ✅ No database dependency for session validation
- ✅ Works in incognito/private browsing modes
- ✅ Faster session checks
- ✅ Better offline compatibility
- ✅ Reduced server load

## 📱 Mobile & Incognito Compatibility

### **Enhanced Session Loading**
```typescript
// Wait for session to fully load before any redirects
useEffect(() => {
  if (status !== 'loading') {
    setSessionChecked(true)
  }
}, [status])

// Only redirect after session is confirmed
useEffect(() => {
  if (sessionChecked && status === 'authenticated' && session?.user) {
    router.replace(targetUrl)
  }
}, [sessionChecked, status, session])
```

### **Enhanced Sign-In Flow**
```typescript
const result = await signIn(provider, { 
  callbackUrl: from,
  redirect: false // Manual redirect control
})

if (result?.url) {
  // Use window.location for reliable mobile redirects
  window.location.href = result.url
}
```

## 🛡️ Security Headers

### **Production Security Headers**
```typescript
// In middleware
response.headers.set('X-Frame-Options', 'DENY')
response.headers.set('X-Content-Type-Options', 'nosniff')
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
```

## 🧪 Testing Protocol

### **1. Desktop Browser Testing**
- [ ] Chrome (normal & incognito)
- [ ] Firefox (normal & private)
- [ ] Safari (normal & private)
- [ ] Edge (normal & InPrivate)

### **2. Mobile Browser Testing**
- [ ] iOS Safari (normal & private)
- [ ] iOS Chrome
- [ ] Android Chrome
- [ ] Android Firefox
- [ ] Samsung Internet

### **3. Cross-Device Testing**
- [ ] Sign in on desktop, access on mobile
- [ ] Sign in on mobile, access on desktop
- [ ] Multiple tabs/windows
- [ ] Network interruption recovery

### **4. Cookie-Disabled Testing**
- [ ] Browsers with third-party cookies disabled
- [ ] Strict privacy settings
- [ ] Ad blockers enabled
- [ ] VPN/proxy usage

## 🔍 Debugging Tools

### **Console Logging**
```typescript
// Enhanced session debugging
console.log('🔄 Session Status:', {
  status,
  hasSession: !!session,
  userId: session?.user?.id,
  onboarding: session?.user?.hasCompletedOnboarding,
  timestamp: new Date().toISOString()
})
```

### **Network Tab Monitoring**
- Watch for `/api/auth/session` calls
- Check cookie headers in requests
- Verify redirect responses (302/307)
- Monitor CORS headers

### **Application Tab Inspection**
- Verify cookies are set correctly
- Check cookie domain and path
- Confirm secure flags in production
- Validate expiration times

## 🚨 Common Issues & Solutions

### **Issue: Session Lost on Mobile**
**Cause:** Incorrect `sameSite` setting
**Solution:** Use `sameSite: "lax"` instead of `"strict"`

### **Issue: Infinite Redirect Loop**
**Cause:** Middleware redirecting before session loads
**Solution:** Wait for `status !== 'loading'` before redirects

### **Issue: Sign-in Fails in Incognito**
**Cause:** Third-party cookie blocking
**Solution:** Use first-party cookies with proper domain settings

### **Issue: Cross-Subdomain Problems**
**Cause:** Cookie domain not set correctly
**Solution:** Set `domain: ".beanbuiltai.com"` for subdomain sharing

## ✅ Production Checklist

### **Pre-Deployment**
- [ ] Environment variables set correctly
- [ ] Google OAuth URLs configured with www
- [ ] Cookie settings optimized for mobile
- [ ] Session loading properly handled
- [ ] Security headers configured

### **Post-Deployment**
- [ ] Test sign-in flow on multiple devices
- [ ] Verify session persistence across page refreshes
- [ ] Check mobile browser compatibility
- [ ] Test incognito/private browsing modes
- [ ] Monitor error rates and session failures

### **Monitoring**
- [ ] Set up alerts for authentication failures
- [ ] Monitor session duration and renewal
- [ ] Track mobile vs desktop success rates
- [ ] Watch for cookie-related errors

## 🎯 Expected Behavior

### **Successful Authentication Flow**
1. User clicks "Sign in with Google"
2. Redirected to Google OAuth
3. Google redirects back with authorization code
4. NextAuth exchanges code for tokens
5. JWT session token created and stored
6. User redirected to intended destination
7. Session persists across page refreshes
8. Works consistently across all devices

### **Session Persistence**
- ✅ 30-day session duration
- ✅ 24-hour refresh interval
- ✅ Survives browser restarts
- ✅ Works in incognito mode
- ✅ Cross-device compatibility
- ✅ Offline session validation

---

**🚀 With these configurations, BeanBuilt AI will have bulletproof authentication across all devices and browsers!** 