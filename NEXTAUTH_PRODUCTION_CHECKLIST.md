# ✅ NextAuth & Google OAuth Production Deployment Checklist

## 🔒 1. Environment Variables (.env.production)

```bash
# Required NextAuth Variables
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=https://www.beanbuiltai.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## 🎯 2. Google OAuth Configuration

### Authorized JavaScript Origins:
- `https://www.beanbuiltai.com`
- `https://beanbuiltai.com` (if supporting both)

### Authorized Redirect URIs:
- `https://www.beanbuiltai.com/api/auth/callback/google`

## 🛠️ 3. Vercel Deployment Commands

```bash
# Pull environment variables
vercel env pull .env.production.local

# Deploy to production
vercel deploy --prod

# Force cache clear if needed
vercel --prod --force
```

## 🧪 4. Testing Checklist

| Test | Status | Notes |
|------|--------|-------|
| ✅ Sign in on incognito | ⬜ | Test first-time user flow |
| ✅ Sign in on mobile browser | ⬜ | Detect redirect or button issues |
| ✅ Log in, update progress, log out, log back in | ⬜ | Ensure plans + weight persist |
| ✅ Disable JS and test /dashboard | ⬜ | Ensure route guard fails gracefully |
| ✅ Check console for 404/405 errors | ⬜ | If yes, you're rendering HTML instead of JSON |

## 🔍 5. Debug Commands

### Test session endpoint:
```bash
curl -I https://www.beanbuiltai.com/api/auth/session
```

### Check NextAuth routes:
```bash
curl -I https://www.beanbuiltai.com/api/auth/providers
```

## 🚨 6. Common Issues & Solutions

### Issue: "Configuration" error
- **Solution**: Check NEXTAUTH_SECRET is set and valid

### Issue: OAuth callback errors
- **Solution**: Verify Google OAuth redirect URIs match exactly

### Issue: Session not persisting
- **Solution**: Check cookie domain settings in auth.ts

### Issue: Middleware redirecting /api/auth/*
- **Solution**: Ensure middleware excludes `/api/auth/` routes

## ✅ 7. Production Verification

After deployment, verify:

1. **NextAuth API routes work**:
   - `/api/auth/session` returns JSON
   - `/api/auth/providers` returns Google provider
   - `/api/auth/signin` redirects properly

2. **Authentication flow**:
   - Sign-in button triggers Google OAuth
   - Callback redirects to dashboard
   - Session persists across page reloads

3. **Mobile compatibility**:
   - Works on iOS Safari
   - Works on Android Chrome
   - Works in incognito/private mode

## 🎉 Success Criteria

✅ Google login works for all users and devices  
✅ Progress and plans save and restore correctly  
✅ Routing handles authentication properly  
✅ No console errors or 404/405 responses  
✅ Works in incognito mode and mobile browsers  

## 📞 Support Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [NextAuth.js GitHub Discussions](https://github.com/nextauthjs/next-auth/discussions)
- [Google OAuth Setup Guide](https://developers.google.com/identity/protocols/oauth2) 