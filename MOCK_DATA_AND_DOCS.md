# 🎉 Mock Data & Documentation Page

## ✅ What's New

### 1. **Comprehensive Mock Data** 
The seed script now creates realistic demo data for all services!

### 2. **Hidden Documentation Page**
A new `/docs` page teaches backend concepts with real code examples!

---

## 📊 Mock Data Summary

### **What Gets Created:**

#### 👥 **Users (3)**
```
1. admin@aegis.local / ChangeMeNow!123
   Role: ADMIN
   MFA: Disabled
   
2. analyst@aegis.local / Analyst123!
   Role: ANALYST
   MFA: Enabled (demo secret)
   
3. user@aegis.local / User123!
   Role: USER
   MFA: Disabled
```

#### 🔑 **API Keys (3)**
```
1. Production Integration
   Owner: Admin
   Scopes: events:read, audit:read
   
2. Development Testing
   Owner: Analyst
   Scopes: events:read
   
3. Monitoring Dashboard
   Owner: Admin
   Scopes: events:read
```

#### 🚨 **Security Events (10)**
```
1. auth.failed_login (HIGH)
   - Failed login from 203.0.113.42
   - 5 attempts for attacker@example.com
   
2. auth.mfa_enabled (LOW)
   - Analyst enabled MFA
   
3. api.rate_limit_exceeded (MEDIUM)
   - Too many requests from 198.51.100.23
   
4. auth.suspicious_login (CRITICAL)
   - Login from TOR exit node
   
5. data.unauthorized_access (HIGH)
   - User tried to access private data
   
6. api.key_created (LOW)
   - New API key created
   
7. auth.password_changed (MEDIUM)
   - User changed password
   
8. network.port_scan_detected (CRITICAL)
   - Port scan from 45.142.212.61
   
9. malware.file_upload_blocked (CRITICAL)
   - Malicious file "suspicious.exe" blocked
   
10. auth.session_expired (LOW)
    - Admin session expired
```

#### 📜 **Audit Logs (8)**
```
1. auth.login - Admin logged in
2. user.create - Admin created new user
3. user.role_update - Admin changed user role
4. apikey.create - Admin created API key
5. apikey.revoke - Admin revoked old key
6. auth.mfa_setup - Analyst set up MFA
7. auth.logout - Admin logged out
8. security.event_analyzed - Analyst reviewed event
```

#### 🌐 **IP Allowlist (2)**
```
1. 192.168.1.100 (Admin's IP)
2. 10.0.0.0/8 (Internal network)
```

---

## 🎓 Documentation Page

### **Access:** 
Navigate to **`http://localhost:5173/docs`**

### **Features:**
- 📚 Interactive sidebar navigation
- 🎨 Clean, readable formatting
- 💻 Code examples with syntax highlighting
- 📖 Plain English explanations
- 🔍 Real code from the project

### **Topics Covered:**

#### **1. Overview** 📚
- System architecture diagram
- Request flow example
- Key concepts introduction
- Code organization

#### **2. Authentication** 🔐
- Password hashing (Argon2)
- JWT tokens explained
- Cookies vs localStorage
- Token refresh flow
- CSRF protection

#### **3. Authorization (RBAC)** 🛡️
- Roles and permissions
- How guards work
- RBAC guard flow diagram
- Real-world examples

#### **4. API Keys** 🔑
- API key generation
- Why hash API keys
- Scope-based permissions
- ApiKey guard code

#### **5. Security Events** 🚨
- Event structure
- Ingestion flow
- HMAC signature verification
- Severity levels

#### **6. Audit Logs** 📜
- What gets logged
- Why audit logs matter
- Best practices
- Real-world scenarios

#### **More Sections Coming:**
- Multi-Factor Authentication
- Sessions
- Middleware & Guards
- Database (Prisma)
- Background Jobs (BullMQ)
- Validation

---

## 🚀 How to Use Mock Data

### **1. Re-seed the Database**
```bash
# Stop services
./STOP.sh

# Run RUN.sh which includes seeding
./RUN.sh

# Or manually:
cd apps/api
npm run seed
```

### **2. View Mock Data in UI**

**Users Page:**
- See 3 demo users with different roles
- MFA status displayed
- Try CRUD operations

**API Keys Page:**
- See 3 existing API keys
- Try creating new ones
- Try revoking them

**Security Events Page:**
- 10 diverse security events
- Different severity levels
- Filter by type and severity
- Expandable payloads

**Audit Logs Page:**
- 8 different audit log types
- Color-coded action badges
- Actor identification
- Full metadata

**Dashboard:**
- Summary statistics
- Quick overview cards

---

## 📖 How to Use Documentation Page

### **1. Access the Page**
```
http://localhost:5173/docs
```

*Note: The `/docs` link is hidden - not shown in navigation.  
You must type the URL directly or bookmark it.*

### **2. Navigate Topics**
- Click any topic in the sidebar
- Read explanations
- Study code examples
- Understand the flow diagrams

### **3. Learn Backend Concepts**

**For Beginners:**
1. Start with "Overview"
2. Then "Authentication"
3. Then "Authorization"
4. Work through other topics

**For Experienced Developers:**
- Jump to specific topics
- Review implementation details
- See security best practices

---

## 💡 Real-World Use Cases

### **Demo to Clients:**
```
1. Show Security Events page
   → "See how we track threats in real-time"
   
2. Show Audit Logs page
   → "Every action is logged for compliance"
   
3. Show Users page
   → "Role-based access control"
   
4. Show API Keys page
   → "Secure programmatic access"
```

### **Training New Developers:**
```
1. Have them read /docs
2. Show them the corresponding code
3. Let them experiment with mock data
4. Explain security concepts with real examples
```

### **Testing:**
```
1. Use mock data to test UI
2. Filter security events by severity
3. Try different user roles
4. Test CRUD operations
```

---

## 🔍 Mock Data Examples

### **Security Event Example:**
```json
{
  "type": "auth.suspicious_login",
  "severity": "CRITICAL",
  "source": "185.220.101.1",
  "payload": {
    "reason": "Login from TOR exit node",
    "email": "admin@aegis.local"
  },
  "analyzed": true,
  "createdAt": "2025-10-30T10:30:00Z"
}
```

### **Audit Log Example:**
```json
{
  "action": "user.role_update",
  "resource": "user_123",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Macintosh...)",
  "actorUserId": "admin_456",
  "meta": {
    "from": "USER",
    "to": "ANALYST",
    "reason": "Promotion"
  },
  "createdAt": "2025-10-30T11:00:00Z"
}
```

### **API Key Example:**
```json
{
  "name": "Production Integration",
  "hash": "5e884898da28047151d0e56f8dc6...",
  "scopes": ["events:read", "audit:read"],
  "userId": "admin_123",
  "createdAt": "2025-10-29T10:00:00Z",
  "revokedAt": null
}
```

---

## 🎨 Visual Preview

### **Docs Page Layout:**
```
┌──────────────────────────────────────────────────┐
│  [Navbar]                                        │
├────────────┬─────────────────────────────────────┤
│            │                                     │
│  Sidebar   │      Content Area                   │
│            │                                     │
│  📚 Overview│  # Authentication                  │
│  🔐 Auth    │  Explanation of authentication...  │
│  🛡️ RBAC   │                                     │
│  🔑 API Keys│  ```typescript                     │
│  🚨 Events  │  // Code example                   │
│  📜 Audit   │  const hash = await argon2.hash()  │
│  🔒 MFA     │  ```                               │
│  ⏱️ Sessions│                                     │
│  🛠️ Guards  │  [Diagrams and explanations]       │
│  💾 Database│                                     │
│  📤 Queue   │                                     │
│  ✅ Validation                                   │
│            │                                     │
└────────────┴─────────────────────────────────────┘
```

### **Security Events Page with Mock Data:**
```
┌─────────────────────────────────────────────────┐
│  Security Events                                │
│  [Filter: Type] [Filter: Severity]              │
├─────────────────────────────────────────────────┤
│  🔴 CRITICAL | auth.suspicious_login            │
│     Login from TOR exit node                    │
│     Source: 185.220.101.1                       │
│     [View Details]                              │
├─────────────────────────────────────────────────┤
│  🟠 HIGH | auth.failed_login                    │
│     5 failed login attempts                     │
│     Source: 203.0.113.42                        │
│     [View Details]                              │
├─────────────────────────────────────────────────┤
│  🟡 MEDIUM | api.rate_limit_exceeded            │
│     150 requests (limit: 100)                   │
│     Source: 198.51.100.23                       │
│     [View Details]                              │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Customizing Mock Data

### **Add More Events:**
Edit `prisma/seed.ts` and add to `mockEvents` array:
```typescript
{
  type: 'your.event.type',
  severity: 'HIGH',
  source: '192.168.1.50',
  payload: { custom: 'data' },
  analyzed: false,
}
```

### **Add More Users:**
```typescript
const newUser = await prisma.user.upsert({
  where: { email: 'developer@aegis.local' },
  create: {
    email: 'developer@aegis.local',
    passwordHash: await argon2.hash('Developer123!'),
    roleId: userRole.id,
    mfaEnabled: false,
  },
});
```

### **Add More Audit Logs:**
```typescript
{
  action: 'custom.action',
  resource: 'resource_id',
  ip: '192.168.1.100',
  userAgent: 'Custom Agent',
  actorUserId: adminUser.id,
  meta: { your: 'data' },
}
```

---

## 📚 Learning Path

### **Absolute Beginners:**
```
1. Visit /docs
2. Read "Overview" section
3. Read "Authentication" section
4. Login to the app (admin@aegis.local / ChangeMeNow!123)
5. Explore Security Events page (see mock data)
6. Read "Security Events" in /docs
7. Connect the UI with the explanation
8. Repeat for other sections
```

### **Intermediate Developers:**
```
1. Read /docs "Authorization (RBAC)" section
2. Check apps/api/src/common/guards/rbac.guard.ts
3. Try logging in as different users
4. Test permissions in UI
5. Read /docs "API Keys" section
6. Create an API key
7. Test it with curl
```

### **Advanced Topics:**
```
1. Read /docs "Background Jobs" section
2. Check apps/api/src/modules/events/events.queue.ts
3. Send a security event via API
4. Watch it get processed
5. Read /docs "Database (Prisma)" section
6. Explore prisma/schema.prisma
7. Understand relationships
```

---

## ✅ Seed Script Output

When you run the seed script, you'll see:
```
🌱 Starting seed...
📋 Creating permissions...
👥 Creating roles...
👤 Creating users...
🔑 Creating API keys...
🚨 Creating security events...
📜 Creating audit logs...
🌐 Creating IP allowlist entries...
✅ Seed complete!

📊 Summary:
  - 3 Roles (ADMIN, ANALYST, USER)
  - 3 Users (admin@aegis.local, analyst@aegis.local, user@aegis.local)
  - 3 API Keys
  - 10 Security Events
  - 8 Audit Logs
  - 2 IP Allowlist Entries

🔐 Login Credentials:
  Admin:    admin@aegis.local / ChangeMeNow!123
  Analyst:  analyst@aegis.local / Analyst123!
  User:     user@aegis.local / User123!
```

---

## 🎯 Key Takeaways

✅ **Mock Data Created:** All services now have realistic demo data  
✅ **Documentation Page:** Learn backend concepts with real examples  
✅ **Hidden Access:** Navigate to `/docs` directly (not in nav)  
✅ **Interactive Learning:** Read docs → See code → Test in UI  
✅ **Real-world Examples:** Actual security scenarios  
✅ **Beginner Friendly:** Plain English explanations  
✅ **Code Examples:** Real code from the project  

---

## 🚀 Next Steps

1. **Re-run the seed script** to populate mock data
2. **Visit http://localhost:5173/docs** to read documentation
3. **Explore the UI** with new mock data
4. **Test different features** with realistic data
5. **Learn backend concepts** from the docs page
6. **Experiment** with different users and roles

---

**Last Updated:** October 30, 2025  
**Status:** Mock data and documentation complete! 🎉





