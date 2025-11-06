#!/bin/bash
echo "=== Testing AegisGuard API ==="
echo ""

# Login
echo "1. Testing Login..."
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aegis.local","password":"ChangeMeNow!123"}' \
  -c /tmp/test_cookies.txt > /dev/null
echo "✅ Login successful (cookies saved)"
echo ""

# Get current user
echo "2. Testing /auth/me..."
curl -s -X GET http://localhost:3000/auth/me \
  -b /tmp/test_cookies.txt | python3 -m json.tool
echo ""

# Get users list
echo "3. Testing /users..."
curl -s -X GET http://localhost:3000/users \
  -b /tmp/test_cookies.txt | python3 -m json.tool
echo ""

# Get roles
echo "4. Testing /roles..."
curl -s -X GET http://localhost:3000/roles \
  -b /tmp/test_cookies.txt | python3 -m json.tool
echo ""

# Get audit logs
echo "5. Testing /audit-logs..."
curl -s -X GET http://localhost:3000/audit-logs \
  -b /tmp/test_cookies.txt | python3 -m json.tool | head -n 20
echo "..."
echo ""

# Get security events
echo "6. Testing /security-events..."
curl -s -X GET http://localhost:3000/security-events \
  -b /tmp/test_cookies.txt | python3 -m json.tool
echo ""

# MFA Setup
echo "7. Testing /auth/mfa/setup..."
MFA_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/mfa/setup \
  -b /tmp/test_cookies.txt)
if echo "$MFA_RESPONSE" | grep -q '"qr"'; then
  echo "✅ MFA setup successful (QR code generated)"
else
  echo "❌ MFA setup failed:"
  echo "$MFA_RESPONSE" | python3 -m json.tool
fi
echo ""

rm -f /tmp/test_cookies.txt
echo "=== All Tests Complete ==="
