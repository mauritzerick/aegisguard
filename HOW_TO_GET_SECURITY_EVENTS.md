# 🚨 How to Get Security Events

## ✅ Problem Solved!

The security events were empty because the seed script needed to be run. **This is now fixed!**

---

## 📊 Current Status

After running the seed script, you now have:
- ✅ **10 Security Events** in your database
- ✅ Different severity levels (LOW, MEDIUM, HIGH, CRITICAL)
- ✅ Various event types (auth, network, malware, etc.)

---

## 🔄 How to See the Events

### **Option 1: Refresh Your Browser** (Recommended)
1. Go to the Security Events page: `http://localhost:5173/events`
2. Press **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows) to hard refresh
3. Events should now appear!

### **Option 2: Re-login**
1. Logout from the app
2. Login again with: `admin@aegis.local / ChangeMeNow!123`
3. Navigate to Security Events page
4. Events should be visible

---

## 🎯 What Events Were Created

### **Critical Events (2):**
```
🔴 auth.suspicious_login
   Login from TOR exit node (185.220.101.1)
   
🔴 network.port_scan_detected
   Port scan detected from 45.142.212.61
   Ports: 22, 80, 443, 3306, 5432
```

### **High Severity Events (2):**
```
🟠 auth.failed_login
   5 failed login attempts from 203.0.113.42
   Email: attacker@example.com
   
🟠 data.unauthorized_access
   User tried to access /users/private-data
   Source: 172.16.0.55
```

### **Medium Severity Events (2):**
```
🟡 api.rate_limit_exceeded
   150 requests (limit: 100)
   Endpoint: /api/events
   
🟡 auth.password_changed
   User changed password
   Source: 192.168.1.105
```

### **Low Severity Events (4):**
```
🟢 auth.mfa_enabled
   Analyst enabled MFA
   
🟢 api.key_created
   New API key "Production Integration" created
   
🟢 auth.session_expired
   Admin session expired
   
🟢 malware.file_upload_blocked
   Malicious file "suspicious.exe" blocked
```

---

## 🔧 How to Create More Events

### **Method 1: Use the Test Script** (Easy)
```bash
./create-test-events.sh
```

This will create 5 new test events instantly!

### **Method 2: Via API** (Manual)
```bash
curl -X POST http://localhost:3000/security-events/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "type": "auth.failed_login",
    "severity": "HIGH",
    "source": "192.168.1.100",
    "payload": {
      "email": "test@example.com",
      "attempts": 5
    }
  }'
```

### **Method 3: Trigger Real Events** (Advanced)
Events are automatically created when certain actions occur:
- **Failed Login** → Try logging in with wrong password 3 times
- **MFA Setup** → Enable MFA in settings
- **API Key Created** → Create a new API key
- **Password Changed** → (Feature to be implemented)

---

## 🛠️ Troubleshooting

### **Still Don't See Events?**

#### **1. Check if API is running:**
```bash
curl http://localhost:3000/health
```
Should return: `{"status":"ok"}`

#### **2. Check if you're logged in:**
- Look at bottom-right corner for Auth Debug widget
- Should show green: "Access Token: ✓"
- If red, go to `/login` and login again

#### **3. Check database directly:**
```bash
cd apps/api
npx prisma studio
```
- Opens database viewer in browser
- Click "SecurityEvent" table
- Should see 10 records

#### **4. Check browser console:**
- Press F12 to open DevTools
- Go to Console tab
- Look for any errors when loading /events page
- Common issues:
  - 401 Unauthorized → Re-login
  - 403 Forbidden → Your role doesn't have permission
  - 404 Not Found → API not running

#### **5. Re-seed the database:**
```bash
cd apps/api
npm run seed
```

---

## 📈 Event Details

### **Event Structure:**
```json
{
  "id": "clxyz123...",
  "type": "auth.failed_login",
  "severity": "HIGH",
  "source": "203.0.113.42",
  "payload": {
    "email": "attacker@example.com",
    "attempts": 5,
    "reason": "Invalid password"
  },
  "fingerprint": "5e884898da28047151d0e56f8dc6...",
  "receivedAt": "2025-10-30T10:30:00.000Z"
}
```

### **Available Severity Levels:**
- `CRITICAL` - Immediate action required
- `HIGH` - Significant threat
- `MEDIUM` - Potential issue
- `LOW` - Informational

### **Common Event Types:**
```
Authentication:
- auth.failed_login
- auth.suspicious_login
- auth.mfa_enabled
- auth.session_expired
- auth.password_changed

Network:
- network.port_scan_detected
- network.ddos_attempt
- network.suspicious_traffic

API:
- api.rate_limit_exceeded
- api.key_created
- api.key_revoked

Data:
- data.unauthorized_access
- data.bulk_export
- data.sensitive_access

Malware:
- malware.file_upload_blocked
- malware.signature_detected
- malware.ransomware_attempt
```

---

## 🎨 UI Features

### **Filtering:**
- Filter by **Type**: Show only specific event types
- Filter by **Severity**: Show only HIGH or CRITICAL events
- Combine filters for precise results

### **Event Details:**
- Click any event to expand
- View full payload data
- See exact timestamp
- Copy event ID

### **Visual Indicators:**
- 🔴 Red badge = CRITICAL
- 🟠 Orange badge = HIGH
- 🟡 Yellow badge = MEDIUM
- 🟢 Green badge = LOW

---

## 📊 Statistics

After seeding, your dashboard shows:
```
Total Events: 10
├─ CRITICAL: 2 (20%)
├─ HIGH:     2 (20%)
├─ MEDIUM:   2 (20%)
└─ LOW:      4 (40%)

By Type:
├─ Authentication: 5 events
├─ Network:        1 event
├─ API:            2 events
├─ Data:           1 event
└─ Malware:        1 event
```

---

## 🚀 Quick Commands

### **View all events:**
```bash
curl -X GET http://localhost:3000/security-events \
  -H "Cookie: access_token=YOUR_TOKEN"
```

### **Filter by severity:**
```bash
curl -X GET "http://localhost:3000/security-events?severity=CRITICAL" \
  -H "Cookie: access_token=YOUR_TOKEN"
```

### **Filter by type:**
```bash
curl -X GET "http://localhost:3000/security-events?type=auth.failed_login" \
  -H "Cookie: access_token=YOUR_TOKEN"
```

### **Create test event:**
```bash
./create-test-events.sh
```

### **Re-seed database:**
```bash
cd apps/api && npm run seed
```

---

## 🎯 Next Steps

1. ✅ **Verify events appear** in UI (`/events`)
2. ✅ **Try filtering** by severity and type
3. ✅ **Create new events** using the test script
4. ✅ **Explore event details** by clicking on them
5. ✅ **Read documentation** at `/docs` about how events work

---

## 💡 Pro Tips

### **Tip 1: Use the Test Script**
```bash
# Create 5 new test events instantly
./create-test-events.sh
```

### **Tip 2: Monitor in Real-time**
Keep the Events page open and run the test script in terminal.
Events will appear immediately!

### **Tip 3: Test Filtering**
1. Go to Events page
2. Click filter dropdown
3. Select "CRITICAL" severity
4. Should see only 2 events

### **Tip 4: Check Audit Logs**
Every event creation is also logged in Audit Logs!
Go to `/audit-logs` to see the trail.

### **Tip 5: Learn the Concepts**
Visit `/docs` and read the "Security Events" section to understand:
- How events are ingested
- HMAC signature verification
- Event processing flow
- Background job queue

---

## 🔐 Security Notes

### **Event Fingerprinting:**
Each event has a unique fingerprint to prevent duplicates:
```typescript
fingerprint = sha256(type + source + timestamp)
```

### **HMAC Signatures:**
In production, events require HMAC signatures:
```bash
curl -X POST http://localhost:3000/security-events/ingest \
  -H "X-Signature: sha256=abc123..." \
  -d '{"type":"...","severity":"..."}'
```

### **Rate Limiting:**
API endpoint is rate-limited to prevent abuse:
- Max 100 requests per minute per IP
- Max 1000 events per hour

---

## ✅ Checklist

Before reporting an issue:
- [ ] Ran seed script: `cd apps/api && npm run seed`
- [ ] Refreshed browser (Cmd+Shift+R)
- [ ] Verified API is running: `curl http://localhost:3000/health`
- [ ] Checked Auth Debug widget (bottom-right, should be green)
- [ ] Logged in as admin: `admin@aegis.local / ChangeMeNow!123`
- [ ] Checked browser console for errors (F12)
- [ ] Tried accessing `/events` page directly

---

**Last Updated:** October 30, 2025  
**Status:** ✅ Security events are now populated and visible!





