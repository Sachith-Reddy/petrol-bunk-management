require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes     = require('./routes/auth');
const fuelRoutes     = require('./routes/fuel');
const tankRoutes     = require('./routes/tank');
const employeeRoutes = require('./routes/employee');
const shiftRoutes    = require('./routes/shift');
const vehicleRoutes  = require('./routes/vehicle');
const saleRoutes     = require('./routes/sale');
const reportRoutes   = require('./routes/reports');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/fuels',     fuelRoutes);
app.use('/api/tanks',     tankRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/shifts',    shiftRoutes);
app.use('/api/vehicles',  vehicleRoutes);
app.use('/api/sales',     saleRoutes);
app.use('/api/reports',   reportRoutes);

app.get('/', (_, res) => res.json({ message: 'Petrol Bunk API running ✅' }));

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
