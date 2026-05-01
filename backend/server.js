const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize users file if it doesn't exist OR if you want to reset credentials
const usersFile = path.join(dataDir, 'users.json');
if (!fs.existsSync(usersFile)) {
  const bcrypt = require('bcryptjs');
  const defaultUsers = [
    {
      id: 1,
      username: 'Darshan@siqol.com',
      password: bcrypt.hashSync('Darshan@123', 10),
      fullName: 'Darshan (Admin)',
      email: 'Darshan@siqol.com',
      role: 'admin',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      username: 'user',
      password: bcrypt.hashSync('user123', 10),
      fullName: 'Normal User',
      email: 'user@siqol.com',
      role: 'user',
      createdAt: new Date().toISOString()
    }
  ];
  fs.writeFileSync(usersFile, JSON.stringify(defaultUsers, null, 2));
  console.log('✅ Default users created');
}

// Initialize inventory file if it doesn't exist
const inventoryFile = path.join(dataDir, 'inventory.json');
if (!fs.existsSync(inventoryFile)) {
  const sampleInventory = [
    {
      id: 1,
      assetTag: 'HW-001',
      deviceName: 'Dell Latitude 5520',
      category: 'Laptop',
      manufacturer: 'Dell',
      model: 'Latitude 5520',
      serialNumber: 'SN-DL5520-001',
      status: 'Active',
      assignedTo: 'John Smith',
      department: 'Engineering',
      location: 'Building A - Floor 2',
      purchaseDate: '2023-01-15',
      warrantyExpiry: '2026-01-15',
      cost: 1200.00,
      notes: 'Primary work laptop'
    },
    {
      id: 2,
      assetTag: 'HW-002',
      deviceName: 'HP ProDesk 400',
      category: 'Desktop',
      manufacturer: 'HP',
      model: 'ProDesk 400 G7',
      serialNumber: 'SN-HP400-002',
      status: 'Active',
      assignedTo: 'Jane Doe',
      department: 'Finance',
      location: 'Building B - Floor 1',
      purchaseDate: '2023-03-20',
      warrantyExpiry: '2026-03-20',
      cost: 850.00,
      notes: ''
    },
    {
      id: 3,
      assetTag: 'HW-003',
      deviceName: 'Cisco Switch 2960',
      category: 'Network Equipment',
      manufacturer: 'Cisco',
      model: 'Catalyst 2960-X',
      serialNumber: 'SN-CS2960-003',
      status: 'Active',
      assignedTo: 'IT Department',
      department: 'IT',
      location: 'Server Room',
      purchaseDate: '2022-06-10',
      warrantyExpiry: '2025-06-10',
      cost: 3500.00,
      notes: 'Main floor switch'
    },
    {
      id: 4,
      assetTag: 'HW-004',
      deviceName: 'Samsung Monitor 27"',
      category: 'Monitor',
      manufacturer: 'Samsung',
      model: 'S27R650',
      serialNumber: 'SN-SM27-004',
      status: 'Active',
      assignedTo: 'John Smith',
      department: 'Engineering',
      location: 'Building A - Floor 2',
      purchaseDate: '2023-01-15',
      warrantyExpiry: '2026-01-15',
      cost: 350.00,
      notes: 'Secondary monitor'
    },
    {
      id: 5,
      assetTag: 'HW-005',
      deviceName: 'HP LaserJet Pro',
      category: 'Printer',
      manufacturer: 'HP',
      model: 'LaserJet Pro M404dn',
      serialNumber: 'SN-HPLJ-005',
      status: 'Maintenance',
      assignedTo: 'Shared',
      department: 'Operations',
      location: 'Building A - Floor 1',
      purchaseDate: '2022-09-01',
      warrantyExpiry: '2025-09-01',
      cost: 450.00,
      notes: 'Needs toner replacement'
    },
    {
      id: 6,
      assetTag: 'HW-006',
      deviceName: 'Lenovo ThinkPad X1',
      category: 'Laptop',
      manufacturer: 'Lenovo',
      model: 'ThinkPad X1 Carbon Gen 10',
      serialNumber: 'SN-LTX1-006',
      status: 'Retired',
      assignedTo: 'Unassigned',
      department: 'IT Storage',
      location: 'Warehouse',
      purchaseDate: '2020-04-15',
      warrantyExpiry: '2023-04-15',
      cost: 1450.00,
      notes: 'End of life - replaced'
    }
  ];
  fs.writeFileSync(inventoryFile, JSON.stringify(sampleInventory, null, 2));
  console.log('✅ Sample inventory created');
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/logs', require('./routes/logs'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SIQOL Hardware Inventory API is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 SIQOL Hardware Inventory Server running on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}/api`);
  console.log(`\n👤 Default Users:`);
  console.log(`   Admin  - Username: Darshan@siqol.com  | Password: Darshan@123`);
  console.log(`   User   - Username: user               | Password: user123\n`);
});