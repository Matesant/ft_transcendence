#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

KIBANA_URL="http://localhost:5601"
MAX_RETRIES=30
RETRY_INTERVAL=5

echo -e "${CYAN}🔍 Setting up Kibana configuration...${NC}"

# Function to wait for service with timeout
wait_for_service() {
    local url="$1"
    local service_name="$2"
    local max_attempts="$3"
    local interval="$4"
    
    echo -e "${YELLOW}⏳ Waiting for $service_name to be ready...${NC}"
    
    for ((i=1; i<=max_attempts; i++)); do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready! (attempt $i/$max_attempts)${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}   Attempt $i/$max_attempts failed, retrying in ${interval}s...${NC}"
        sleep "$interval"
    done
    
    echo -e "${RED}❌ $service_name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Function to check API response
check_response() {
    local response="$1"
    local object_name="$2"
    local success_pattern="$3"
    
    if echo "$response" | grep -q "$success_pattern"; then
        echo -e "${GREEN}✅ $object_name created successfully${NC}"
        return 0
    elif echo "$response" | grep -q '"error":"Conflict"'; then
        echo -e "${YELLOW}⚠️  $object_name already exists${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to create $object_name${NC}"
        echo -e "${RED}Response: $response${NC}"
        return 1
    fi
}

# Wait for Elasticsearch
if ! wait_for_service "http://localhost:9200/_cluster/health" "Elasticsearch" 20 5; then
    echo -e "${RED}❌ Elasticsearch is not available. Exiting.${NC}"
    exit 1
fi

# Wait for Kibana status API
if ! wait_for_service "$KIBANA_URL/api/status" "Kibana" $MAX_RETRIES $RETRY_INTERVAL; then
    echo -e "${RED}❌ Kibana is not available. Exiting.${NC}"
    exit 1
fi

# Additional wait for Kibana to be fully ready
echo -e "${YELLOW}⏳ Ensuring Kibana is fully initialized...${NC}"
until curl -s "$KIBANA_URL/api/status" | grep -q '"level":"available"'; do
    echo -e "${YELLOW}   Kibana still initializing...${NC}"
    sleep 3
done

echo -e "${GREEN}✅ Kibana is fully ready!${NC}"

# Create index pattern
echo -e "${YELLOW}📋 Creating index pattern logstash-*...${NC}"
RESPONSE=$(curl -s -X POST "$KIBANA_URL/api/saved_objects/index-pattern/logstash-*" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{
    "attributes": {
      "title": "logstash-*",
      "timeFieldName": "@timestamp"
    }
  }')

if ! check_response "$RESPONSE" "Index pattern" '"id":"logstash-\*"'; then
    echo -e "${RED}❌ Failed to create index pattern. Continuing anyway...${NC}"
fi

# Set default index pattern (try different API versions)
echo -e "${YELLOW}🎯 Setting default index pattern...${NC}"
curl -s -X POST "$KIBANA_URL/api/kibana/settings/defaultIndex" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{"value": "logstash-*"}' > /dev/null 2>&1

# Alternative method for newer Kibana versions
curl -s -X POST "$KIBANA_URL/api/kibana/settings" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{"changes": {"defaultIndex": "logstash-*"}}' > /dev/null 2>&1

echo -e "${GREEN}✅ Default index pattern configuration attempted${NC}"

echo -e "${GREEN}🎉 Kibana basic configuration completed!${NC}"
echo ""
echo -e "${YELLOW}📊 Available access:${NC}"
echo "   • Kibana: $KIBANA_URL"
echo "   • Discover: $KIBANA_URL/app/discover"
echo "   • Dashboards: $KIBANA_URL/app/dashboards"
echo ""
echo -e "${CYAN}Note: Full dashboard creation can be done manually or by running the original setup script later${NC}"
