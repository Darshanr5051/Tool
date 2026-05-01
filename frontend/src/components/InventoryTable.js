import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import {
  FiSearch, FiFilter, FiEdit2, FiTrash2, FiPlus, FiX, FiSave,
  FiChevronLeft, FiChevronRight, FiMonitor, FiDatabase, FiArrowUp, FiArrowDown
} from 'react-icons/fi';
import {
  FaLaptop,
  FaDesktop,
  FaHeadphones,
  FaKeyboard,
  FaMouse,
  FaMobileAlt,
  FaPrint,
  FaServer,
  FaCamera,
  FaBoxOpen,
} from 'react-icons/fa';
import './InventoryTable.css';

const API_URL = 'https://dash-tool-hw.netlify.app';

const InventoryTable = ({
  onUpdate,
  presetSearchTerm = '',
  presetStatusFilter = '',
  presetCategoryFilter = '',
  openAddId = 0,
  onExportFiltered,
}) => {
  const { isAdmin } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showLaptopImport, setShowLaptopImport] = useState(false);
  const [laptopImportText, setLaptopImportText] = useState('');
  const [laptopImportCategory, setLaptopImportCategory] = useState('');
  const [importingLaptop, setImportingLaptop] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('assetTag');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null);
  const density = localStorage.getItem('siqol_density') || 'comfortable';
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const itemsPerPageRaw = Number(localStorage.getItem('siqol_rows_per_page'));
    return Number.isFinite(itemsPerPageRaw) && itemsPerPageRaw > 0 ? itemsPerPageRaw : 10;
  });

  const [users, setUsers] = useState([]);
  const [isOtherAssignee, setIsOtherAssignee] = useState(false);

  const [formData, setFormData] = useState({
    assetTag: '', deviceName: '', category: '', manufacturer: '',
    model: '', serialNumber: '', status: 'Active', assignedTo: '', quantity: '1',
    department: 'Embedded', location: 'Ahmedabad', purchaseDate: '', warrantyExpiry: '',
    cost: '', notes: ''
  });

  useEffect(() => { fetchInventory(); fetchUsers(); }, []);
  useEffect(() => { filterInventory(); }, [inventory, searchTerm, statusFilter, categoryFilter]);

  useEffect(() => {
    if (typeof presetSearchTerm === 'string') setSearchTerm(presetSearchTerm);
  }, [presetSearchTerm]);

  useEffect(() => {
    if (typeof presetStatusFilter === 'string') setStatusFilter(presetStatusFilter);
  }, [presetStatusFilter]);

  useEffect(() => {
    if (typeof presetCategoryFilter === 'string') setCategoryFilter(presetCategoryFilter);
  }, [presetCategoryFilter]);

  useEffect(() => {
    if (!openAddId) return;
    handleAdd();
  }, [openAddId]);

  useEffect(() => {
    localStorage.setItem('siqol_rows_per_page', String(itemsPerPage));
  }, [itemsPerPage]);

  const fetchInventory = async () => {
    try {
      const res = await axios.get(`${API_URL}/inventory`);
      setInventory(res.data);
    } catch (err) { toast.error('Error loading inventory'); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/users`);
      setUsers(res.data);
    } catch (err) { console.error('Error fetching users:', err); }
  };

  const norm = (v) => String(v || '').trim().toLowerCase();

  const getCategoryIcon = (category) => {
    const c = norm(category);
    if (!c) return FaBoxOpen;

    if (c.includes('laptop')) return FaLaptop;
    if (c.includes('desktop') || c.includes('display') || c.includes('monitor')) return FaDesktop;
    if (c.includes('headphone') || c.includes('headset') || c.includes('earphone')) return FaHeadphones;
    if (c.includes('keyboard')) return FaKeyboard;
    if (c.includes('mouse')) return FaMouse;
    if (c.includes('mobile') || c.includes('phone')) return FaMobileAlt;
    if (c.includes('printer')) return FaPrint;
    if (c.includes('server') || c.includes('storage') || c.includes('nas')) return FaServer;
    if (c.includes('camera') || c.includes('webcam')) return FaCamera;

    return FaBoxOpen;
  };

  const setCategoryFromName = (name) => {
    const target = norm(name);
    if (!target) {
      setCategoryFilter('');
      return;
    }
    const match = categories.find((c) => norm(c) === target);
    setCategoryFilter(match || name);
  };

  const filterInventory = () => {
    let result = [...inventory];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => Object.values(item).some(v => String(v).toLowerCase().includes(term)));
    }
    if (statusFilter) result = result.filter(item => item.status === statusFilter);
    if (categoryFilter) result = result.filter(item => norm(item.category) === norm(categoryFilter));

    // Apply sorting
    result.sort((a, b) => {
      const aVal = a[sortColumn] || '';
      const bVal = b[sortColumn] || '';
      const direction = sortDirection === 'asc' ? 1 : -1;

      // Handle numeric values (cost)
      if (sortColumn === 'cost') {
        return (parseFloat(aVal) - parseFloat(bVal)) * direction;
      }

      // Handle dates
      if (['purchaseDate', 'warrantyExpiry'].includes(sortColumn)) {
        if (!aVal && !bVal) return 0;
        if (!aVal) return -1 * direction;
        if (!bVal) return 1 * direction;
        return (new Date(aVal) - new Date(bVal)) * direction;
      }

      // String comparison
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { sensitivity: 'base' });
      return cmp * direction;
    });

    setFiltered(result);
    setCurrentPage(1);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <FiArrowUp /> : <FiArrowDown />;
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      assetTag: '', deviceName: '', category: '', manufacturer: '',
      model: '', serialNumber: '', status: 'Active', assignedTo: '', quantity: '1',
      department: 'Embedded', location: 'Ahmedabad', purchaseDate: '', warrantyExpiry: '',
      cost: '', notes: ''
    });
    setIsOtherAssignee(false);
    setShowModal(true);
  };

  const parseLaptopImport = (text) => {
    const lines = String(text || '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    return lines
      .map((line) => {
        const parts = line.split(/\t|,|\s{2,}/).map((p) => p.trim()).filter(Boolean);
        let assetTag = '';
        let assignedTo = '';
        let quantity = '1';
        let status = 'Active';

        if (parts.length >= 3) {
          assetTag = parts[0];
          if (/^\d+$/.test(parts[1])) {
            quantity = parts[1];
            status = parts[2].toLowerCase() === 'working' ? 'Active' : parts[2];
          } else {
            assignedTo = parts[1];
          }
        } else if (parts.length === 2) {
          assetTag = parts[0];
          if (/^\d+$/.test(parts[1])) {
            quantity = parts[1];
          } else {
            assignedTo = parts[1];
          }
        } else if (parts.length === 1) {
          assetTag = parts[0];
        }

        if (!assetTag) return null;
        return { assetTag, assignedTo, quantity, status };
      })
      .filter(Boolean);
  };

  const handleLaptopImport = async () => {
    if (!isAdmin()) return;
    const chosenCategory = String(laptopImportCategory || 'Laptop').trim();
    const rows = parseLaptopImport(laptopImportText);
    if (rows.length === 0) {
      toast.error('No valid rows found. Paste: LP-1<TAB>Manish');
      return;
    }

    setImportingLaptop(true);
    try {
      const payloads = rows.map((r) => ({
        assetTag: r.assetTag,
        deviceName: chosenCategory,
        category: chosenCategory,
        status: r.status || 'Active',
        assignedTo: r.assignedTo,
        quantity: r.quantity || '1',
        department: 'Embedded',
        location: 'Ahmedabad',
      }));

      const results = await Promise.allSettled(payloads.map((p) => axios.post(`${API_URL}/inventory`, p)));
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      if (successCount > 0) toast.success(`Imported ${successCount} laptop asset${successCount > 1 ? 's' : ''}`);

      if (failCount > 0) {
        const firstErr = results.find((r) => r.status === 'rejected')?.reason;
        const msg = firstErr?.response?.data?.message || firstErr?.message || 'Some rows failed';
        toast.error(`${failCount} failed: ${msg}`);
      }

      setLaptopImportText('');
      setShowLaptopImport(false);
      await fetchInventory();
      if (onUpdate) onUpdate();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Import failed');
    } finally {
      setImportingLaptop(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      assetTag: item.assetTag || '', deviceName: item.deviceName || '',
      category: item.category || '', manufacturer: item.manufacturer || '',
      model: item.model || '', serialNumber: item.serialNumber || '',
      status: item.status || 'Active', assignedTo: item.assignedTo || '', quantity: item.quantity || '1',
      department: item.department || 'Embedded', location: item.location || 'Ahmedabad',
      purchaseDate: item.purchaseDate || '', warrantyExpiry: item.warrantyExpiry || '',
      cost: item.cost || '', notes: item.notes || ''
    });
    // Determine if we should show the 'Other' input
    if (item.assignedTo && users.length > 0) {
      const isKnownUser = users.some(u => u.fullName === item.assignedTo);
      setIsOtherAssignee(!isKnownUser);
    } else {
      setIsOtherAssignee(false);
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confirm deletion of this asset?')) return;
    try {
      await axios.delete(`${API_URL}/inventory/${id}`);
      toast.success('Asset removed');
      fetchInventory();
      if (onUpdate) onUpdate();
    } catch (err) { toast.error('Deletion failed'); }
  };

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedItems.map(i => i.id)));
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} selected assets?`)) return;
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.allSettled(ids.map((id) => axios.delete(`${API_URL}/inventory/${id}`)));
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failResults = results.filter((r) => r.status === 'rejected');

      if (successCount > 0) toast.success(`${successCount} asset${successCount > 1 ? 's' : ''} removed`);

      if (failResults.length > 0) {
        const msg = failResults[0]?.reason?.response?.data?.message
          || failResults[0]?.reason?.message
          || 'Bulk deletion failed';
        toast.error(`${failResults.length} failed: ${msg}`);
      }

      setSelectedIds(new Set());
      await fetchInventory();
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk deletion failed');
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    try {
      await Promise.all(Array.from(selectedIds).map(id => axios.put(`${API_URL}/inventory/${id}`, { status: newStatus })));
      toast.success(`${selectedIds.size} assets updated to ${newStatus}`);
      setSelectedIds(new Set());
      fetchInventory();
      if (onUpdate) onUpdate();
    } catch (err) { toast.error('Bulk update failed'); }
  };

  const handleBulkCategoryChange = async (newCategory) => {
    try {
      await Promise.all(Array.from(selectedIds).map(id => axios.put(`${API_URL}/inventory/${id}`, { category: newCategory, deviceName: newCategory })));
      toast.success(`${selectedIds.size} assets moved to ${newCategory}`);
      setSelectedIds(new Set());
      fetchInventory();
      if (onUpdate) onUpdate();
    } catch (err) { toast.error('Bulk category update failed'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        if (!isAdmin()) {
          toast.error('You do not have permission to modify assets');
          return;
        }
        await axios.put(`${API_URL}/inventory/${editingItem.id}`, formData);
        toast.success('Asset updated');
      } else {
        if (isAdmin()) {
          await axios.post(`${API_URL}/inventory`, formData);
          toast.success('Asset registered');
        } else {
          await axios.post(`${API_URL}/requests`, formData);
          toast.success('Asset addition requested successfully');
        }
      }
      setShowModal(false);
      fetchInventory();
      if (onUpdate) onUpdate();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
  };

  const getStatusInfo = (status) => {
    const map = {
      'Active': { class: 'st-active', color: '#10b981' },
      'Maintenance': { class: 'st-maintenance', color: '#f59e0b' },
      'Retired': { class: 'st-retired', color: '#ef4444' },
      'In Storage': { class: 'st-storage', color: '#3d7aed' },
    };
    return map[status] || map['Active'];
  };

  const exportFilteredData = async () => {
    if (filtered.length === 0) {
      toast.warning('No data to export');
      return;
    }
    try {
      // Create workbook with filtered data
      const ws = XLSX.utils.json_to_sheet(filtered);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Filtered Inventory');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      XLSX.writeFile(wb, `SIQOL_Filtered_Export_${timestamp}.xlsx`);
      toast.success(`Exported ${filtered.length} items`);
    } catch (err) {
      toast.error('Export failed');
      console.error(err);
    }
  };

  // Expose export method to parent via callback
  useEffect(() => {
    if (onExportFiltered) {
      onExportFiltered(exportFilteredData);
    }
  }, [filtered, onExportFiltered]);

  const categories = [...new Set(inventory.map(i => i.category).filter(Boolean))];
  const statuses = [...new Set(inventory.map(i => i.status).filter(Boolean))];
  const categoryCounts = inventory.reduce((acc, item) => {
    const key = norm(item.category);
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const sortedCategories = [...categories].sort((a, b) => {
    const an = norm(a);
    const bn = norm(b);
    if (an === 'laptop' && bn !== 'laptop') return -1;
    if (bn === 'laptop' && an !== 'laptop') return 1;
    return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' });
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const pageStart = filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const pageEnd = Math.min(currentPage * itemsPerPage, filtered.length);

  if (loading) {
    return (
      <div className="loading-3d">
        <div className="loader-rings"><div className="ring r1"></div><div className="ring r2"></div><div className="ring r3"></div></div>
        <span className="loading-text-3d">SCANNING INVENTORY...</span>
      </div>
    );
  }

  return (
    <div className={`inv-container-3d ${density === 'compact' ? 'density-compact' : ''}`}>
      {/* Header */}
      <div className="inv-header-3d">
        <div className="inv-header-left">
          <div className="inv-header-icon"><FiMonitor /></div>
          <div>
            <h2 className="inv-title-3d">HARDWARE INVENTORY</h2>
            <p className="inv-count-3d">{filtered.length} assets detected</p>
          </div>
        </div>
        <div className="inv-header-actions-3d">
          {isAdmin() && (
            <button className="import-btn-3d" onClick={() => setShowLaptopImport(true)}>
              <FiPlus /> <span>IMPORT</span>
            </button>
          )}
          <button className="add-btn-3d" onClick={handleAdd}>
            <FiPlus /> <span>{isAdmin() ? 'REGISTER ASSET' : 'REQUEST ASSET'}</span>
          </button>
        </div>
      </div>

      {/* Category Tiles */}
      <div className="cat-tiles-3d">
        {sortedCategories.map((c) => {
          const isActive = norm(categoryFilter) === norm(c);
          const count = categoryCounts[norm(c)] || 0;
          const Icon = getCategoryIcon(c);
          return (
            <button
              key={c}
              type="button"
              className={`cat-tile-3d ${isActive ? 'active' : ''}`}
              onClick={() => setCategoryFilter((prev) => (norm(prev) === norm(c) ? '' : c))}
              title={`Show only ${c}`}
            >
              <div className="cat-tile-icon"><Icon /></div>
              <div className="cat-tile-meta">
                <div className="cat-tile-title">{c}</div>
                <div className="cat-tile-sub">{count} items</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="filters-3d">
        <div className="search-3d">
          <FiSearch className="search-icon-3d" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-3d"
          />
          {searchTerm && (
            <button className="search-clear-3d" onClick={() => setSearchTerm('')}><FiX /></button>
          )}
        </div>
        <div className="filter-group-3d">
          <FiFilter className="filter-icon-3d" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select-3d">
            <option value="">All Status</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="filter-select-3d">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {(searchTerm || statusFilter || categoryFilter) && (
        <div className="active-filters-3d">
          {searchTerm && (
            <button type="button" className="filter-chip-3d" onClick={() => setSearchTerm('')} title="Clear search">
              <span className="chip-label">Search:</span>
              <span className="chip-value">{searchTerm}</span>
              <FiX className="chip-x" />
            </button>
          )}
          {statusFilter && (
            <button type="button" className="filter-chip-3d" onClick={() => setStatusFilter('')} title="Clear status">
              <span className="chip-label">Status:</span>
              <span className="chip-value">{statusFilter}</span>
              <FiX className="chip-x" />
            </button>
          )}
          {categoryFilter && (
            <button type="button" className="filter-chip-3d" onClick={() => setCategoryFilter('')} title="Clear category">
              <span className="chip-label">Category:</span>
              <span className="chip-value">{categoryFilter}</span>
              <FiX className="chip-x" />
            </button>
          )}
          <button
            type="button"
            className="filter-clearall-3d"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setCategoryFilter('');
            }}
            title="Clear all filters"
          >
            CLEAR ALL
          </button>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bulk-action-bar-3d">
          <span className="bulk-count">{selectedIds.size} asset{selectedIds.size > 1 ? 's' : ''} selected</span>
          <div className="bulk-actions">
            <button className="bulk-btn-3d" onClick={handleBulkDelete}>
              <FiTrash2 /> Delete
            </button>
            <select className="bulk-select-3d" value="" onChange={(e) => { if (e.target.value) handleBulkStatusChange(e.target.value); e.target.value = ''; }}>
              <option value="">Change Status...</option>
              <option value="Active">Active</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Retired">Retired</option>
              <option value="In Storage">In Storage</option>
            </select>
            <select className="bulk-select-3d" value="" onChange={(e) => {
              const val = e.target.value;
              if (val === '__new__') {
                const newCat = window.prompt('Enter new category name:');
                if (newCat && newCat.trim()) handleBulkCategoryChange(newCat.trim());
              } else if (val) {
                handleBulkCategoryChange(val);
              }
              e.target.value = '';
            }}>
              <option value="">Change Category...</option>
              {sortedCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__new__">+ New Category</option>
            </select>
            <button className="bulk-btn-3d" onClick={() => setSelectedIds(new Set())}>
              <FiX /> Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-3d">
        <div className="table-glow-top"></div>
        <table className="inv-table-3d sticky-header">
          <thead>
            <tr>
              {isAdmin() && (
                <th className="bulk-select-th">
                  <input
                    type="checkbox"
                    className="bulk-checkbox"
                    checked={paginatedItems.length > 0 && selectedIds.size === paginatedItems.length}
                    onChange={toggleSelectAll}
                  />
                </th>
              )}
              <th className="sortable" onClick={() => handleSort('assetTag')}>
                ASSET TAG {getSortIcon('assetTag')}
              </th>
              <th className="sortable" onClick={() => handleSort('deviceName')}>
                DEVICE {getSortIcon('deviceName')}
              </th>
              <th className="sortable" onClick={() => handleSort('category')}>
                CATEGORY {getSortIcon('category')}
              </th>
              <th className="sortable" onClick={() => handleSort('manufacturer')}>
                MANUFACTURER {getSortIcon('manufacturer')}
              </th>
              <th className="sortable" onClick={() => handleSort('status')}>
                STATUS {getSortIcon('status')}
              </th>
              <th className="sortable" onClick={() => handleSort('assignedTo')}>
                ASSIGNED TO {getSortIcon('assignedTo')}
              </th>
              <th className="sortable" onClick={() => handleSort('department')}>
                DEPARTMENT {getSortIcon('department')}
              </th>
              {isAdmin() && <th className="non-sortable">ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={isAdmin() ? 10 : 9}>
                  <div className="empty-state-3d">
                    <FiDatabase size={36} />
                    <p>NO ASSETS FOUND</p>
                    <span>Adjust search parameters or filters</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, idx) => {
                const si = getStatusInfo(item.status);
                return (
                  <tr key={item.id} className={`table-row-3d ${selectedIds.has(item.id) ? 'selected-3d' : ''}`} style={{ animationDelay: `${idx * 0.05}s` }}>
                    {isAdmin() && (
                      <td className="bulk-select-td">
                        <input
                          type="checkbox"
                          className="bulk-checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                        />
                      </td>
                    )}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="tag-3d">{item.assetTag}</span>
                        {Number(item.quantity) > 1 && (
                          <span style={{ padding: '2px 6px', background: '#e0e7ff', color: '#4338ca', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            x{item.quantity}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="device-3d">{item.deviceName}</td>
                    <td>
                      {item.category ? (
                        <button
                          type="button"
                          className="cat-link-3d"
                          onClick={() => setCategoryFromName(item.category)}
                          title={`Filter by ${item.category}`}
                        >
                          {item.category}
                        </button>
                      ) : '—'}
                    </td>
                    <td>{item.manufacturer}</td>
                    <td>
                      <span className={`status-badge-3d ${si.class}`}>
                        <span className="badge-dot" style={{ background: si.color }}></span>
                        {item.status}
                      </span>
                    </td>
                    <td>{item.assignedTo}</td>
                    <td>{item.department}</td>
                    {isAdmin() && (
                      <td>
                        <div className="actions-3d">
                          <button className="act-btn-3d edit" onClick={() => handleEdit(item)} title="Modify">
                            <FiEdit2 />
                          </button>
                          <button className="act-btn-3d delete" onClick={() => handleDelete(item.id)} title="Remove">
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="pagination-3d">
          <div className="pagination-left-3d">
            <div className="range-3d">Showing {pageStart}-{pageEnd} of {filtered.length}</div>
            <div className="rows-3d">
              <span className="rows-label-3d">Rows</span>
              <select
                className="rows-select-3d"
                value={itemsPerPage}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setItemsPerPage(v);
                  setCurrentPage(1);
                  setSelectedIds(new Set());
                }}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pagination-right-3d">
            <button className="page-btn-3d" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={totalPages <= 1 || currentPage === 1}>
              <FiChevronLeft />
            </button>
            <div className="page-info-3d">
              <span className="page-current">{String(currentPage).padStart(2, '0')}</span>
              <span className="page-sep">/</span>
              <span className="page-total">{String(totalPages).padStart(2, '0')}</span>
            </div>
            <button className="page-btn-3d" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={totalPages <= 1 || currentPage === totalPages}>
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay-3d" onClick={() => setShowModal(false)}>
          <div className="modal-3d" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-3d">
              <div className="modal-title-group">
                <div className="modal-icon-3d">{editingItem ? <FiEdit2 /> : <FiPlus />}</div>
                <div>
                  <h3>{editingItem ? 'MODIFY ASSET' : (isAdmin() ? 'REGISTER NEW ASSET' : 'REQUEST NEW ASSET')}</h3>
                  <span className="modal-sub">Fill in the asset parameters</span>
                </div>
              </div>
              <button className="modal-close-3d" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form-3d">
              <div className="form-grid-3d">
                {[
                  { key: 'assetTag', label: 'ASSET TAG', required: true },
                  { key: 'deviceName', label: 'DEVICE NAME', required: true },
                  { key: 'category', label: 'CATEGORY' },
                  { key: 'manufacturer', label: 'MANUFACTURER' },
                  { key: 'model', label: 'MODEL' },
                  { key: 'quantity', label: 'QUANTITY', type: 'number' },
                ].map(f => (
                  <div key={f.key} className="field-3d">
                    <label>{f.label}{f.required && ' *'}</label>
                    <input
                      type={f.type || 'text'}
                      value={formData[f.key]}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      required={f.required}
                    />
                  </div>
                ))}
                <div className="field-3d">
                  <label>STATUS</label>
                  <select value={formData.status} onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}>
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Retired">Retired</option>
                    <option value="In Storage">In Storage</option>
                  </select>
                </div>
                <div className="field-3d">
                  <label>ASSIGNED TO</label>
                  <select
                    value={isOtherAssignee ? 'Other' : (users.some(u => u.fullName === formData.assignedTo) ? formData.assignedTo : (formData.assignedTo ? 'Other' : ''))}
                    onChange={(e) => {
                      if (e.target.value === 'Other') {
                        setIsOtherAssignee(true);
                        setFormData((prev) => ({ ...prev, assignedTo: '' }));
                      } else {
                        setIsOtherAssignee(false);
                        setFormData((prev) => ({ ...prev, assignedTo: e.target.value }));
                      }
                    }}
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.fullName}>{u.fullName}</option>
                    ))}
                    <option value="Other">Other (Manual)</option>
                  </select>
                </div>
                {isOtherAssignee && (
                  <div className="field-3d">
                    <label>MANUAL ASSIGNEE NAME</label>
                    <input
                      type="text"
                      value={formData.assignedTo}
                      onChange={(e) => setFormData((prev) => ({ ...prev, assignedTo: e.target.value }))}
                      placeholder="Enter name manually"
                    />
                  </div>
                )}
                {[
                  { key: 'department', label: 'DEPARTMENT' },
                  { key: 'location', label: 'LOCATION' },
                ].map(f => (
                  <div key={f.key} className="field-3d">
                    <label>{f.label}</label>
                    <input type="text" value={formData[f.key]} onChange={(e) => setFormData((prev) => ({ ...prev, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <div className="field-3d">
                  <label>PURCHASE DATE</label>
                  <input type="date" value={formData.purchaseDate} onChange={(e) => setFormData((prev) => ({ ...prev, purchaseDate: e.target.value }))} />
                </div>
                <div className="field-3d">
                  <label>WARRANTY EXPIRY</label>
                  <input type="date" value={formData.warrantyExpiry} onChange={(e) => setFormData((prev) => ({ ...prev, warrantyExpiry: e.target.value }))} />
                </div>
                <div className="field-3d full">
                  <label>NOTES</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} rows={3} />
                </div>
              </div>
              <div className="modal-actions-3d">
                <button type="button" className="cancel-3d" onClick={() => setShowModal(false)}>CANCEL</button>
                <button type="submit" className="save-3d"><FiSave /> {editingItem ? 'UPDATE' : (isAdmin() ? 'REGISTER' : 'SUBMIT REQUEST')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLaptopImport && (
        <div className="modal-overlay-3d" onClick={() => !importingLaptop && setShowLaptopImport(false)}>
          <div className="modal-3d" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-3d">
              <div className="modal-title-group">
                <div className="modal-icon-3d"><FiPlus /></div>
                <div>
                  <h3>QUICK IMPORT ASSETS</h3>
                  <span className="modal-sub">Paste two columns: Asset Tag and Employee Name</span>
                </div>
              </div>
              <button className="modal-close-3d" onClick={() => !importingLaptop && setShowLaptopImport(false)}><FiX /></button>
            </div>
            <div className="modal-form-3d">
              <div className="field-3d">
                <label>CATEGORY</label>
                <input
                  type="text"
                  value={laptopImportCategory}
                  onChange={(e) => setLaptopImportCategory(e.target.value)}
                  placeholder="e.g., Laptop"
                />
              </div>
              <div className="field-3d full">
                <label>PASTE DATA</label>
                <textarea
                  value={laptopImportText}
                  onChange={(e) => setLaptopImportText(e.target.value)}
                  rows={8}
                />
              </div>
              <div className="modal-actions-3d">
                <button type="button" className="cancel-3d" onClick={() => !importingLaptop && setShowLaptopImport(false)} disabled={importingLaptop}>CANCEL</button>
                <button type="button" className="save-3d" onClick={handleLaptopImport} disabled={importingLaptop}>
                  <FiSave /> {importingLaptop ? 'IMPORTING...' : 'IMPORT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTable;