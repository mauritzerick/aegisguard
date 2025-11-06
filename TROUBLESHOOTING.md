# AegisGuard - Troubleshooting Guide

## Common Issues and Solutions

---

### 🔑 "Error loading API keys"

**Symptoms:**
- Red error banner on `/apikeys` page
- Message: "Error loading API keys"

**Possible Causes & Solutions:**

#### 1. **Not Logged In (401 Unauthorized)**
**Cause:** Your session has expired or you're not authenticated.

**Solution:**
- Click the "Go to Login" button shown in the error message
- Or manually go to `/login`
- Log in with: `admin@aegis.local` / `ChangeMeNow!123`

#### 2. **Permission Issue (403 Forbidden)**
**Cause:** Your user role doesn't have `apikeys:manage` or `apikeys:self` permission.

**Solution:**
- Ensure your user has the ADMIN role (has all permissions)
- Check roles in database: ADMIN should have `apikeys:manage` permission

#### 3. **Cookie Issues**
**Cause:** Cookies not being sent with requests (especially when accessing from network IP like `192.168.4.69:5173`).

**Solution:**
```bash
# Option 1: Access via localhost
http://localhost:5173

# Option 2: Clear browser cookies and log in again
# Go to Browser DevTools > Application > Cookies > Clear All
# Then log in again

# Option 3: Check if cookies are being set
# Browser DevTools > Application > Cookies
# Look for: access_token, refresh_token, csrf_token
```

#### 4. **CORS Issues**
**Cause:** Backend not allowing requests from your origin.

**Solution:**
- Backend is configured to allow `192.168.x.x:5173` in development
- If still failing, restart the API server:
```bash
cd /Users/mauritz/projects/aegisguard
pkill -f "ts-node-dev"
# Then run RUN.sh again
```

#### 5. **API Server Not Running**
**Cause:** Backend API is down.

**Solution:**
```bash
# Check if API is running
curl http://localhost:3000/health

# If not running, start it
cd /Users/mauritz/projects/aegisguard
./RUN.sh
```

---

### 🔍 **How to Debug**

#### Step 1: Check Browser Console
1. Open Browser DevTools (F12 or Cmd+Option+I)
2. Go to **Console** tab
3. Look for red errors
4. Common errors:
   - `401 Unauthorized` → Not logged in
   - `403 Forbidden` → No permission
   - `404 Not Found` → Wrong endpoint
   - `ERR_CONNECTION_REFUSED` → API server is down
   - `CORS error` → Origin not allowed

#### Step 2: Check Network Tab
1. Open Browser DevTools
2. Go to **Network** tab
3. Click on the failed request (red text)
4. Look at:
   - **Request Headers** → Are cookies being sent?
   - **Response** → What error message?
   - **Status Code** → 401, 403, 404, 500?

#### Step 3: Check Cookies
1. Browser DevTools > **Application** tab
2. Left sidebar > **Cookies** > `http://localhost:5173` or your IP
3. Should see:
   - `access_token` (JWT)
   - `refresh_token` (session)
   - `csrf_token` (CSRF protection)
4. If cookies are missing → Log in again

#### Step 4: Test API Directly
```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aegis.local","password":"ChangeMeNow!123"}' \
  -c /tmp/cookies.txt

# Test API Keys endpoint
curl -X GET http://localhost:3000/apikeys \
  -b /tmp/cookies.txt

# Should return: [...]  (array of API keys)
# If you get an error, the backend has an issue
```

---

### 🚨 **Other Common Issues**

#### **"Please log in again to view [resource]"**
- Your session expired (5 min for access token)
- **Solution:** Go to `/login` and log in again

#### **"You do not have permission to view [resource]"**
- Your user role lacks required permissions
- **Solution:** 
  - Use ADMIN account (`admin@aegis.local`)
  - Or grant permissions to your role in database

#### **"Failed to load [resource]. Please try refreshing the page."**
- Network or server error
- **Solution:**
  1. Refresh the page (Cmd+R or Ctrl+R)
  2. Check API server is running: `curl http://localhost:3000/health`
  3. Check browser console for specific error
  4. Restart servers if needed

#### **Empty Tables (No Data)**
- Not an error! Just means no data exists yet
- **Examples:**
  - API Keys: Create your first one
  - Security Events: No events ingested yet
  - Audit Logs: Will populate as you use the system

---

### 🔄 **Complete Reset (Nuclear Option)**

If nothing works, do a complete reset:

```bash
cd /Users/mauritz/projects/aegisguard

# 1. Stop everything
./STOP.sh
docker compose down

# 2. Clear database
rm -f dev.db

# 3. Restart everything
./RUN.sh
```

Wait for servers to start, then:
1. Go to `http://localhost:5173/login`
2. Log in with `admin@aegis.local` / `ChangeMeNow!123`
3. Try again

---

### 📊 **Check Service Status**

```bash
# Check Docker containers
docker ps
# Should see: aegisguard-postgres-1, aegisguard-redis-1

# Check API health
curl http://localhost:3000/health
# Should return: {"db":true,"redis":true}

# Check frontend
curl -I http://localhost:5173
# Should return: HTTP/1.1 200 OK

# Check running processes
ps aux | grep -E "(ts-node-dev|vite)" | grep -v grep
# Should see 2-3 processes
```

---

### 💡 **Tips**

1. **Always use `localhost:5173` first** - Most reliable for testing
2. **Check cookies** - Most auth issues are cookie-related
3. **Clear browser cache** - Sometimes helps with stale data
4. **Use incognito mode** - Clean slate for testing
5. **Check browser console FIRST** - Errors are usually clear there

---

### 📞 **Still Having Issues?**

If you've tried everything above:

1. **Check the API logs:**
   ```bash
   tail -f /Users/mauritz/projects/aegisguard/logs/api.log
   ```

2. **Check the web logs:**
   ```bash
   tail -f /Users/mauritz/projects/aegisguard/logs/web.log
   ```

3. **Look for error patterns** in the logs when you reproduce the issue

---

**Last Updated:** October 30, 2025





