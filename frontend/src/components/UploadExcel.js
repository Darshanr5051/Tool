import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiUploadCloud, FiFile, FiCheckCircle, FiX, FiInfo, FiZap, FiDownload, FiCopy, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import './UploadExcel.css';

const API_URL = 'https://dash-tool-hw.netlify.app';

const UploadExcel = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [showHeaders, setShowHeaders] = useState(true);
  const fileInputRef = useRef(null);

  const headers = [
    'Asset Tag', 'Device Name', 'Category', 'Manufacturer', 'Model', 'Serial Number',
    'Status', 'Assigned To', 'Department', 'Location', 'Purchase Date', 'Warranty Expiry',
    'Cost', 'Notes'
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0]);
  };

  const validateAndSetFile = (f) => {
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) { toast.error('Unsupported file format'); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error('File exceeds 10MB limit'); return; }
    setFile(f);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('replace', replaceExisting ? 'true' : 'false');
    try {
      const res = await axios.post(`${API_URL}/inventory/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data);
      toast.success(res.data.message);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const importBundledFile = async () => {
    if (uploading) return;
    setUploading(true);
    setResult(null);
    try {
      const resp = await fetch(`${process.env.PUBLIC_URL}/SIQOL_HW_list.xlsx`, { cache: 'no-store' });
      if (!resp.ok) throw new Error('Bundled file not found');
      const blob = await resp.blob();
      const bundledFile = new File([blob], 'SIQOL_HW_list.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const fd = new FormData();
      fd.append('file', bundledFile);
      fd.append('replace', replaceExisting ? 'true' : 'false');

      const res = await axios.post(`${API_URL}/inventory/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data);
      toast.success(res.data.message);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      toast.error(err?.message || 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyHeaders = async () => {
    try {
      await navigator.clipboard.writeText(headers.join(', '));
      toast.success('Column headers copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  const formatSize = (b) => b < 1024 ? b + ' B' : b < 1024 * 1024 ? (b / 1024).toFixed(1) + ' KB' : (b / (1024 * 1024)).toFixed(1) + ' MB';

  return (
    <div className="upload-3d">
      <div className="upload-head-3d">
        <div className="upload-head-left">
          <div className="upload-head-icon"><FiUploadCloud /></div>
          <div>
            <h2 className="upload-title-3d">DATA IMPORT</h2>
            <p className="upload-sub-3d">Upload Excel spreadsheets to import hardware assets</p>
          </div>
        </div>
      </div>

      <div className="upload-grid-3d">
        <div className="upload-main-3d">
          <div className="upload-actions-3d">
            <a
              className="template-btn-3d"
              href={`${process.env.PUBLIC_URL}/SIQOL_HW_list.xlsx`}
              download
              onClick={() => toast.info('Downloading template...')}
            >
              <FiDownload /> Download template
            </a>
            <button className="import-bundled-3d" onClick={importBundledFile} disabled={uploading}>
              <FiUploadCloud /> Import bundled SIQOL_HW_list
            </button>
          </div>

          <div
            className={`drop-zone-3d glow ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])} style={{ display: 'none' }} />
            <div className="drop-corner tl"></div>
            <div className="drop-corner tr"></div>
            <div className="drop-corner bl"></div>
            <div className="drop-corner br"></div>

            {!file ? (
              <div className="drop-content-3d">
                <div className="drop-icon-3d">
                  <FiUploadCloud />
                  <div className="drop-icon-ring"></div>
                </div>
                <h3>DROP FILE HERE</h3>
                <p>or click to browse your system</p>
                <span className="drop-formats">XLSX • XLS • CSV</span>
              </div>
            ) : (
              <div className="file-preview-3d">
                <div className="file-info-3d">
                  <div className="file-icon-3d"><FiFile /></div>
                  <div>
                    <span className="file-name-3d">{file.name}</span>
                    <span className="file-size-3d">{formatSize(file.size)}</span>
                  </div>
                </div>
                <button className="remove-file-3d" onClick={(e) => { e.stopPropagation(); clearFile(); }}><FiX /></button>
              </div>
            )}
          </div>

          <div className={`replace-wrap-3d ${replaceExisting ? 'danger' : ''}`}>
            <label className="replace-toggle-3d">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                disabled={uploading}
              />
              <span>Replace existing inventory with this file</span>
            </label>
            {replaceExisting && (
              <div className="replace-warning-3d">
                Replace will overwrite existing inventory data.
              </div>
            )}
          </div>

          {file && !result && (
            <button className={`upload-btn-3d ${uploading ? 'processing' : ''}`} onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <><div className="upload-spin-3d"><div className="spin-ring"></div></div><span>PROCESSING DATA...</span></>
              ) : (
                <><FiZap /><span>INITIATE IMPORT</span></>
              )}
            </button>
          )}

          {result && (
            <div className="result-3d">
              <div className="result-header-3d">
                <FiCheckCircle className="result-icon-3d" />
                <h3>IMPORT COMPLETE</h3>
              </div>
              <div className="result-stats-3d">
                <div className="result-stat-3d">
                  <span className="rs-label">ITEMS IMPORTED</span>
                  <span className="rs-value">{result.itemsImported}</span>
                </div>
                <div className="result-stat-3d">
                  <span className="rs-label">SHEETS PROCESSED</span>
                  <span className="rs-value">{result.sheetsProcessed?.length || 0}</span>
                </div>
              </div>
              {result.sheetsProcessed && (
                <div className="result-sheets-3d">
                  <span className="rs-label">SHEET NAMES</span>
                  <div className="sheet-tags-3d">
                    {result.sheetsProcessed.map((s, i) => <span key={i} className="sheet-tag-3d">{s}</span>)}
                  </div>
                </div>
              )}
              <button className="upload-another-3d" onClick={clearFile}>UPLOAD ANOTHER FILE</button>
            </div>
          )}
        </div>

        <div className="upload-side-3d">
          <div className="side-card-3d">
            <div className="side-card-head-3d">
              <div className="side-card-title-3d">
                <FiInfo className="info-icon-3d" />
                <span>Import requirements</span>
              </div>
              <button type="button" className="side-toggle-3d" onClick={() => setShowHeaders((v) => !v)}>
                {showHeaders ? <><FiChevronUp /> Hide</> : <><FiChevronDown /> Show</>}
              </button>
            </div>

            <div className="side-card-body-3d">
              <div className="side-meta-3d">
                Accepts .xlsx, .xls, .csv — Max 10MB — Multi-sheet supported
              </div>
              <div className="side-actions-3d">
                <button type="button" className="side-btn-3d" onClick={copyHeaders}>
                  <FiCopy /> Copy headers
                </button>
              </div>

              {showHeaders && (
                <div className="headers-grid-3d">
                  {headers.map((h) => (
                    <span key={h} className="header-chip-3d">{h}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadExcel;