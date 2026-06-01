# ⛽ FuelTrack Pro — Petrol Bunk Management System

> A full-stack web application built as a **DBMS Mini Project** using the MERN stack (MySQL instead of MongoDB) for managing petrol bunk station operations including fuel stock, employee shifts, vehicle tracking, and sales analytics.

---

## 📌 Project Overview

**FuelTrack Pro** is a complete petrol bunk (fuel station) management system that digitizes and automates the daily operations of a fuel station. It provides real-time fuel stock monitoring, shift-wise sales tracking, vehicle activity logs, and detailed analytics through a modern dark-themed dashboard.

---

## 🎓 Academic Details

| Field | Details |
|---|---|
| **Project Type** | DBMS Mini Project |
| **Subject** | Database Management Systems |
| **Stack** | MERN (MySQL + Express + React + Node.js) |
| **Database** | MySQL |
| **Frontend** | React.js (Vite) |
| **Backend** | Node.js + Express.js |

---

## 🗃️ Database Design

### Tables (7 Total)

#### 1. `Fuel`
Tracks fuel types and current market prices per liter.

| Field | Datatype | Constraints |
|---|---|---|
| fuel_id | INT | PRIMARY KEY, AUTO_INCREMENT |
| fuel_type | VARCHAR(50) | NOT NULL, UNIQUE |
| price_per_liter | DECIMAL(8,2) | NOT NULL, CHECK > 0 |
| description | VARCHAR(255) | NULLABLE |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | AUTO UPDATE |

#### 2. `Tank`
Manages underground storage capacities, fuel types, and real-time remaining stock levels.

| Field | Datatype | Constraints |
|---|---|---|
| tank_id | INT | PRIMARY KEY, AUTO_INCREMENT |
| tank_name | VARCHAR(100) | NOT NULL |
| fuel_id | INT | FOREIGN KEY → Fuel |
| capacity_liters | DECIMAL(10,2) | NOT NULL, CHECK > 0 |
| remaining_stock | DECIMAL(10,2) | DEFAULT 0, CHECK >= 0 |
| last_refilled | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### 3. `Employee`
Contains information on all staff — cashiers, managers, pump operators, and admins.

| Field | Datatype | Constraints |
|---|---|---|
| emp_id | INT | PRIMARY KEY, AUTO_INCREMENT |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(150) | NOT NULL, UNIQUE |
| password | VARCHAR(255) | NOT NULL (bcrypt hashed) |
| role | ENUM | admin, manager, cashier, pump_operator, loader, inventory_clerk, carwash_attendant, field_engineer |
| phone | VARCHAR(15) | NULLABLE |
| hire_date | DATE | NOT NULL |
| is_active | BOOLEAN | DEFAULT TRUE |

#### 4. `Shift`
Coordinates timing slots (Morning, Afternoon, Night) to monitor when sales occur.

| Field | Datatype | Constraints |
|---|---|---|
| shift_id | INT | PRIMARY KEY, AUTO_INCREMENT |
| shift_name | ENUM | Morning, Afternoon, Night |
| start_time | TIME | NOT NULL |
| end_time | TIME | NOT NULL |
| emp_id | INT | FOREIGN KEY → Employee |
| shift_date | DATE | NOT NULL |

#### 5. `Vehicle`
Logs registration details and vehicle profiles refueling at the station.

| Field | Datatype | Constraints |
|---|---|---|
| vehicle_id | INT | PRIMARY KEY, AUTO_INCREMENT |
| reg_number | VARCHAR(20) | NOT NULL, UNIQUE |
| owner_name | VARCHAR(100) | NULLABLE |
| vehicle_type | ENUM | Car, Bike, Truck, Bus, Auto |
| fuel_preference | INT | FOREIGN KEY → Fuel |

#### 6. `Sale`
The central transaction ledger recording liters pumped, billing costs, and timestamps.

| Field | Datatype | Constraints |
|---|---|---|
| sale_id | INT | PRIMARY KEY, AUTO_INCREMENT |
| vehicle_id | INT | FOREIGN KEY → Vehicle |
| fuel_id | INT | FOREIGN KEY → Fuel |
| tank_id | INT | FOREIGN KEY → Tank |
| emp_id | INT | FOREIGN KEY → Employee |
| shift_id | INT | FOREIGN KEY → Shift |
| liters_pumped | DECIMAL(8,2) | NOT NULL, CHECK > 0 |
| price_per_liter | DECIMAL(8,2) | NOT NULL |
| total_amount | DECIMAL(10,2) | GENERATED (liters × price) |
| payment_method | ENUM | Cash, Card, UPI |
| sale_time | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

#### 7. `LowStockAlert`
Auto-generated alert records when any tank drops below 500 liters.

| Field | Datatype | Constraints |
|---|---|---|
| alert_id | INT | PRIMARY KEY, AUTO_INCREMENT |
| tank_id | INT | FOREIGN KEY → Tank |
| remaining_stock | DECIMAL(10,2) | — |
| alert_time | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| is_resolved | BOOLEAN | DEFAULT FALSE |

---

## ⚙️ Triggers

### Trigger 1: `after_sale_deduct_stock`
**Event:** AFTER INSERT on `Sale`  
**Action:** Automatically decreases `remaining_stock` in the `Tank` table by the number of liters pumped in every new sale.

```sql
CREATE TRIGGER after_sale_deduct_stock
AFTER INSERT ON Sale
FOR EACH ROW
BEGIN
  UPDATE Tank
  SET remaining_stock = remaining_stock - NEW.liters_pumped
  WHERE tank_id = NEW.tank_id;
END;
```

### Trigger 2: `alert_low_tank_stock`
**Event:** AFTER UPDATE on `Tank`  
**Action:** Fires an alert into the `LowStockAlert` table when a tank's remaining stock drops below 500 liters.

```sql
CREATE TRIGGER alert_low_tank_stock
AFTER UPDATE ON Tank
FOR EACH ROW
BEGIN
  IF NEW.remaining_stock < 500 AND OLD.remaining_stock >= 500 THEN
    INSERT INTO LowStockAlert (tank_id, remaining_stock, alert_time)
    VALUES (NEW.tank_id, NEW.remaining_stock, NOW());
  END IF;
END;
```

---

## 🔧 Stored Procedures

### 1. `GetDailyRevenue(start_date, end_date)`
Aggregates gross daily revenue, total transactions, and total liters sold over a date range.

### 2. `GetFuelConsumption()`
Compares total liters sold per fuel type to identify market demand distribution.

### 3. `GetShiftPerformance(date)`
Counts individual shift transactions and total revenue per shift for a given date.

### 4. `GetVehicleActivity(reg_number)`
Returns full historical refueling records for a specific vehicle registration number.

---

## ⚡ Core Features

- 🔐 **JWT Authentication** — Secure login with role-based access control
- ⛽ **Fuel Stock Tracking** — Live inventory with automatic deduction via triggers
- 🗄️ **Tank Management** — Monitor tank levels with visual progress bars and low-stock alerts
- 👤 **Employee Management** — Add, edit, manage staff with 8 different roles
- 🕐 **Shift Scheduling** — Assign Morning / Afternoon / Night shifts to employees
- 🚗 **Vehicle Registry** — Register vehicles and view complete refueling history
- 💳 **Sales Ledger** — Record sales with real-time billing estimate (Cash / Card / UPI)
- 📊 **Analytics Reports** — Charts powered by stored procedures for revenue, fuel, and shift data

---

## 📊 Analytics & Reports

| Report | Stored Procedure | Chart Type |
|---|---|---|
| Daily Revenue Trends | `GetDailyRevenue()` | Area Chart |
| Fuel Consumption Breakdown | `GetFuelConsumption()` | Pie + Bar Chart |
| Shift Performance Summary | `GetShiftPerformance()` | Bar Chart + Table |
| Vehicle Activity Log | `GetVehicleActivity()` | Data Table |

---

## 🖥️ Frontend Design

### UI Design
- Dark industrial petroleum aesthetic
- Fonts: **Orbitron** (brand headings) + **Exo 2** (body text)
- Color palette: Amber (#F0A500), Dark surface (#0F1320), Green/Red/Blue status indicators
- Fully responsive layout with sidebar navigation

### Pages / Screens

| Page | Description |
|---|---|
| **Login** | Email + password authentication with demo credentials |
| **Register** | New employee registration form |
| **Dashboard** | KPI stats, tank stock levels, recent transactions |
| **Fuel Types** | CRUD for fuel categories and prices |
| **Tanks** | Tank stock cards with progress bars and refill modal |
| **Employees** | Staff table with role filter pills and Add/Edit modals |
| **Shifts** | Shift scheduling grouped by Morning/Afternoon/Night |
| **Vehicles** | Vehicle cards with refuel history modal |
| **Sales** | Transaction ledger with new sale form and billing estimate |
| **Reports** | 4-tab analytics dashboard with Recharts visualizations |

### Navigation Flow
```
Login → Dashboard → [Fuel / Tanks / Employees / Shifts / Vehicles / Sales / Reports]
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js 18, Vite, React Router v6, Recharts |
| Backend | Node.js, Express.js |
| Database | MySQL 8.x |
| Authentication | JWT (JSON Web Tokens), bcryptjs |
| HTTP Client | Axios |
| Styling | Pure CSS (custom design system) |

---

## 📁 Project Structure

```
petrol-bunk-management/
├── backend/
│   ├── config/
│   │   └── db.js                  # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js      # Login & Register
│   │   ├── fuelController.js      # Fuel CRUD
│   │   ├── tankController.js      # Tank CRUD + Refill
│   │   └── controllers.js         # Employee, Shift, Vehicle, Sale, Reports
│   ├── middleware/
│   │   └── auth.js                # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── fuel.js
│   │   ├── tank.js
│   │   ├── employee.js
│   │   ├── shift.js
│   │   ├── vehicle.js
│   │   ├── sale.js
│   │   └── reports.js
│   ├── database/
│   │   └── schema.sql             # All tables, triggers, procedures, seed data
│   ├── server.js                  # Express entry point
│   ├── .env.example               # Environment variables template
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.js           # Axios instance with JWT interceptor
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   └── Sidebar.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx    # Global auth state
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Fuel.jsx
    │   │   ├── Tank.jsx
    │   │   ├── Employee.jsx
    │   │   ├── Shift.jsx
    │   │   ├── Vehicle.jsx
    │   │   ├── Sale.jsx
    │   │   └── Reports.jsx
    │   ├── styles/
    │   │   └── global.css
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    └── package.json
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18+)
- MySQL (v8+)
- MySQL Workbench (recommended)

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/petrol-bunk-management.git
cd petrol-bunk-management
```

### 2. Set Up the Database
Open MySQL Workbench → connect to your server → open `backend/database/schema.sql` → click Execute ⚡

### 3. Configure Backend Environment
```bash
cd backend
cp .env.example .env
```
Edit `.env` and set your MySQL password:
```
DB_PASSWORD=your_mysql_password
```

### 4. Run the Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs at: `http://localhost:5000`

### 5. Run the Frontend
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

## 🔑 Demo Login Credentials

| Email | Password | Role |
|---|---|---|
| admin@fueltrack.com | Admin@123 | Admin |

> ⚠️ **Note:** After importing the schema, run the following in MySQL Workbench to set the correct password hash:
> ```sql
> UPDATE Employee SET password = '<bcrypt_hash>' WHERE email = 'admin@fueltrack.com';
> ```
> Generate the hash by running in the backend folder:
> ```bash
> node -e "require('bcryptjs').hash('Admin@123',10).then(h=>console.log(h))"
> ```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register employee |
| GET | `/api/fuels` | Get all fuel types |
| POST | `/api/fuels` | Add fuel type |
| GET | `/api/tanks` | Get all tanks |
| PUT | `/api/tanks/:id/refill` | Refill a tank |
| GET | `/api/employees` | Get all employees |
| GET | `/api/sales` | Get sales ledger |
| POST | `/api/sales` | Record new sale |
| GET | `/api/sales/today` | Today's stats |
| GET | `/api/reports/daily-revenue` | Daily revenue (stored proc) |
| GET | `/api/reports/fuel-consumption` | Fuel breakdown (stored proc) |
| GET | `/api/reports/shift-performance` | Shift report (stored proc) |
| GET | `/api/reports/vehicle-activity` | Vehicle history (stored proc) |

---

## 👥 Employee Roles

| Role | Access Level |
|---|---|
| 👑 Admin | Full system access |
| 🏢 Manager | Staff, tanks, fuels, reports |
| 💳 Cashier | Record sales, view dashboard |
| ⛽ Pump Operator | Fuel dispensing operations |
| 🏗️ Loader | Tanker loading and unloading |
| 📦 Stock & Inventory Clerk | Tank stock management |
| 🚿 Car Wash Attendant | Car wash facility |
| 🔧 Field Service Engineer | Equipment maintenance |

---

## 📸 Screenshots

| Screen | Description |
|---|---|
| Login Page | Dark themed login with demo credentials |
| Dashboard | KPI cards, tank levels, recent transactions |
| Tanks Page | Stock progress bars with refill modal |
| Sales Ledger | Transaction table with payment badges |
| Reports | Area chart, pie chart, bar charts |

---

## 🙏 Acknowledgements

- [React](https://reactjs.org/)
- [Express.js](https://expressjs.com/)
- [MySQL](https://www.mysql.com/)
- [Recharts](https://recharts.org/)
- [Vite](https://vitejs.dev/)

---

*Developed as a DBMS Mini Project*
