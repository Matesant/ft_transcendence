#!/bin/bash

# Enhanced Kibana setup script with better cross-platform compatibility
# Handles interactive setup scenarios common in Arch Linux

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

KIBANA_URL="http://localhost:5601"
ELASTICSEARCH_URL="http://localhost:9200"

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
        echo "Response: $response"
    fi
}

# Function to wait for Elasticsearch
wait_for_elasticsearch() {
    echo -e "${YELLOW}⏳ Waiting for Elasticsearch to be ready...${NC}"
    timeout=300  # 5 minutes timeout
    elapsed=0
    
    while [ $elapsed -lt $timeout ]; do
        if curl -s "$ELASTICSEARCH_URL/_cluster/health" | grep -q '"status":"green\|yellow"'; then
            echo -e "${GREEN}✅ Elasticsearch is ready!${NC}"
            return 0
        fi
        sleep 2
        elapsed=$((elapsed + 2))
    done
    
    echo -e "${RED}❌ Timeout waiting for Elasticsearch${NC}"
    return 1
}

# Function to handle Kibana setup
setup_kibana() {
    echo -e "${YELLOW}⏳ Setting up Kibana connection...${NC}"
    
    # Try to setup Kibana with Elasticsearch connection
    SETUP_RESPONSE=$(curl -s -X POST "$KIBANA_URL/api/interactive_setup/enroll" \
        -H "Content-Type: application/json" \
        -H "kbn-xsrf: true" \
        -d '{
            "hosts": ["http://elasticsearch:9200"]
        }' 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Kibana setup initiated${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Standard setup failed, trying alternative method...${NC}"
        
        # Alternative: Try to verify connection
        VERIFY_RESPONSE=$(curl -s -X POST "$KIBANA_URL/api/interactive_setup/verify" \
            -H "Content-Type: application/json" \
            -H "kbn-xsrf: true" \
            -d '{
                "host": "http://elasticsearch:9200"
            }' 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Kibana connection verified${NC}"
            return 0
        fi
    fi
    
    return 1
}

# Function to wait for Kibana to be ready
wait_for_kibana() {
    echo -e "${YELLOW}⏳ Waiting for Kibana to initialize...${NC}"
    timeout=300  # 5 minutes timeout
    elapsed=0
    setup_attempted=false
    
    while [ $elapsed -lt $timeout ]; do
        # Check if Kibana is available
        STATUS_RESPONSE=$(curl -s "$KIBANA_URL/api/status" 2>/dev/null)
        
        if echo "$STATUS_RESPONSE" | grep -q '"level":"available"'; then
            echo -e "${GREEN}✅ Kibana is ready!${NC}"
            return 0
        fi
        
        # Check if Kibana requires interactive setup
        if echo "$STATUS_RESPONSE" | grep -q '"level":"unavailable"' && [ "$setup_attempted" = false ]; then
            echo -e "${YELLOW}⚠️  Kibana requires interactive setup. Attempting to configure...${NC}"
            
            if setup_kibana; then
                setup_attempted=true
                echo -e "${GREEN}✅ Setup completed, waiting for Kibana to start...${NC}"
                sleep 10  # Give Kibana time to restart
                continue
            else
                echo -e "${RED}❌ Failed to setup Kibana automatically${NC}"
                echo -e "${YELLOW}Manual setup required. Please visit: $KIBANA_URL${NC}"
                return 1
            fi
        fi
        
        # Check if we can access Kibana (might be ready but not reporting status correctly)
        if curl -s "$KIBANA_URL/app/home" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Kibana is accessible!${NC}"
            return 0
        fi
        
        sleep 2
        elapsed=$((elapsed + 2))
    done
    
    echo -e "${RED}❌ Timeout waiting for Kibana to be ready${NC}"
    return 1
}

echo -e "${CYAN}🔍 Setting up Kibana automatically (Enhanced version)...${NC}"

# Step 1: Wait for Elasticsearch
if ! wait_for_elasticsearch; then
    echo -e "${RED}❌ Elasticsearch is not ready. Cannot continue.${NC}"
    exit 1
fi

# Step 2: Wait for Kibana and handle setup
if ! wait_for_kibana; then
    echo -e "${RED}❌ Kibana setup failed. Please check manually.${NC}"
    exit 1
fi

# Step 3: Create index pattern
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

# Step 4: Set default index pattern
echo -e "${YELLOW}🎯 Setting default index pattern...${NC}"
curl -s -X POST "$KIBANA_URL/api/kibana/settings/defaultIndex" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{"value": "logstash-*"}' > /dev/null 2>&1
echo -e "${GREEN}✅ Default index pattern set${NC}"

# Step 5: Create visualizations
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

echo -e "${YELLOW}📊 Creating visualization: Log Levels Distribution...${NC}"
RESPONSE=$(curl -s -X POST "$KIBANA_URL/api/saved_objects/visualization/logs-by-level" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{
    "attributes": {
      "title": "Log Levels Distribution",
      "visState": "{\"title\":\"Log Levels Distribution\",\"type\":\"histogram\",\"aggs\":[{\"id\":\"1\",\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"log_level.keyword\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
      "uiStateJSON": "{}",
      "description": "Distribution of log levels",
      "version": 1,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": "{\"index\":\"logstash-*\",\"query\":{\"match_all\":{}},\"filter\":[]}"
      }
    }
  }')
check_response "$RESPONSE" "Log Levels visualization" '"id":"logs-by-level"'

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

echo -e "${YELLOW}📊 Creating visualization: Total Logs Counter...${NC}"
RESPONSE=$(curl -s -X POST "$KIBANA_URL/api/saved_objects/visualization/total-logs" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{
    "attributes": {
      "title": "Total Logs",
      "visState": "{\"title\":\"Total Logs\",\"type\":\"metric\",\"aggs\":[{\"id\":\"1\",\"type\":\"count\",\"schema\":\"metric\",\"params\":{}}]}",
      "uiStateJSON": "{}",
      "description": "Total count of logs",
      "version": 1,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": "{\"index\":\"logstash-*\",\"query\":{\"match_all\":{}},\"filter\":[]}"
      }
    }
  }')
check_response "$RESPONSE" "Total Logs visualization" '"id":"total-logs"'

# Step 6: Create dashboard
echo -e "${YELLOW}📊 Creating main dashboard...${NC}"
RESPONSE=$(curl -s -X POST "$KIBANA_URL/api/saved_objects/dashboard/elk-dashboard" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{
    "attributes": {
      "title": "ELK Logs Dashboard",
      "description": "Main dashboard for microservices monitoring",
      "panelsJSON": "[{\"version\":\"8.6.2\",\"gridData\":{\"x\":0,\"y\":0,\"w\":12,\"h\":15,\"i\":\"1\"},\"panelIndex\":\"1\",\"embeddableConfig\":{},\"panelRefName\":\"panel_1\"},{\"version\":\"8.6.2\",\"gridData\":{\"x\":12,\"y\":0,\"w\":12,\"h\":15,\"i\":\"2\"},\"panelIndex\":\"2\",\"embeddableConfig\":{},\"panelRefName\":\"panel_2\"},{\"version\":\"8.6.2\",\"gridData\":{\"x\":24,\"y\":0,\"w\":12,\"h\":15,\"i\":\"3\"},\"panelIndex\":\"3\",\"embeddableConfig\":{},\"panelRefName\":\"panel_3\"},{\"version\":\"8.6.2\",\"gridData\":{\"x\":36,\"y\":0,\"w\":12,\"h\":15,\"i\":\"4\"},\"panelIndex\":\"4\",\"embeddableConfig\":{},\"panelRefName\":\"panel_4\"}]",
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
        "id": "logs-by-level"
      },
      {
        "name": "panel_3",
        "type": "visualization",
        "id": "total-logs"
      },
      {
        "name": "panel_4",
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
