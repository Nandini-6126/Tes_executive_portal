# Tessolve Executive Portal - Manual Setup Guide

## Prerequisites

1. **PostgreSQL** installed and running
2. **Python 3.10+** installed
3. **Node.js 18+** installed

---

## Step 1: Create PostgreSQL Database

Open pgAdmin or psql and run:

```sql
CREATE DATABASE tessolve_portal;
```

Or via command line:
```bash
psql -U postgres -c "CREATE DATABASE tessolve_portal;"
```

---

## Step 2: Configure Backend

### 2.1 Navigate to backend folder
```powershell
cd backend
```

### 2.2 Create and activate virtual environment
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2.3 Install dependencies
```powershell
pip install -r requirements.txt
```

### 2.4 Configure database connection

Edit `backend/.env` file and set your PostgreSQL credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tessolve_portal
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DEBUG=True
```

### 2.5 Run seed script to create tables and initial data
```powershell
python scripts/seed_data.py
```

You should see output like:
```
Creating database tables...
✓ Tables created
Seeding permissions...
✓ 16 permissions created/verified
Seeding roles...
✓ 3 roles created/verified with permissions
...
✅ Database seeding completed successfully!
```

### 2.6 Start backend server
```powershell
uvicorn app.main:app --reload --port 8000
```

**Test the backend:**
- Open browser: http://localhost:8000
- API docs: http://localhost:8000/docs

---

## Step 3: Configure Frontend

### 3.1 Open a NEW terminal and navigate to frontend folder
```powershell
cd frontend
```

### 3.2 Install dependencies
```powershell
npm install
```

### 3.3 Start frontend server
```powershell
npm run dev
```

---

## Step 4: Login and Test

1. Open browser: http://localhost:3000 (or whatever port Vite shows)

2. Login with one of these accounts:

| Role     | Username | Password      |
|----------|----------|---------------|
| Admin    | admin    | Admin@123!    |
| Manager  | manager  | Manager@123!  |
| Engineer | engineer | Engineer@123! |

3. **Test adding a service:**
   - Login as `manager` with password `Manager@123!`
   - Go to Services page
   - Click "Add Service"
   - Select "New Customer" or "Existing Customer"
   - Fill in required fields:
     - **Service Name**: (required)
     - **Customer Name**: (required)
   - Click "Create Service"

---

## Troubleshooting

### "Failed to create service" error

1. **Check backend terminal** for error messages
2. **Check browser console** (F12 > Console tab) for errors
3. **Verify database connection**:
   ```powershell
   # In backend folder with venv activated
   python -c "from app.db.session import engine; print(engine.url)"
   ```

### "CORS error" in browser

Make sure:
- Backend is running on port 8000
- Frontend is using the proxy (check vite.config.js)

### "404 Not Found" for API calls

- Verify backend is running: http://localhost:8000/docs
- Check that frontend proxy is configured in vite.config.js

### Database not seeded

Run the seed script again:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python scripts/seed_data.py
```

---

## API Endpoints for Testing

You can test API directly using http://localhost:8000/docs

### Login (get token):
```
POST /api/v1/auth/login
Body: {"username": "manager", "password": "Manager@123!"}
```

### Create service:
```
POST /api/v1/services
Headers: Authorization: Bearer <your_token>
Body: {
  "name": "Test Service",
  "customer_name": "Test Customer",
  "customer_type": "new",
  "status": "draft"
}
```

### Get all services:
```
POST /api/v1/services/filter
Headers: Authorization: Bearer <your_token>
Body: {"page": 1, "page_size": 50}
```
