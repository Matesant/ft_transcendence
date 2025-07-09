#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

KIBANA_URL="http://localhost:5601"

echo -e "${CYAN}🧹 Cleaning Kibana configuration...${NC}"

# Function to delete objects by type
delete_objects() {
    local object_type="$1"
    echo -e "${YELLOW}🗑️  Deleting all ${object_type}s...${NC}"
    
    # Get all objects of this type
    OBJECTS=$(curl -s "$KIBANA_URL/api/saved_objects/_find?type=${object_type}&per_page=1000" -H "kbn-xsrf: true" | jq -r '.saved_objects[].id')
    
    if [ -z "$OBJECTS" ]; then
        echo -e "${YELLOW}   No ${object_type}s found${NC}"
        return
    fi
    
    # Delete each object
    for obj_id in $OBJECTS; do
        RESPONSE=$(curl -s -X DELETE "$KIBANA_URL/api/saved_objects/${object_type}/${obj_id}" -H "kbn-xsrf: true")
        if echo "$RESPONSE" | grep -q '"statusCode":404'; then
            echo -e "${YELLOW}   ⚠️  ${object_type} ${obj_id} not found${NC}"
        else
            echo -e "${GREEN}   ✅ Deleted ${object_type}: ${obj_id}${NC}"
        fi
    done
}

# Wait for Kibana
echo -e "${YELLOW}⏳ Waiting for Kibana to be ready...${NC}"
until curl -s "$KIBANA_URL/api/status" | grep -q '"level":"available"'; do
  sleep 2
done
echo -e "${GREEN}✅ Kibana is ready!${NC}"

# Delete different types of objects
delete_objects "dashboard"
delete_objects "visualization" 
delete_objects "lens"
delete_objects "search"
delete_objects "index-pattern"

# Clean up settings (optional)
echo -e "${YELLOW}🎯 Resetting Kibana settings...${NC}"
curl -s -X POST "$KIBANA_URL/api/kibana/settings" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{"changes": {"defaultIndex": null}}' > /dev/null 2>&1

echo -e "${GREEN}🎉 Kibana cleanup completed!${NC}"
echo ""
echo -e "${YELLOW}📋 All dashboards, visualizations, and index patterns have been removed${NC}"
echo -e "${CYAN}   You can now run the setup script again to recreate everything${NC}"
