#!/bin/bash
echo "🏆 Setting up test tournament..."

# Register 4 test players
for player in alice bob charlie diana; do
  curl -s -X POST http://localhost:3001/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"alias\":\"$player\",\"email\":\"$player@test.com\",\"password\":\"test123\"}" > /dev/null
  echo "✅ Registered $player"
done

# Login as alice
curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"alias":"alice","password":"test123"}' > /dev/null

# Create tournament with error handling
RESULT=$(curl -s -X POST http://localhost:3002/match/ \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -w "HTTP_CODE:%{http_code}" \
  -d '{"players":["alice","bob","charlie","diana"]}')

echo "🎮 Tournament result: $RESULT"

# Check if login worked
LOGIN_CHECK=$(curl -s -X GET http://localhost:3001/auth/me -b cookies.txt)
echo "🔐 Login status: $LOGIN_CHECK"

# Show next match
NEXT=$(curl -s -X GET http://localhost:3002/match/next -b cookies.txt)
echo "🎯 Next match: $NEXT"

echo "🌐 Now open http://localhost:8080 to see the tournament match!"

# Cleanup
rm -f cookies.txt