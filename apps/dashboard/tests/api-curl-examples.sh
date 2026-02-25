#!/bin/bash
# ST-10: API Testing Script
# These are example curl commands to test the TinyFeedback API

# Base URL
BASE_URL="http://localhost:3000/api/v1"
API_KEY="tf_test_key_replace_with_real_key"

echo "======================================"
echo "TinyFeedback API Test Examples"
echo "======================================"
echo ""

# Test 1: List feedbacks (with authentication)
echo "1. GET /feedbacks (list feedbacks)"
echo "--------------------------------------"
echo "curl -X GET \"\${BASE_URL}/feedbacks?page=1&limit=20\" \\"
echo "  -H \"X-API-Key: \${API_KEY}\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""

# Test 2: Create NPS feedback
echo "2. POST /feedbacks (create NPS feedback)"
echo "--------------------------------------"
echo "curl -X POST \"\${BASE_URL}/feedbacks\" \\"
echo "  -H \"X-API-Key: \${API_KEY}\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{
    \"type\": \"nps\",
    \"content\": {
      \"score\": 9,
      \"comment\": \"Great product!\"
    },
    \"userEmail\": \"user@example.com\"
  }'"
echo ""

# Test 3: Create suggestion feedback
echo "3. POST /feedbacks (create suggestion)"
echo "--------------------------------------"
echo "curl -X POST \"\${BASE_URL}/feedbacks\" \\"
echo "  -H \"X-API-Key: \${API_KEY}\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{
    \"type\": \"suggestion\",
    \"content\": {
      \"title\": \"Add dark mode\",
      \"description\": \"It would be great to have a dark mode option for better night usage.\",
      \"category\": \"Feature\"
    }
  }'"
echo ""

# Test 4: Create bug report
echo "4. POST /feedbacks (create bug report)"
echo "--------------------------------------"
echo "curl -X POST \"\${BASE_URL}/feedbacks\" \\"
echo "  -H \"X-API-Key: \${API_KEY}\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{
    \"type\": \"bug\",
    \"content\": {
      \"description\": \"The login button is not working on mobile devices.\",
      \"includeTechnicalInfo\": true,
      \"contactEmail\": \"user@example.com\"
    }
  }'"
echo ""

# Test 5: Get single feedback
echo "5. GET /feedbacks/:id (get single feedback)"
echo "--------------------------------------"
echo "curl -X GET \"\${BASE_URL}/feedbacks/UUID_HERE\" \\"
echo "  -H \"X-API-Key: \${API_KEY}\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""

# Test 6: Update feedback
echo "6. PATCH /feedbacks/:id (update feedback)"
echo "--------------------------------------"
echo "curl -X PATCH \"\${BASE_URL}/feedbacks/UUID_HERE\" \\"
echo "  -H \"X-API-Key: \${API_KEY}\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{
    \"status\": \"implemented\",
    \"priority\": \"high\"
  }'"
echo ""

# Test 7: Delete feedback
echo "7. DELETE /feedbacks/:id (delete feedback)"
echo "--------------------------------------"
echo "curl -X DELETE \"\${BASE_URL}/feedbacks/UUID_HERE\" \\"
echo "  -H \"X-API-Key: \${API_KEY}\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""

# Test 8: Unauthorized request
echo "8. Test unauthorized request (should return 401)"
echo "--------------------------------------"
echo "curl -X GET \"\${BASE_URL}/feedbacks\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""

# Test 9: Invalid API key
echo "9. Test invalid API key (should return 403)"
echo "--------------------------------------"
echo "curl -X GET \"\${BASE_URL}/feedbacks\" \\"
echo "  -H \"X-API-Key: invalid_key\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""

# Test 10: Rate limiting test
echo "10. Test rate limiting (run 100+ requests quickly)"
echo "--------------------------------------"
echo "for i in {1..105}; do"
echo "  curl -X GET \"\${BASE_URL}/feedbacks\" \\"
echo "    -H \"X-API-Key: \${API_KEY}\" \\"
echo "    -H \"Content-Type: application/json\" \\"
echo "    -s -o /dev/null -w \"%{http_code}\""
echo "  echo \" Request \$i\""
echo "done"
echo ""

echo "======================================"
echo "Expected Response Format:"
echo "======================================"
echo "Success:"
echo '{"success":true,"data":{...},"meta":{"page":1,"limit":20,"total":100,"hasMore":true}}'
echo ""
echo "Error:"
echo '{"success":false,"error":{"code":"UNAUTHORIZED","message":"API key is required"}}'
echo ""
echo "Rate Limit Headers:"
echo "X-RateLimit-Limit: 100"
echo "X-RateLimit-Remaining: 95"
echo "X-RateLimit-Reset: 1706745600"
echo ""
