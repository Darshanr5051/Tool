const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const inventoryFile = path.join(__dirname, '..', 'data', 'inventory.json');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype) ||
        file.originalname.match(/\.(xlsx|xls|csv)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const normalizeKey = (k) => String(k || '')
  .trim()
  .toLowerCase()
  .replace(/[\s\-]+/g, '_')
  .replace(/[^a-z0-9_]/g, '');

const getRowValue = (row, candidates) => {
  if (!row) return undefined;
  const normalizedRow = Object.keys(row).reduce((acc, key) => {
    acc[normalizeKey(key)] = row[key];
    return acc;
  }, {});

  for (const c of candidates) {
    const v = normalizedRow[normalizeKey(c)];
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return undefined;
};

const findHeaderRowIndex = (rows) => {
  const requiredSignals = [
    'asset', 'tag', 'device', 'name', 'serial', 'status', 'department', 'assigned',
    'laptop', 'sticker', 'employee', 'emp'
  ];
  const maxScan = Math.min(rows.length, 30);
  for (let i = 0; i < maxScan; i++) {
    const r = rows[i] || [];
    const normalizedCells = r.map((c) => normalizeKey(c));
    const hitCount = requiredSignals.reduce((acc, sig) => (
      normalizedCells.some((cell) => cell.includes(sig)) ? acc + 1 : acc
    ), 0);

    const hasLaptopAllocationHeaders =
      normalizedCells.some((c) => c.includes('laptop') || c.includes('sticker')) &&
      normalizedCells.some((c) => c.includes('emp') || c.includes('employee'));

    if (hasLaptopAllocationHeaders || hitCount >= 2) return i;
  }
  return -1;
};

const buildObjectsFromSheet = (worksheet) => {
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (!rows || rows.length === 0) return [];

  const headerRowIndex = findHeaderRowIndex(rows);
  if (headerRowIndex === -1) return [];

  const header = rows[headerRowIndex].map((h) => String(h || '').trim());
  const dataRows = rows.slice(headerRowIndex + 1);

  const objects = [];
  for (const r of dataRows) {
    const obj = {};
    for (let c = 0; c < header.length; c++) {
      const key = header[c];
      if (!key) continue;
      obj[key] = r?.[c] ?? '';
    }
    const hasAnyValue = Object.values(obj).some((v) => v !== undefined && v !== null && String(v).trim() !== '');
    if (!hasAnyValue) continue;
    objects.push(obj);
  }
  return objects;
};

const getInventory = () => {
  const data = fs.readFileSync(inventoryFile, 'utf8');
  return JSON.parse(data);
};

const saveInventory = (inventory) => {
  fs.writeFileSync(inventoryFile, JSON.stringify(inventory, null, 2));
};

// @route   GET /api/inventory
// @desc    Get all inventory items
// @access  Private
router.get('/', auth, (req, res) => {
  try {
    const inventory = getInventory();
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/inventory/stats
// @desc    Get inventory statistics
// @access  Private
router.get('/stats', auth, (req, res) => {
  try {
    const inventory = getInventory();

    const stats = {
      totalAssets: inventory.length,
      activeAssets: inventory.filter(i => i.status === 'Active').length,
      maintenanceAssets: inventory.filter(i => i.status === 'Maintenance').length,
      retiredAssets: inventory.filter(i => i.status === 'Retired').length,
      totalValue: inventory.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0),
      categories: {},
      departments: {},
      statusBreakdown: {}
    };

    inventory.forEach(item => {
      // Category count
      if (item.category) {
        stats.categories[item.category] = (stats.categories[item.category] || 0) + 1;
      }
      // Department count
      if (item.department) {
        stats.departments[item.department] = (stats.departments[item.department] || 0) + 1;
      }
      // Status count
      if (item.status) {
        stats.statusBreakdown[item.status] = (stats.statusBreakdown[item.status] || 0) + 1;
      }
    });

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/inventory
// @desc    Add new inventory item
// @access  Private/Admin
router.post('/', auth, auth.adminOnly, (req, res) => {
  try {
    const inventory = getInventory();
    const newItem = {
      id: inventory.length > 0 ? Math.max(...inventory.map(i => i.id)) + 1 : 1,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    inventory.push(newItem);
    saveInventory(inventory);
    
    logger.addLog(req.user, 'Asset Added', `Admin added asset: ${newItem.deviceName || 'Unknown'} (${newItem.assetTag})`);
    
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/inventory/:id
// @desc    Update inventory item
// @access  Private/Admin
router.put('/:id', auth, auth.adminOnly, (req, res) => {
  try {
    const inventory = getInventory();
    const itemId = parseInt(req.params.id);
    const index = inventory.findIndex(i => i.id === itemId);

    if (index === -1) {
      return res.status(404).json({ message: 'Item not found' });
    }

    inventory[index] = {
      ...inventory[index],
      ...req.body,
      id: itemId,
      updatedAt: new Date().toISOString()
    };

    saveInventory(inventory);
    
    logger.addLog(req.user, 'Asset Updated', `Admin updated asset: ${inventory[index].deviceName || 'Unknown'} (${inventory[index].assetTag})`);
    
    res.json(inventory[index]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/inventory/:id
// @desc    Delete inventory item
// @access  Private/Admin
router.delete('/:id', auth, auth.adminOnly, (req, res) => {
  try {
    const inventory = getInventory();
    const itemId = parseInt(req.params.id);
    const filteredInventory = inventory.filter(i => i.id !== itemId);

    if (filteredInventory.length === inventory.length) {
      return res.status(404).json({ message: 'Item not found' });
    }

    saveInventory(filteredInventory);
    
    logger.addLog(req.user, 'Asset Deleted', `Admin deleted asset ID: ${itemId}`);
    
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/inventory/upload
// @desc    Upload Excel file to import inventory
// @access  Private/Admin
router.post('/upload', auth, auth.adminOnly, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const replaceExisting = req.body && (req.body.replace === 'true' || req.body.replace === true);

    const workbook = XLSX.readFile(req.file.path);
    const sheetNames = workbook.SheetNames;
    const allData = [];

    sheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = buildObjectsFromSheet(worksheet);
      jsonData.forEach((row) => {
        allData.push({
          ...row,
          _sheetName: sheetName,
        });
      });
    });

    const inventory = replaceExisting ? [] : getInventory();
    let nextId = inventory.length > 0 ? Math.max(...inventory.map(i => i.id)) + 1 : 1;

    const newItems = allData.map((row, index) => {
      const laptopSticker = getRowValue(row, ['Laptop Sticker Name', 'Laptop Sticker', 'Sticker Name', 'Laptop Tag', 'Laptop']);
      const empName = getRowValue(row, ['Emp Name', 'Employee Name', 'Employee', 'Emp', 'Assigned Employee']);

      const assetTag = getRowValue(row, ['Asset Tag', 'AssetTag', 'assetTag', 'asset_tag', 'tag', 'asset'])
        || laptopSticker
        || `HW-AUTO-${nextId + index}`;

      const category = getRowValue(row, ['Category', 'category', 'Type', 'type'])
        || (laptopSticker ? 'Laptop' : '');

      const assignedTo = getRowValue(row, ['Assigned To', 'AssignedTo', 'assignedTo', 'assigned_to', 'User', 'user'])
        || empName
        || '';

      const deviceName = getRowValue(row, ['Device Name', 'DeviceName', 'deviceName', 'device_name', 'Name', 'device'])
        || (laptopSticker ? 'Laptop' : '');

      return ({
        id: nextId + index,
        assetTag,
        deviceName,
        category,
        manufacturer: getRowValue(row, ['Manufacturer', 'manufacturer', 'Brand', 'brand', 'Make', 'make']) || '',
        model: getRowValue(row, ['Model', 'model']) || '',
        serialNumber: getRowValue(row, ['Serial Number', 'SerialNumber', 'serialNumber', 'serial_number', 'S/N', 'SN', 'sn']) || '',
        status: getRowValue(row, ['Status', 'status']) || 'Active',
        assignedTo,
        department: getRowValue(row, ['Department', 'department', 'Dept', 'dept']) || 'Embedded',
        location: getRowValue(row, ['Location', 'location']) || 'Ahmedabad',
        purchaseDate: getRowValue(row, ['Purchase Date', 'PurchaseDate', 'purchaseDate', 'purchase_date']) || '',
        warrantyExpiry: getRowValue(row, ['Warranty Expiry', 'WarrantyExpiry', 'warrantyExpiry', 'warranty_expiry']) || '',
        cost: parseFloat(getRowValue(row, ['Cost', 'cost', 'Price', 'price']) || 0),
        notes: getRowValue(row, ['Notes', 'notes', 'Remarks', 'remarks', 'Comment', 'comment']) || '',
        _sheetName: row._sheetName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    if (replaceExisting) {
      inventory.push(...newItems);
      saveInventory(inventory);
    } else {
      const byAssetTag = new Map(inventory.map((i) => [String(i.assetTag || '').trim().toLowerCase(), i]));
      const updated = [];
      const created = [];

      newItems.forEach((ni) => {
        const key = String(ni.assetTag || '').trim().toLowerCase();
        const existing = key ? byAssetTag.get(key) : null;
        if (existing) {
          const merged = {
            ...existing,
            ...ni,
            id: existing.id,
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString(),
          };
          const idx = inventory.findIndex((x) => x.id === existing.id);
          if (idx !== -1) inventory[idx] = merged;
          byAssetTag.set(key, merged);
          updated.push(merged);
        } else {
          inventory.push(ni);
          if (key) byAssetTag.set(key, ni);
          created.push(ni);
        }
      });

      saveInventory(inventory);

      res.json({
        message: `Successfully imported ${newItems.length} items from ${sheetNames.length} sheet(s)`,
        sheetsProcessed: sheetNames,
        itemsImported: newItems.length,
        replaced: false,
        createdCount: created.length,
        updatedCount: updated.length,
        items: newItems,
      });
      return;
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      message: `${replaceExisting ? 'Replaced' : 'Successfully imported'} ${newItems.length} items from ${sheetNames.length} sheet(s)`,
      sheetsProcessed: sheetNames,
      itemsImported: newItems.length,
      replaced: replaceExisting,
      items: newItems
    });
    
    logger.addLog(req.user, 'Asset Import', `Admin imported ${newItems.length} assets from Excel`);
  } catch (err) {
    console.error('Upload error:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Error processing file: ' + err.message });
  }
});

// @route   GET /api/inventory/export
// @desc    Export inventory to Excel
// @access  Private
router.get('/export', auth, (req, res) => {
  try {
    const inventory = getInventory();
    const workbook = XLSX.utils.book_new();

    const exportData = inventory.map(({ id, createdAt, updatedAt, _sheetName, ...item }) => item);
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hardware Inventory');

    const filePath = path.join(__dirname, '..', 'uploads', `inventory_export_${Date.now()}.xlsx`);
    XLSX.writeFile(workbook, filePath);

    res.download(filePath, 'SIQOL_Hardware_Inventory.xlsx', (err) => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;