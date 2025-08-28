# 🐳 Docker Development Setup

Complete Docker setup for the Car Rental Platform with database monitoring and easy management.

## 📋 Prerequisites

- Docker Desktop or Docker Engine (v20.10+)
- Docker Compose (v2.0+)
- At least 4GB RAM available for Docker

## 🚀 Quick Start

### 1. **Start All Services**
```bash
# Using helper script (recommended)
./scripts/docker-dev.sh start

# Or manually
docker compose up -d
```

### 2. **Setup Database**
```bash
# Initialize database with migrations and seed data
./scripts/docker-dev.sh setup-db
```

### 3. **Access Services**
- **🚗 API**: http://localhost:3000
- **🐘 pgAdmin**: http://localhost:5050 (admin@carrentals.local / admin123)
- **🔴 Redis Commander**: http://localhost:8081 (admin / admin123)
- **📊 API Health**: http://localhost:3000/health

## 🛠️ Development Commands

### **Service Management**
```bash
# Start all services
./scripts/docker-dev.sh start

# Stop all services
./scripts/docker-dev.sh stop

# Restart all services
./scripts/docker-dev.sh restart

# Check service status
./scripts/docker-dev.sh status
```

### **Database Operations**
```bash
# Setup database (run migrations + seed)
./scripts/docker-dev.sh setup-db

# Reset database (⚠️ deletes all data)
./scripts/docker-dev.sh reset-db

# Create backup
./scripts/docker-dev.sh backup-db

# Open Prisma Studio (in container)
docker-compose exec api npx prisma studio
```

### **Debugging & Logs**
```bash
# View API logs (with live updates)
./scripts/docker-dev.sh logs api

# View database logs
./scripts/docker-dev.sh logs postgres

# Open shell in API container
./scripts/docker-dev.sh shell

# Debug with Node.js inspector (port 9229)
# Attach your IDE debugger to localhost:9229
```

### **Development Workflow**
```bash
# 1. Start services
./scripts/docker-dev.sh start

# 2. Setup database
./scripts/docker-dev.sh setup-db

# 3. View logs during development
./scripts/docker-dev.sh logs api

# 4. Make code changes (auto-reload enabled)
# Files are mounted as volumes - changes reflect immediately

# 5. Test onboarding flow
./test-complete-onboarding-flow.sh
```

## 📊 Services Overview

### **PostgreSQL Database**
- **Image**: `postgis/postgis:15-3.3-alpine`
- **Port**: 5432
- **Features**: PostGIS enabled for geospatial data
- **Credentials**: postgres/postgres
- **Volume**: Persistent data storage

### **pgAdmin (Database Management)**
- **Port**: 5050
- **Login**: admin@carrentals.local / admin123
- **Features**: Visual database management, query editor
- **Pre-configured**: Connection to PostgreSQL

### **Redis (Caching & Sessions)**
- **Port**: 6379
- **Password**: redis_password
- **Features**: Persistence enabled, optimized config
- **Volume**: Persistent data storage

### **Redis Commander (Redis Management)**
- **Port**: 8081
- **Login**: admin / admin123
- **Features**: Visual Redis data browser, real-time monitoring

### **API Application**
- **Port**: 3000 (HTTP), 9229 (Debug)
- **Features**: Hot reload, debug mode, health checks
- **Logs**: Persistent logging to `./logs/`

## 🗄️ Data Management

### **Database Schema**
The database includes all 13 tables from the ERD:
- Users, Vehicles, Bookings, Payments
- Hubs, Trips, Reviews, Notifications
- KYC Documents, Audit Logs, System Settings

### **Seed Data**
- 3 Sample users (renter, owner, admin)
- 3 Sample vehicles with PostGIS locations
- Sample bookings and payments
- Notification templates
- System configuration

### **Backups**
```bash
# Create backup
./scripts/docker-dev.sh backup-db

# Restore from backup
docker-compose exec postgres psql -U postgres car_rental < backups/backup_file.sql
```

## 🔧 Configuration Files

### **Environment Variables**
- `docker.env` - Docker-specific environment
- `env.example` - Local development template

### **Docker Configuration**
- `docker-compose.yml` - Multi-service setup
- `Dockerfile` - Multi-stage build (dev/prod)

### **Database Configuration**
- `scripts/init-db.sql` - Database initialization
- `pgadmin/servers.json` - pgAdmin pre-configuration

### **Redis Configuration**
- `redis/redis.conf` - Optimized Redis settings

## 🚨 Troubleshooting

### **Common Issues**

1. **Port Conflicts**
   ```bash
   # Check what's using the ports
   lsof -i :3000,5432,6379,5050,8081
   
   # Stop conflicting services or change ports in docker-compose.yml
   ```

2. **Database Connection Issues**
   ```bash
   # Check PostgreSQL health
   docker-compose logs postgres
   
   # Restart database
   docker-compose restart postgres
   ```

3. **API Won't Start**
   ```bash
   # Check API logs
   ./scripts/docker-dev.sh logs api
   
   # Rebuild API container
   docker-compose build api
   ```

4. **Prisma Issues**
   ```bash
   # Regenerate Prisma client
   docker-compose exec api npx prisma generate
   
   # Reset database schema
   ./scripts/docker-dev.sh reset-db
   ```

### **Clean Start**
```bash
# Stop everything and clean up
./scripts/docker-dev.sh cleanup

# Start fresh
./scripts/docker-dev.sh start
./scripts/docker-dev.sh setup-db
```

## 🔒 Security Notes

### **Development Security**
- Default passwords are for **development only**
- Redis requires authentication
- pgAdmin uses secure session management
- PostGIS enables spatial security features

### **Production Considerations**
- Change all default passwords
- Use Docker secrets for sensitive data
- Enable SSL/TLS for all connections
- Implement proper backup strategies
- Use read-only containers where possible

## 📈 Performance Monitoring

### **Built-in Monitoring**
- Health checks for all services
- Redis performance metrics via Redis Commander
- PostgreSQL query analysis via pgAdmin
- Application metrics at `/health` endpoint

### **Resource Usage**
- **Memory**: ~2GB for all services
- **CPU**: Low usage during development
- **Storage**: ~500MB for base images + data

## 🔄 CI/CD Integration

### **GitHub Actions**
```yaml
# Example workflow step
- name: Run Docker Tests
  run: |
    docker-compose up -d postgres redis
    docker-compose run --rm api npm test
    docker-compose down
```

### **Production Deployment**
```bash
# Build production image
docker build --target production -t car-rental-api:latest .

# Run with production compose
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🎯 Next Steps

1. **Start Development**: `./scripts/docker-dev.sh start`
2. **Setup Database**: `./scripts/docker-dev.sh setup-db`
3. **Test API**: Visit http://localhost:3000/health
4. **Explore Database**: Visit http://localhost:5050
5. **Monitor Redis**: Visit http://localhost:8081
6. **Run Tests**: `./test-complete-onboarding-flow.sh`

**Happy coding! 🚗💨**
