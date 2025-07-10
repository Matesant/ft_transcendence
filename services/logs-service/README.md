# Logs Service

Complete logging infrastructure using ELK Stack (Elasticsearch, Logstash, Kibana).

## Purpose
Centralized logging solution that:
- Collects logs from all microservices
- Processes and stores log data 
- Provides visualization and monitoring dashboards

## Components

### Elasticsearch
- **Purpose**: Log storage and indexing
- **Port**: 9200
- **Features**: Full-text search, data retention policies

### Logstash  
- **Purpose**: Log processing and transformation
- **Port**: 12201/UDP (GELF input)
- **Features**: JSON parsing, field extraction, data enrichment

### Kibana
- **Purpose**: Visualization and dashboards
- **Port**: 5601
- **Features**: Real-time log exploration, pre-built dashboards

## Configuration Structure

```
logs-service/
├── pipeline/
│   └── logstash.conf           # Log processing pipeline
├── elasticsearch/
│   └── ilm-policy.json         # Data retention policies  
├── scripts/
│   ├── setup-elasticsearch-policies.sh
│   └── setup-kibana.sh         # Auto-creates dashboards
└── README.md                   # This file
```

## Key Features
- **Auto-setup**: Dashboards and policies created automatically
- **Data retention**: Configurable log cleanup (default: 90 days)
- **Service isolation**: Logs from auth, match, and user services
- **Real-time monitoring**: Live log streaming and alerts

## 📊 ELK Stack Monitoring

### Access URLs
- **Main Dashboard**: http://localhost:5601/app/dashboards#/view/elk-dashboard
- **Discover Logs**: http://localhost:5601/app/discover
- **Elasticsearch API**: http://localhost:9200
- **Logstash GELF**: localhost:12201/udp

### Dashboard Components

The auto-created dashboard includes:

1. **Logs by Service**: Pie chart showing log distribution by microservice
2. **Logs Timeline**: Temporal histogram of logs

### Data Sources
- Authentication logs (auth-service)
- Match logs (match-service)  
- User logs (user-service)

### Log Structure
Logs follow structured JSON format:
```json
{
  "level": 40,
  "time": 1751861217306,
  "pid": 19,
  "hostname": "container-id",
  "reqId": "req-2",
  "action": "login_failed",
  "alias": "test",
  "reason": "invalid_alias",
  "msg": "Login failed: invalid alias"
}
```

### Processing Pipeline
1. **Services** → logs via GELF driver
2. **Logstash** → processes and sends to Elasticsearch
3. **Elasticsearch** → indexes in `logstash-YYYY.MM.DD` indices
4. **Kibana** → visualizes via dashboards

### Created Indices
- `logstash-*`: Pattern for all logs
- Automatic retention configured (old log cleanup)

## 🔧 Troubleshooting

### Dashboard shows "No Data"
```bash
# Check time range (try "Last 24 hours")
# Generate test logs
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"alias":"test","password":"wrong"}'
```

### Services not logging
```bash
# Check container status
make logs

# Restart everything
make restart
```

### Memory issues
Edit `docker-compose.yml` and adjust memory limits:
```yaml
elasticsearch:
  environment:
    - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
  mem_limit: 1g
```

## 📁 Configuration Files

- `docker-compose.yml`: Container configuration
- `services/logs-service/pipeline/logstash.conf`: Processing pipeline
- `services/logs-service/scripts/setup-kibana.sh`: Dashboard auto-creation
- `services/logs-service/scripts/setup-elasticsearch-policies.sh`: Elasticsearch policies
- `Makefile`: Automation commands
