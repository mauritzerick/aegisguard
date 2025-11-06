#!/bin/bash

# AegisGuard - Complete Functionality Test Script
# This script tests all major API endpoints

echo "🧪 AegisGuard - Comprehensive Functionality Test"
echo "================================================"
echo ""

API_URL="http://localhost:3000"
COOKIE_FILE="/tmp/aegis_test_cookies.txt"
rm -f $COOKIE_FILE

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() { echo -e "${GREEN}✅ PASS${NC}: $1"; }
fail() { echo -e "${RED}❌ FAIL${NC}: $1"; }
info() { echo -e "${YELLOW}ℹ️  INFO${NC}: $1"; }

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
HEALTH=$(curl -s $API_URL/health)
if echo "$HEALTH" | grep -q '"db":true'; then
    pass "Health check - Database connected"
else
    fail "Health check - Database not connected"
fi

if echo "$HEALTH" | grep -q '"redis":true'; then
    pass "Health check - Redis connected"
else
    fail "Health check - Redis not connected"
fi
echo ""

# Test 2: Login
echo "2️⃣  Testing Login..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aegis.local","password":"ChangeMeNow!123"}' \
  -c $COOKIE_FILE)

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ] && echo "$BODY" | grep -q '"ok":true'; then
    pass "Login successful"
else
    fail "Login failed (HTTP $HTTP_CODE): $BODY"
fi
echo ""

# Test 3: Get Current User (/auth/me)
echo "3️⃣  Testing /auth/me (Get Current User)..."
ME_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET $API_URL/auth/me \
  -b $COOKIE_FILE)

HTTP_CODE=$(echo "$ME_RESPONSE" | tail -n1)
BODY=$(echo "$ME_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q 'admin@aegis.local'; then
    pass "Get current user - Admin user retrieved"
    info "User: $(echo $BODY | grep -o '"email":"[^"]*"')"
else
    fail "Get current user failed (HTTP $HTTP_CODE): $BODY"
fi
echo ""

# Test 4: MFA Setup
echo "4️⃣  Testing MFA Setup..."
MFA_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $API_URL/auth/mfa/setup \
  -b $COOKIE_FILE)

HTTP_CODE=$(echo "$MFA_RESPONSE" | tail -n1)
BODY=$(echo "$MFA_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ] && echo "$BODY" | grep -q '"qr"'; then
    pass "MFA setup - QR code generated"
else
    fail "MFA setup failed (HTTP $HTTP_CODE): $BODY"
fi
echo ""

# Test 5: Users List
echo "5️⃣  Testing Users List..."
USERS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET $API_URL/users \
  -b $COOKIE_FILE)

HTTP_CODE=$(echo "$USERS_RESPONSE" | tail -n1)
BODY=$(echo "$USERS_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    pass "Users list retrieved"
    USER_COUNT=$(echo "$BODY" | grep -o '"id"' | wc -l)
    info "Found $USER_COUNT user(s)"
else
    fail "Users list failed (HTTP $HTTP_CODE): $BODY"
fi
echo ""

# Test 6: Roles List
echo "6️⃣  Testing Roles List..."
ROLES_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET $API_URL/roles \
  -b $COOKIE_FILE)

HTTP_CODE=$(echo "$ROLES_RESPONSE" | tail -n1)
BODY=$(echo "$ROLES_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    pass "Roles list retrieved"
    if echo "$BODY" | grep -q '"name":"ADMIN"'; then
        info "Found ADMIN role"
    fi
else
    fail "Roles list failed (HTTP $HTTP_CODE): $BODY"
fi
echo ""

# Test 7: API Keys - Get CSRF Token
echo "7️⃣  Testing API Keys..."
CSRF_TOKEN=$(grep csrf_token $COOKIE_FILE | awk '{print $7}')

# Create API Key
APIKEY_CREATE=$(curl -s -w "\n%{http_code}" -X POST $API_URL/apikeys \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF_TOKEN" \
  -d '{"name":"Test Key","scopes":["events:read"]}' \
  -b $COOKIE_FILE)

HTTP_CODE=$(echo "$APIKEY_CREATE" | tail -n1)
BODY=$(echo "$APIKEY_CREATE" | head -n-1)

if [ "$HTTP_CODE" = "201" ] && echo "$BODY" | grep -q '"key"'; then
    pass "API key created"
    API_KEY=$(echo "$BODY" | grep -o '"key":"[^"]*"' | cut -d'"' -f4)
    info "API Key: ${API_KEY:0:20}..."
else
    fail "API key creation failed (HTTP $HTTP_CODE): $BODY"
fi
echo ""

# Test 8: Security Events - Ingest
echo "8️⃣  Testing Security Events..."
EVENT_INGEST=$(curl -s -w "\n%{http_code}" -X POST $API_URL/security-events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "source":"test-script",
    "type":"test",
    "severity":"low",
    "payload":{"message":"Test event from script"}
  }')

HTTP_CODE=$(echo "$EVENT_INGEST" | tail -n1)
BODY=$(echo "$EVENT_INGEST" | head -n-1)

if [ "$HTTP_CODE" = "201" ]; then
    pass "Security event ingested"
else
    fail "Security event ingestion failed (HTTP $HTTP_CODE): $BODY"
fi

# List Security Events
EVENTS_LIST=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/security-events" \
  -b $COOKIE_FILE)

HTTP_CODE=$(echo "$EVENTS_LIST" | tail -n1)
BODY=$(echo "$EVENTS_LIST" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    pass "Security events list retrieved"
    EVENT_COUNT=$(echo "$BODY" | grep -o '"id"' | wc -l)
    info "Found $EVENT_COUNT event(s)"
else
    fail "Security events list failed (HTTP $HTTP_CODE): $BODY"
fi
echo ""

# Test 9: Audit Logs
echo "9️⃣  Testing Audit Logs..."
AUDIT_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET $API_URL/audit-logs \
  -b $COOKIE_FILE)

HTTP_CODE=$(echo "$AUDIT_RESPONSE" | tail -n1)
BODY=$(echo "$AUDIT_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    pass "Audit logs retrieved"
    AUDIT_COUNT=$(echo "$BODY" | grep -o '"id"' | wc -l)
    info "Found $AUDIT_COUNT audit log(s)"
else
    fail "Audit logs failed (HTTP $HTTP_CODE): $BODY"
fi
echo ""

# Test 10: IP Allow
echo "🔟 Testing IP Allow..."
IP_CREATE=$(curl -s -w "\n%{http_code}" -X POST $API_URL/ip-allow \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF_TOKEN" \
  -d '{"cidr":"192.168.1.0/24"}' \
  -b $COOKIE_FILE)

HTTP_CODE=$(echo "$IP_CREATE" | tail -n1)
BODY=$(echo "$IP_CREATE" | head -n-1)

if [ "$HTTP_CODE" = "201" ]; then
    pass "IP allow entry created"
else
    fail "IP allow creation failed (HTTP $HTTP_CODE): $BODY"
fi

IP_LIST=$(curl -s -w "\n%{http_code}" -X GET $API_URL/ip-allow \
  -b $COOKIE_FILE)

HTTP_CODE=$(echo "$IP_LIST" | tail -n1)
BODY=$(echo "$IP_LIST" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    pass "IP allow list retrieved"
else
    fail "IP allow list failed (HTTP $HTTP_CODE): $BODY"
fi
echo ""

# Test 11: Swagger Docs
echo "1️⃣1️⃣  Testing Swagger Documentation..."
SWAGGER_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET $API_URL/docs)

HTTP_CODE=$(echo "$SWAGGER_RESPONSE" | tail -n1)
BODY=$(echo "$SWAGGER_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ]; then
    pass "Swagger docs available"
else
    fail "Swagger docs failed (HTTP $HTTP_CODE)"
fi
echo ""

# Cleanup
rm -f $COOKIE_FILE

echo "================================================"
echo "✅ Testing Complete!"
echo ""
echo "📊 Access your application:"
echo "   Frontend: http://localhost:5173"
echo "   API:      http://localhost:3000"
echo "   Docs:     http://localhost:3000/docs"
echo ""





