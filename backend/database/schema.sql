-- ============================================================
--  PETROL BUNK MANAGEMENT SYSTEM  |  DBMS Mini Project
--  Database: petrol_bunk_db
-- ============================================================

CREATE DATABASE IF NOT EXISTS petrol_bunk_db;
USE petrol_bunk_db;

-- ============================================================
-- TABLE 1: Fuel
-- Tracks fuel types and current market price per liter
-- ============================================================
CREATE TABLE Fuel (
  fuel_id       INT           AUTO_INCREMENT PRIMARY KEY,
  fuel_type     VARCHAR(50)   NOT NULL UNIQUE,
  price_per_liter DECIMAL(8,2) NOT NULL CHECK (price_per_liter > 0),
  description   VARCHAR(255),
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 2: Tank
-- Underground storage — capacity, fuel type, real-time stock
-- ============================================================
CREATE TABLE Tank (
  tank_id          INT            AUTO_INCREMENT PRIMARY KEY,
  tank_name        VARCHAR(100)   NOT NULL,
  fuel_id          INT            NOT NULL,
  capacity_liters  DECIMAL(10,2)  NOT NULL CHECK (capacity_liters > 0),
  remaining_stock  DECIMAL(10,2)  NOT NULL DEFAULT 0,
  last_refilled    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fuel_id) REFERENCES Fuel(fuel_id) ON DELETE RESTRICT,
  CONSTRAINT chk_stock CHECK (
    remaining_stock >= 0 AND remaining_stock <= capacity_liters
  )
);

-- ============================================================
-- TABLE 3: Employee
-- Cashiers, bunk managers, admins — also serves as app users
-- ============================================================
CREATE TABLE Employee (
  emp_id       INT            AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100)   NOT NULL,
  email        VARCHAR(150)   NOT NULL UNIQUE,
  password     VARCHAR(255)   NOT NULL,
  role         ENUM('admin','manager','cashier') NOT NULL DEFAULT 'cashier',
  phone        VARCHAR(15),
  hire_date    DATE           NOT NULL,
  is_active    BOOLEAN        DEFAULT TRUE,
  created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 4: Shift
-- Morning / Afternoon / Night slots linked to an employee
-- ============================================================
CREATE TABLE Shift (
  shift_id    INT            AUTO_INCREMENT PRIMARY KEY,
  shift_name  ENUM('Morning','Afternoon','Night') NOT NULL,
  start_time  TIME           NOT NULL,
  end_time    TIME           NOT NULL,
  emp_id      INT            NOT NULL,
  shift_date  DATE           NOT NULL,
  created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emp_id) REFERENCES Employee(emp_id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 5: Vehicle
-- Registration details of vehicles that refuel at the station
-- ============================================================
CREATE TABLE Vehicle (
  vehicle_id       INT           AUTO_INCREMENT PRIMARY KEY,
  reg_number       VARCHAR(20)   NOT NULL UNIQUE,
  owner_name       VARCHAR(100),
  vehicle_type     ENUM('Car','Bike','Truck','Bus','Auto') NOT NULL DEFAULT 'Car',
  fuel_preference  INT,
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fuel_preference) REFERENCES Fuel(fuel_id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE 6: Sale  (Central transaction ledger)
-- Records every fuel-dispensing event
-- ============================================================
CREATE TABLE Sale (
  sale_id         INT            AUTO_INCREMENT PRIMARY KEY,
  vehicle_id      INT            NOT NULL,
  fuel_id         INT            NOT NULL,
  tank_id         INT            NOT NULL,
  emp_id          INT            NOT NULL,
  shift_id        INT            NOT NULL,
  liters_pumped   DECIMAL(8,2)   NOT NULL CHECK (liters_pumped > 0),
  price_per_liter DECIMAL(8,2)   NOT NULL,
  total_amount    DECIMAL(10,2)  GENERATED ALWAYS AS (liters_pumped * price_per_liter) STORED,
  payment_method  ENUM('Cash','Card','UPI') NOT NULL DEFAULT 'Cash',
  sale_time       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id)  ON DELETE RESTRICT,
  FOREIGN KEY (fuel_id)    REFERENCES Fuel(fuel_id)         ON DELETE RESTRICT,
  FOREIGN KEY (tank_id)    REFERENCES Tank(tank_id)          ON DELETE RESTRICT,
  FOREIGN KEY (emp_id)     REFERENCES Employee(emp_id)       ON DELETE RESTRICT,
  FOREIGN KEY (shift_id)   REFERENCES Shift(shift_id)        ON DELETE RESTRICT
);

-- ============================================================
-- TABLE 7: LowStockAlert  (used by trigger below)
-- ============================================================
CREATE TABLE LowStockAlert (
  alert_id        INT            AUTO_INCREMENT PRIMARY KEY,
  tank_id         INT            NOT NULL,
  remaining_stock DECIMAL(10,2),
  alert_time      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  is_resolved     BOOLEAN        DEFAULT FALSE,
  FOREIGN KEY (tank_id) REFERENCES Tank(tank_id) ON DELETE CASCADE
);

-- ============================================================
-- TRIGGER 1: after_sale_deduct_stock
-- Automatically decreases tank's remaining_stock after each sale
-- ============================================================
DELIMITER $$
CREATE TRIGGER after_sale_deduct_stock
AFTER INSERT ON Sale
FOR EACH ROW
BEGIN
  UPDATE Tank
  SET remaining_stock = remaining_stock - NEW.liters_pumped
  WHERE tank_id = NEW.tank_id;
END$$
DELIMITER ;

-- ============================================================
-- TRIGGER 2: alert_low_tank_stock
-- Fires an alert when tank stock drops below 500 liters
-- ============================================================
DELIMITER $$
CREATE TRIGGER alert_low_tank_stock
AFTER UPDATE ON Tank
FOR EACH ROW
BEGIN
  IF NEW.remaining_stock < 500 AND OLD.remaining_stock >= 500 THEN
    INSERT INTO LowStockAlert (tank_id, remaining_stock, alert_time)
    VALUES (NEW.tank_id, NEW.remaining_stock, NOW());
  END IF;
END$$
DELIMITER ;

-- ============================================================
-- STORED PROCEDURE 1: GetDailyRevenue
-- Aggregates revenue and liters sold over a date range
-- ============================================================
DELIMITER $$
CREATE PROCEDURE GetDailyRevenue(
  IN p_start DATE,
  IN p_end   DATE
)
BEGIN
  SELECT
    DATE(sale_time)         AS sale_date,
    COUNT(sale_id)          AS total_transactions,
    SUM(total_amount)       AS gross_revenue,
    SUM(liters_pumped)      AS total_liters,
    AVG(total_amount)       AS avg_bill_amount
  FROM Sale
  WHERE DATE(sale_time) BETWEEN p_start AND p_end
  GROUP BY DATE(sale_time)
  ORDER BY sale_date ASC;
END$$
DELIMITER ;

-- ============================================================
-- STORED PROCEDURE 2: GetFuelConsumption
-- Compares total liters sold per fuel type
-- ============================================================
DELIMITER $$
CREATE PROCEDURE GetFuelConsumption()
BEGIN
  SELECT
    f.fuel_id,
    f.fuel_type,
    COALESCE(SUM(s.liters_pumped), 0)  AS total_liters_sold,
    COALESCE(SUM(s.total_amount), 0)   AS total_revenue,
    COUNT(s.sale_id)                   AS transaction_count,
    COALESCE(AVG(s.liters_pumped), 0)  AS avg_liters_per_txn
  FROM Fuel f
  LEFT JOIN Sale s ON f.fuel_id = s.fuel_id
  GROUP BY f.fuel_id, f.fuel_type
  ORDER BY total_liters_sold DESC;
END$$
DELIMITER ;

-- ============================================================
-- STORED PROCEDURE 3: GetShiftPerformance
-- Shift-wise sales count and revenue for a given date
-- ============================================================
DELIMITER $$
CREATE PROCEDURE GetShiftPerformance(IN p_date DATE)
BEGIN
  SELECT
    sh.shift_id,
    sh.shift_name,
    sh.start_time,
    sh.end_time,
    e.name                           AS employee_name,
    e.role,
    COUNT(s.sale_id)                 AS total_transactions,
    COALESCE(SUM(s.total_amount), 0) AS total_revenue,
    COALESCE(SUM(s.liters_pumped),0) AS total_liters
  FROM Shift sh
  JOIN Employee e ON sh.emp_id = e.emp_id
  LEFT JOIN Sale s ON sh.shift_id = s.shift_id
  WHERE sh.shift_date = p_date
  GROUP BY sh.shift_id, sh.shift_name, sh.start_time, sh.end_time,
           e.name, e.role
  ORDER BY sh.start_time ASC;
END$$
DELIMITER ;

-- ============================================================
-- STORED PROCEDURE 4: GetVehicleActivity
-- Historical refueling records for a specific vehicle reg no.
-- ============================================================
DELIMITER $$
CREATE PROCEDURE GetVehicleActivity(IN p_reg VARCHAR(20))
BEGIN
  SELECT
    v.reg_number,
    v.owner_name,
    v.vehicle_type,
    f.fuel_type,
    s.liters_pumped,
    s.total_amount,
    s.payment_method,
    e.name  AS served_by,
    sh.shift_name,
    s.sale_time
  FROM Sale s
  JOIN Vehicle  v  ON s.vehicle_id = v.vehicle_id
  JOIN Fuel     f  ON s.fuel_id    = f.fuel_id
  JOIN Employee e  ON s.emp_id     = e.emp_id
  JOIN Shift    sh ON s.shift_id   = sh.shift_id
  WHERE v.reg_number = p_reg
  ORDER BY s.sale_time DESC;
END$$
DELIMITER ;

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO Fuel (fuel_type, price_per_liter, description) VALUES
  ('Petrol', 102.50, 'Regular unleaded petrol'),
  ('Diesel', 89.75,  'High-speed diesel'),
  ('CNG',    78.00,  'Compressed Natural Gas');

INSERT INTO Tank (tank_name, fuel_id, capacity_liters, remaining_stock) VALUES
  ('Tank A - Petrol Main',    1, 10000.00, 7500.00),
  ('Tank B - Petrol Reserve', 1,  5000.00, 3200.00),
  ('Tank C - Diesel Main',    2, 15000.00,11200.00),
  ('Tank D - CNG',            3,  5000.00, 3800.00);

-- Admin user (password: Admin@123)
INSERT INTO Employee (name, email, password, role, phone, hire_date) VALUES
  ('Station Admin',  'admin@fueltrack.com',
   '$2b$10$rOuPzMQx5z8eWkH2oN3W4.9tVfVBsm3pjL.nD4R7yGe8QjXoF7dPW',
   'admin', '9876543210', '2023-01-01'),
  ('Ravi Kumar',     'ravi@fueltrack.com',
   '$2b$10$rOuPzMQx5z8eWkH2oN3W4.9tVfVBsm3pjL.nD4R7yGe8QjXoF7dPW',
   'manager', '9123456780', '2023-03-15'),
  ('Suresh Babu',    'suresh@fueltrack.com',
   '$2b$10$rOuPzMQx5z8eWkH2oN3W4.9tVfVBsm3pjL.nD4R7yGe8QjXoF7dPW',
   'cashier', '9988776655', '2024-01-10');

INSERT INTO Shift (shift_name, start_time, end_time, emp_id, shift_date) VALUES
  ('Morning',   '06:00:00', '14:00:00', 2, CURDATE()),
  ('Afternoon', '14:00:00', '22:00:00', 3, CURDATE()),
  ('Night',     '22:00:00', '06:00:00', 2, CURDATE());

INSERT INTO Vehicle (reg_number, owner_name, vehicle_type, fuel_preference) VALUES
  ('KA-01-AB-1234', 'Anand Sharma',   'Car',   1),
  ('KA-02-CD-5678', 'Priya Nair',     'Bike',  1),
  ('TN-09-EF-9012', 'Logistics Ltd',  'Truck', 2),
  ('MH-12-GH-3456', 'City Travels',   'Bus',   2),
  ('KA-03-IJ-7890', 'Auto Driver',    'Auto',  3);
