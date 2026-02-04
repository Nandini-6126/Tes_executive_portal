# Tessolve Executive Portal

A role-based enterprise application built with FastAPI, React, and PostgreSQL.

> **Base Version**: This version seeds only essential configuration data (permissions, roles, departments, master data, and initial users). No demo/sample services or inventory data is created - the application starts with a clean slate for you to add your own data.

## Features

- **Services Management**: Track client engagements, resource allocation, and CTI data
- **Products Catalog**: Manage product lifecycle, technology stacks, and deployment status
- **Analytics Engine**: Visual dashboards and executive insights
- **Admin Panel**: User management, roles & permissions, audit logging
- **User Settings**: Theme (Light/Dark/System), compact view, high contrast, notifications

## Tech Stack

- **Backend**: FastAPI (Python 3.11+)
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Database**: PostgreSQL 15+
- **Authentication**: JWT with role-based access control

## Role Hierarchy

| Role | Access Level |
|------|--------------|
| **Admin** | Full system access including user management and audit logs |
| **Manager** | Strategic access including CTI data and executive insights |
| **Engineer** | Operational access to services and products |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (or use Docker)
- pip

---

## Option 1: Using Docker (Easiest)

```bash
# Start PostgreSQL and Backend
docker-compose up -d

# Wait for services to be ready, then seed the database
docker-compose exec backend python scripts/seed_data.py

# Start Frontend (in a separate terminal)
cd frontend
npm install
npm run dev
```

Access:
- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs

---

## Option 2: Local Development (Windows)

### Step 1: Install PostgreSQL

1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer and remember your password (default user: `postgres`)
3. Add PostgreSQL to PATH: `C:\Program Files\PostgreSQL\15\bin`

### Step 2: Create Database

Open **pgAdmin** or **Command Prompt** and run:

```sql
-- Using psql command line:
psql -U postgres

-- Create database
CREATE DATABASE tessolve_portal;

-- Verify
\l
```

Or using **pgAdmin**:
1. Right-click "Databases" → "Create" → "Database"
2. Name: `tessolve_portal`
3. Click "Save"

### Step 3: Setup Backend

```powershell
cd tessolve-executive-portal\backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment (edit .env with your PostgreSQL password)
# Default: DB_USER=postgres, DB_PASSWORD=postgres, DB_NAME=tessolve_portal

# Seed the database
python scripts\seed_data.py

# Run backend
uvicorn app.main:app --reload
```

### Step 4: Setup Frontend

```powershell
cd tessolve-executive-portal\frontend

# Install dependencies
npm install

# Run frontend
npm run dev
```

### Step 5: Access Application

- **Frontend**: http://localhost:5173
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## Option 3: Local Development (Mac/Linux)

### Step 1: Install PostgreSQL

**Mac (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE tessolve_portal;
\q
```

### Step 3: Setup Backend

```bash
cd tessolve-executive-portal/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Seed the database
python scripts/seed_data.py

# Run backend
uvicorn app.main:app --reload
```

### Step 4: Setup Frontend

```bash
cd tessolve-executive-portal/frontend
npm install
npm run dev
```

---

## Environment Configuration

Edit `backend/.env`:

```env
# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tessolve_portal
DB_USER=postgres
DB_PASSWORD=your_password_here

# Or use full URL
# DATABASE_URL=postgresql://postgres:password@localhost:5432/tessolve_portal
```

---

## Default Credentials

| Role | Username | Email | Password |
|------|----------|-------|----------|
| Admin | admin | admin@tessolve.com | Admin@123! |
| Manager | manager | manager@tessolve.com | Manager@123! |
| Engineer | engineer | engineer@tessolve.com | Engineer@123! |

⚠️ **Change these passwords in production!**

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login and get JWT tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout (logs event) |
| POST | `/api/v1/auth/change-password` | Change password |
| GET | `/api/v1/auth/me` | Get current user info |

### Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/services/filter` | Filter/search services |
| GET | `/api/v1/services/{id}` | Get service by ID |
| POST | `/api/v1/services` | Create service |
| PUT | `/api/v1/services/{id}` | Update service |
| DELETE | `/api/v1/services/{id}` | Delete service |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/settings` | Get user settings |
| PUT | `/api/v1/settings` | Update user settings |
| DELETE | `/api/v1/settings` | Reset settings to defaults |

### Admin (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/users` | List all users |
| POST | `/api/v1/admin/users` | Create user |
| PUT | `/api/v1/admin/users/{id}` | Update user |
| DELETE | `/api/v1/admin/users/{id}` | Delete user |

---

## Troubleshooting

### PostgreSQL Connection Issues

**Error: "could not connect to server"**
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check port 5432 is not blocked

**Error: "password authentication failed"**
- Verify password in `.env` matches your PostgreSQL password
- Try resetting postgres password:
  ```sql
  ALTER USER postgres PASSWORD 'newpassword';
  ```

**Error: "database does not exist"**
- Create the database: `CREATE DATABASE tessolve_portal;`

### Windows-Specific Issues

**psycopg2 installation fails:**
```powershell
pip install psycopg2-binary
```

**PostgreSQL not in PATH:**
Add to System Environment Variables:
`C:\Program Files\PostgreSQL\15\bin`

---

## Project Structure

```
tessolve-executive-portal/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   ├── core/            # Security, permissions, exceptions
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   ├── db/              # Database session & migrations
│   │   ├── config.py        # Settings
│   │   └── main.py          # FastAPI app
│   ├── scripts/
│   │   └── seed_data.py     # Database seeder
│   ├── requirements.txt
│   ├── .env                 # Environment variables
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React contexts
│   │   ├── api/             # API client
│   │   └── App.jsx          # Main app
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

---

## License

Proprietary - Tessolve

## Support

Contact: support@tessolve.com
