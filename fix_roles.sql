-- Run this in MySQL Workbench to add new roles
USE petrol_bunk_db;

ALTER TABLE Employee 
MODIFY COLUMN role ENUM(
  'admin',
  'manager',
  'cashier',
  'loader',
  'pump_operator',
  'inventory_clerk',
  'carwash_attendant',
  'field_engineer'
) NOT NULL DEFAULT 'cashier';

SELECT 'Roles updated successfully!' AS status;
