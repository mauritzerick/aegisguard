#!/bin/bash

# Script to manually create test security events

echo "🚨 Creating test security events..."
echo ""

# Event 1: Failed Login
echo "1. Creating failed login event..."
curl -X POST http://localhost:3000/security-events/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{
    "type": "auth.failed_login",
    "severity": "HIGH",
    "source": "192.168.1.50",
    "payload": {
      "email": "test@example.com",
      "attempts": 3,
      "reason": "Invalid password"
    }
  }' 2>/dev/null | jq '.' || echo "  ✓ Event created (or check if API is running)"
echo ""

# Event 2: Suspicious Activity
echo "2. Creating suspicious activity event..."
curl -X POST http://localhost:3000/security-events/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{
    "type": "auth.suspicious_login",
    "severity": "CRITICAL",
    "source": "45.142.212.100",
    "payload": {
      "reason": "Login from blacklisted IP",
      "email": "admin@aegis.local"
    }
  }' 2>/dev/null | jq '.' || echo "  ✓ Event created"
echo ""

# Event 3: Rate Limit
echo "3. Creating rate limit event..."
curl -X POST http://localhost:3000/security-events/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{
    "type": "api.rate_limit_exceeded",
    "severity": "MEDIUM",
    "source": "10.0.0.123",
    "payload": {
      "endpoint": "/api/users",
      "requests": 200,
      "limit": 100,
      "window": "1 minute"
    }
  }' 2>/dev/null | jq '.' || echo "  ✓ Event created"
echo ""

# Event 4: Data Access
echo "4. Creating unauthorized access event..."
curl -X POST http://localhost:3000/security-events/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{
    "type": "data.unauthorized_access",
    "severity": "HIGH",
    "source": "172.16.0.99",
    "payload": {
      "resource": "/admin/sensitive-data",
      "userId": "user_123",
      "action": "READ"
    }
  }' 2>/dev/null | jq '.' || echo "  ✓ Event created"
echo ""

# Event 5: Malware Detection
echo "5. Creating malware detection event..."
curl -X POST http://localhost:3000/security-events/ingest \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{
    "type": "malware.file_upload_blocked",
    "severity": "CRITICAL",
    "source": "192.168.1.75",
    "payload": {
      "filename": "malicious.exe",
      "hash": "d4e5f6a7b8c9",
      "signature": "Trojan.Generic",
      "userId": "user_456"
    }
  }' 2>/dev/null | jq '.' || echo "  ✓ Event created"
echo ""

echo "✅ Done! Check the Security Events page in the UI."
echo "   http://localhost:5173/events"
echo ""
echo "Note: If you see errors, make sure:"
echo "  - API server is running (./RUN.sh)"
echo "  - You're logged in to the UI"





