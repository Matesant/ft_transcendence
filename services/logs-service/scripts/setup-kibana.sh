#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

KIBANA_URL="http://localhost:5601"

# Function to check API response
check_response() {
    local response="$1"
    local object_name="$2"
    local id_pattern="$3"
    
    if echo "$response" | grep -q "$id_pattern"; then
        echo -e "${GREEN}✅ $object_name created successfully${NC}"
    elif echo "$response" | grep -q '"error":"Conflict"'; then
        echo -e "${YELLOW}⚠️  $object_name already exists${NC}"
    else
        echo -e "${RED}❌ Failed to create $object_name${NC}"
    fi
}

echo -e "${CYAN}🔍 Setting up Kibana automatically...${NC}"

# Wait for Kibana
echo -e "${YELLOW}⏳ Waiting for Kibana to initialize...${NC}"
until curl -s "$KIBANA_URL/api/status" | grep -q '"level":"available"'; do
  sleep 2
done
echo -e "${GREEN}✅ Kibana is ready!${NC}"

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
check_response "$RESPONSE" "Index pattern" '"id":"logstash-\*"'

# Set default index pattern
echo -e "${YELLOW}🎯 Setting default index pattern...${NC}"
curl -s -X POST "$KIBANA_URL/api/kibana/settings/defaultIndex" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{"value": "logstash-*"}' > /dev/null 2>&1
echo -e "${GREEN}✅ Default index pattern set${NC}"

# Create visualizations
echo -e "${YELLOW}📊 Creating visualization: Logs by Service...${NC}"
RESPONSE=$(curl -s -X POST "$KIBANA_URL/api/saved_objects/visualization/logs-by-service" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{
    "attributes": {
      "title": "Logs by Service",
      "visState": "{\"title\":\"Logs by Service\",\"type\":\"pie\",\"aggs\":[{\"id\":\"1\",\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"container_name\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
      "uiStateJSON": "{}",
      "description": "Log distribution by microservice",
      "version": 1,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": "{\"index\":\"logstash-*\",\"query\":{\"match_all\":{}},\"filter\":[]}"
      }
    }
  }')
check_response "$RESPONSE" "Logs by Service visualization" '"id":"logs-by-service"'

echo -e "${YELLOW}📊 Creating visualization: Logs Timeline...${NC}"
RESPONSE=$(curl -s -X POST "$KIBANA_URL/api/saved_objects/visualization/logs-timeline" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{
    "attributes": {
      "title": "Logs Timeline",
      "visState": "{\"title\":\"Logs Timeline\",\"type\":\"histogram\",\"aggs\":[{\"id\":\"1\",\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"type\":\"date_histogram\",\"schema\":\"segment\",\"params\":{\"field\":\"@timestamp\",\"interval\":\"auto\",\"customInterval\":\"2h\",\"min_doc_count\":1,\"extended_bounds\":{}}}]}",
      "uiStateJSON": "{}",
      "description": "Temporal distribution of logs",
      "version": 1,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": "{\"index\":\"logstash-*\",\"query\":{\"match_all\":{}},\"filter\":[]}"
      }
    }
  }')
check_response "$RESPONSE" "Logs Timeline visualization" '"id":"logs-timeline"'

# Create dashboard
echo -e "${YELLOW}📊 Creating main dashboard...${NC}"
RESPONSE=$(curl -s -X POST "$KIBANA_URL/api/saved_objects/dashboard/elk-dashboard" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{
    "attributes": {
      "title": "ELK Logs Dashboard",
      "description": "Main dashboard for microservices monitoring",
      "panelsJSON": "[{\"version\":\"8.6.2\",\"gridData\":{\"x\":0,\"y\":0,\"w\":24,\"h\":15,\"i\":\"1\"},\"panelIndex\":\"1\",\"embeddableConfig\":{},\"panelRefName\":\"panel_1\"},{\"version\":\"8.6.2\",\"gridData\":{\"x\":24,\"y\":0,\"w\":24,\"h\":15,\"i\":\"2\"},\"panelIndex\":\"2\",\"embeddableConfig\":{},\"panelRefName\":\"panel_2\"}]",
      "optionsJSON": "{\"useMargins\":true,\"syncColors\":false,\"hidePanelTitles\":false}",
      "version": 1,
      "timeRestore": false,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": "{\"query\":{\"query\":\"\",\"language\":\"kuery\"},\"filter\":[]}"
      }
    },
    "references": [
      {
        "name": "panel_1",
        "type": "visualization",
        "id": "logs-by-service"
      },
      {
        "name": "panel_2",
        "type": "visualization",
        "id": "logs-timeline"
      }
    ]
  }')
check_response "$RESPONSE" "Dashboard" '"id":"elk-dashboard"'

echo -e "${GREEN}🎉 Kibana configuration completed!${NC}"
echo ""
echo -e "${YELLOW}📊 Available access:${NC}"
echo "   • Kibana: $KIBANA_URL"
echo "   • Discover: $KIBANA_URL/app/discover"
echo "   • Dashboards: $KIBANA_URL/app/dashboards"
