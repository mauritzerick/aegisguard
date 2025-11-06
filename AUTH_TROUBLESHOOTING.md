# Authentication Troubleshooting Guide

## Problem: "Your session has expired" even though logged in

---

## 🔍 **Quick Fixes (Try These First)**

### **1. Clear Browser Cookies & Cache**
```
Chrome/Edge:
1. Open DevTools (F12)
2. Go to Application tab
3. Left sidebar > Storage > Clear site data
4. Refresh page (Cmd+R / Ctrl+R)

Firefox:
1. Press Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)
2. Select "Cookies" and "Cache"
3. Click "Clear Now"
4. Refresh page

Safari:
1. Press Cmd+Option+E to clear cache
2. Preferences > Privacy > Manage Website Data > Remove All
3. Refresh page
```

### **2. Use Localhost (Not Network IP)**
```
❌ DON'T USE: http://192.168.4.69:5173
✅ USE THIS:  http://localhost:5173

Why? Cookies from localhost:3000 don't work with 192.168.x.x:5173
```

### **3. Hard Refresh**
```
Mac: Cmd + Shift + R
Windows: Ctrl + Shift + R
```

### **4. Try Incognito/Private Mode**
```
Chrome: Cmd+Shift+N / Ctrl+Shift+N
Firefox: Cmd+Shift+P / Ctrl+Shift+P
Safari: Cmd+Shift+N
```

---

## 🛠️ **New Features Added**

### **1. Auto Token Refresh**
The app now automatically tries to refresh your token when it expires.

### **2. Auto Redirect to Login**
If authentication fails, you'll be automatically redirected to login.

### **3. Auth Debug Widget** (Bottom-right corner)
Shows:
- ✓/✗ If cookies are present
- ✓/✗ If access token exists
- Cookie count
- View all cookies (expandable)

Colors:
- 🟢 Green = Authenticated (has access token)
- 🟠 Orange = Has cookies but no access token
- 🔴 Red = No cookies at all

---

## 📊 **Check Your Auth Status**

### **Look at the Debug Widget:**

**Good (Green):**
```
Auth Status
Cookies: ✓
Access Token: ✓
Count: 3
```

**Bad (Red):**
```
Auth Status
Cookies: ✗
Access Token: ✗
Count: 0
```

---

## 🔧 **Step-by-Step Fix**

### **Step 1: Check Debug Widget**
Look at bottom-right corner of any page.

**If it shows RED (no cookies):**
1. You're not logged in
2. Go to `/login`
3. Login again
4. Widget should turn GREEN

### **Step 2: Check Your URL**
Make sure you're using:
```
✅ http://localhost:5173
❌ http://192.168.4.69:5173
```

### **Step 3: Clear Everything**
```bash
# In browser DevTools Console (F12), paste this:
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "")
    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

# Then refresh the page
location.reload();
```

### **Step 4: Fresh Login**
1. Go to http://localhost:5173/login
2. Clear form if pre-filled
3. Enter: admin@aegis.local
4. Password: ChangeMeNow!123
5. Click "Sign In"
6. Should redirect to dashboard
7. Check debug widget - should be GREEN

### **Step 5: Test Users Page**
1. Click "Users" in navigation
2. Should load user table
3. If error, check debug widget
4. If RED, repeat Step 4

---

## 🐛 **Advanced Debugging**

### **Check Browser Console:**
```
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors:
   - 401 Unauthorized
   - CORS errors
   - Network errors
4. Screenshot and share if issues persist
```

### **Check Network Tab:**
```
1. Open DevTools (F12)
2. Go to Network tab
3. Try to load Users page
4. Look at the request to /users
5. Check:
   - Request Headers > Cookie (should have access_token)
   - Response Status (should be 200, not 401)
```

### **Check Cookies Manually:**
```
1. Open DevTools (F12)
2. Application tab > Cookies > http://localhost:5173
3. Should see:
   - access_token
   - refresh_token
   - csrf_token
4. If missing, you need to login again
```

---

## 💡 **Common Issues & Solutions**

### **Issue: Cookies disappear after refresh**
**Cause:** Using network IP instead of localhost  
**Fix:** Always use `http://localhost:5173`

### **Issue: "Session expired" immediately after login**
**Cause:** Cookie settings or CORS issue  
**Fix:** 
1. Clear all cookies
2. Use localhost (not network IP)
3. Login again

### **Issue: Works in Incognito but not regular browser**
**Cause:** Stale cookies or cache  
**Fix:** Clear cookies and cache in regular browser

### **Issue: Debug widget shows cookies but still 401**
**Cause:** Token expired  
**Fix:** App should auto-refresh. If not, clear cookies and login again.

### **Issue: Can't see debug widget**
**Cause:** It's in development mode only  
**Check:** Bottom-right corner of page

---

## 🔒 **Security Notes**

**Cookie Settings (Development):**
```
HttpOnly: Yes (access_token, refresh_token)
SameSite: Lax (allows cross-tab login)
Secure: No (works with HTTP in dev)
Domain: Not set (works across all localhost ports)
```

**Why this matters:**
- Cookies only work when frontend and backend are on compatible origins
- `localhost:5173` + `localhost:3000` = ✓ Compatible
- `192.168.x.x:5173` + `localhost:3000` = ✗ Incompatible

---

## 📝 **Manual Test**

Run this in your terminal to test auth:
```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aegis.local","password":"ChangeMeNow!123"}' \
  -c cookies.txt -v

# Should see: Set-Cookie headers

# Test protected endpoint
curl -X GET http://localhost:3000/users \
  -b cookies.txt

# Should return: JSON array of users
```

If this works but browser doesn't:
- Browser cookie issue
- Clear browser data and try again

---

## ✅ **Final Checklist**

Before reporting an issue:

- [ ] Using `http://localhost:5173` (not network IP)
- [ ] Cleared browser cookies and cache
- [ ] Tried hard refresh (Cmd+Shift+R)
- [ ] Checked debug widget (bottom-right)
- [ ] Tried incognito mode
- [ ] Logged in successfully (redirected to dashboard)
- [ ] Debug widget shows GREEN
- [ ] Still getting error on specific page

If all checked and still broken:
1. Screenshot the debug widget
2. Screenshot browser console errors
3. Screenshot network tab for /users request
4. Share for further help

---

**Last Updated:** October 30, 2025  
**Status:** Auth system working, auto-refresh enabled





