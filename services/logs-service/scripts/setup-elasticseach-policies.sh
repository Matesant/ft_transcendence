#!/bin/bash

set -e

ELASTICSEARCH_URL="http://localhost:9200"

GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Setting up initial policies of date retention...${NC}"

echo -e "${YELLOW}⏳ Waiting for Elasticsearch...${NC}"
for i in {1..30}; do
  if curl -s "$ELASTICSEARCH_URL/_cluster/health" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Elasticsearch is ready!${NC}"
    break
  fi

  if [ $i -eq 30 ]; then
    echo -e "${RED}❌ Elasticsearch did not respond${NC}"
    exit 1
  fi

  sleep 5
done

echo -e "${YELLOW}📋 Creating lifecycle policy for logs...${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POLICY_FILE="$SCRIPT_DIR/../elasticsearch/ilm-policy.json"

if [ ! -f "$POLICY_FILE" ]; then
  echo -e "${RED}❌ Policy file not found: $POLICY_FILE${NC}"
  exit 1
fi

curl -X PUT "$ELASTICSEARCH_URL/_ilm/policy/logs-policy" \
  -H "Content-Type: application/json" \
  -d @"$POLICY_FILE"

echo -e "${YELLOW}🎯 Setting up template for logstash indices...${NC}"
curl -X PUT "$ELASTICSEARCH_URL/_index_template/logstash-logs" \
  -H "Content-Type: application/json" \
  -d '{
    "index_patterns": ["logstash-*"],
    "template": {
      "settings": {
        "index.lifecycle.name": "logs-policy",
        "number_of_shards": 1,
        "number_of_replicas": 0
      },
      "mappings": {
        "properties": {
          "@timestamp": {
            "type": "date"
          },
          "level": {
            "type": "keyword"
          },
          "container_name": {
            "type": "keyword"
          },
          "message": {
            "type": "text",
            "analyzer": "standard"
          }
        }
      }
    }
  }'

echo -e "${GREEN}Data retention configuration completed!${NC}"