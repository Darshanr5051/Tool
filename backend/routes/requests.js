const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const requestsFile = path.join(__dirname, '..', 'data', 'requests.json');
const inventoryFile = path.join(__dirname, '..', 'data', 'inventory.json');

const getRequests = () => {
  if (!fs.existsSync(requestsFile)) {
    fs.writeFileSync(requestsFile, JSON.stringify([], null, 2));
    return [];
  }
  const data = fs.readFileSync(requestsFile, 'utf8');
  return JSON.parse(data);
};

const saveRequests = (requests) => {
  fs.writeFileSync(requestsFile, JSON.stringify(requests, null, 2));
};

const getInventory = () => {
  const data = fs.readFileSync(inventoryFile, 'utf8');
  return JSON.parse(data);
};

const saveInventory = (inventory) => {
  fs.writeFileSync(inventoryFile, JSON.stringify(inventory, null, 2));
};

// @route   GET /api/requests
// @desc    Get all requests (Admin gets all, User gets own)
// @access  Private
router.get('/', auth, (req, res) => {
  try {
    const requests = getRequests();
    if (req.user.role === 'admin') {
      res.json(requests);
    } else {
      const userRequests = requests.filter(r => r.userId === req.user.id || r.user === req.user.username);
      res.json(userRequests);
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/requests
// @desc    User requests to add an item
// @access  Private
router.post('/', auth, (req, res) => {
  try {
    const requests = getRequests();
    const newRequest = {
      id: requests.length > 0 ? Math.max(...requests.map(r => r.id)) + 1 : 1,
      user: req.user.username,
      userId: req.user.id,
      itemData: req.body,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    requests.push(newRequest);
    saveRequests(requests);
    
    logger.addLog(req.user, 'Asset Request', `Requested to add asset: ${req.body.deviceName || 'Unknown'}`);
    
    res.status(201).json(newRequest);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/requests/:id
// @desc    Approve or reject a request
// @access  Private/Admin
router.put('/:id', auth, auth.adminOnly, (req, res) => {
  try {
    const requests = getRequests();
    const requestId = parseInt(req.params.id);
    const index = requests.findIndex(r => r.id === requestId);

    if (index === -1) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const { status } = req.body; // 'Approved' or 'Rejected'
    
    if (status === 'Approved') {
      const inventory = getInventory();
      const itemData = requests[index].itemData;
      const newItem = {
        id: inventory.length > 0 ? Math.max(...inventory.map(i => i.id)) + 1 : 1,
        ...itemData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      inventory.push(newItem);
      saveInventory(inventory);
      
      logger.addLog(req.user, 'Request Approved', `Approved asset request #${requestId} for ${itemData.deviceName || 'Unknown'}`);
    } else if (status === 'Rejected') {
      logger.addLog(req.user, 'Request Rejected', `Rejected asset request #${requestId}`);
    }

    requests[index].status = status;
    requests[index].updatedAt = new Date().toISOString();
    saveRequests(requests);

    res.json(requests[index]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
