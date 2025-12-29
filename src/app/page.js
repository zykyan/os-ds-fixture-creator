'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { mapCsvToJson } from './utils/csvMapper';
import styles from './page.module.css';

export default function Home() {
  const [jsonOutput, setJsonOutput] = useState(null);
  const [error, setError] = useState(null);
  const [startPk, setStartPk] = useState(1);
  const [csvData, setCsvData] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [fileName, setFileName] = useState(null);

  // Metadata state
  const [tableName, setTableName] = useState("");
  const [datasourceId, setDatasourceId] = useState("19");

  // Ignore list state
  const [enableIgnore, setEnableIgnore] = useState(true);
  const [ignoreList, setIgnoreList] = useState([]); // Start empty, populate on upload
  const [newIgnoreTag, setNewIgnoreTag] = useState('');
  const [copied, setCopied] = useState(false);

  // Default patterns to check against headers (partial match)
  const IGNORE_PATTERNS = ['email', 'username', 'id', '_airbyte'];

  // Re-generate JSON whenever dependencies change
  useEffect(() => {
    if ((csvData || (csvHeaders && csvHeaders.length > 0)) && fileName) {
      try {
        const mappedData = mapCsvToJson(csvData, fileName, startPk, ignoreList, enableIgnore, csvHeaders, tableName, datasourceId);
        setJsonOutput(JSON.stringify(mappedData, null, 2));
        setError(null);
      } catch (err) {
        setError(`Error mapping data: ${err.message}`);
        setJsonOutput(null);
      }
    } else {
      setJsonOutput(null);
    }
  }, [csvData, csvHeaders, fileName, startPk, ignoreList, enableIgnore, tableName, datasourceId]);

  const addIgnoreTag = (e) => {
    if ((e.key === 'Enter' || e.type === 'click') && newIgnoreTag.trim()) {
      if (!ignoreList.includes(newIgnoreTag.trim())) {
        setIgnoreList([...ignoreList, newIgnoreTag.trim()]);
      }
      setNewIgnoreTag('');
    }
  };

  const removeIgnoreTag = (tagToRemove) => {
    setIgnoreList(ignoreList.filter(tag => tag !== tagToRemove));
  };


  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setFileName(file.name); // Store file name

    // Default table name from filename (remove extension)
    setTableName(file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, '_'));

    setCsvData(null); // Clear previous CSV data
    setCsvHeaders([]); // Clear previous headers
    setIgnoreList([]); // Reset ignore list

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && (!results.meta || !results.meta.fields)) {
          setError(`Error parsing CSV: ${results.errors[0].message}`);
          setCsvData(null);
          return;
        }

        let headers = [];
        // Save headers even if data is empty
        if (results.meta && results.meta.fields) {
          headers = results.meta.fields;
          setCsvHeaders(headers);
        }

        // Smart Ignore Logic: Auto-populate ignoreList based on patterns in headers
        if (headers.length > 0) {
          const autoIgnored = headers.filter(header => {
            const lowerHeader = header.toLowerCase();
            return IGNORE_PATTERNS.some(pattern => lowerHeader.includes(pattern));
          });
          setIgnoreList(autoIgnored);
        }

        setCsvData(results.data); // Store parsed data
      },
      error: (err) => {
        setError(`Error parsing CSV: ${err.message}`);
        setCsvData(null);
        setCsvHeaders([]);
      }
    });
  };

  const handleDownload = () => {
    if (!jsonOutput) return;
    const blob = new Blob([jsonOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fixtures.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
    if (!jsonOutput) return;
    navigator.clipboard.writeText(jsonOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.header}>
          <img
            src="https://onesource.marketing/OneSource%20Logo.png"
            alt="OneSource Logo"
            className={styles.logo}
          />
          <h1 className={styles.title}>Data Mapper</h1>
          <div className={styles.helpContainer}>
            <div className={styles.helpIcon}>?</div>
            <div className={styles.tooltip}>
              <p><strong>How to use:</strong></p>
              <ol>
                <li>Upload your CSV file.</li>
                <li>Filter out unwanted columns.</li>
                <li>Edit the JSON preview if needed.</li>
                <li>Click <strong>Download JSON</strong>.</li>
              </ol>
            </div>
          </div>
        </div>

        <div className={styles.panelsContainer}>
          {/* LEFT PANEL: Inputs */}
          <div className={styles.leftPanel}>
            <div className={styles.card}>

              <div className={styles.uploadSection}>
                <label className={styles.label}>
                  Upload CSV File
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className={styles.fileInput}
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <label className={styles.label}>
                    Start PK
                    <input
                      type="number"
                      value={startPk}
                      onChange={(e) => setStartPk(e.target.value)}
                      className={styles.fileInput}
                      style={{ cursor: 'text' }}
                    />
                  </label>

                  <label className={styles.label}>
                    DataSource ID
                    <input
                      type="text"
                      value={datasourceId}
                      onChange={(e) => setDatasourceId(e.target.value)}
                      className={styles.fileInput}
                      style={{ cursor: 'text' }}
                    />
                  </label>
                </div>

                <label className={styles.label}>
                  Table Name
                  <input
                    type="text"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    className={styles.fileInput}
                    style={{ cursor: 'text' }}
                    placeholder="Defaults to filename"
                  />
                </label>

                <div className={styles.ignoreSection}>
                  <div className={styles.ignoreHeader}>
                    <label className={styles.label}>Ignore Columns</label>
                    <label className={styles.toggleLabel}>
                      <input
                        type="checkbox"
                        checked={enableIgnore}
                        onChange={(e) => setEnableIgnore(e.target.checked)}
                        className={styles.toggleInput}
                      />
                      Enable Filtering
                    </label>
                  </div>

                  {enableIgnore && (
                    <div className={styles.tagsContainer}>

                      {/* Manual Input */}
                      <div className={styles.tagInputContainer}>
                        <input
                          type="text"
                          value={newIgnoreTag}
                          onChange={(e) => setNewIgnoreTag(e.target.value)}
                          onKeyDown={addIgnoreTag}
                          placeholder="Type to ignore (Press Enter)"
                          className={styles.tagInput}
                        />
                        <button onClick={addIgnoreTag} className={styles.addButton}>Add</button>
                      </div>

                      {/* Available Columns Selection */}
                      {csvHeaders && csvHeaders.length > 0 && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <label className={styles.subLabel}>Available Columns (Click to Ignore/Unignore):</label>
                          <div className={styles.tagsList}>
                            {csvHeaders.map(header => {
                              const isIgnored = ignoreList.includes(header);
                              return (
                                <button
                                  key={header}
                                  onClick={() => {
                                    if (isIgnored) {
                                      removeIgnoreTag(header);
                                    } else {
                                      setIgnoreList([...ignoreList, header]);
                                    }
                                  }}
                                  className={`${styles.columnChip} ${isIgnored ? styles.ignoredChip : styles.activeChip}`}
                                >
                                  {header}
                                  {isIgnored && <span className={styles.chipIcon}>✕</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Active Filter List (Summary) */}
                      {(!csvHeaders || csvHeaders.length === 0) && (
                        <div className={styles.tagsList}>
                          {ignoreList.map(tag => (
                            <span key={tag} className={styles.tag}>
                              {tag}
                              <button onClick={() => removeIgnoreTag(tag)} className={styles.removeTag}>×</button>
                            </span>
                          ))}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className={styles.error}>
                  <span className={styles.bold}>Error:</span> {error}
                </div>
              )}

              <p className={styles.subLabel} style={{ marginTop: '1rem', textTransform: 'none', fontWeight: '400', lineHeight: '1.5', opacity: 0.8 }}>
                Note: I tried my best to filter out unnecessary columns based on standard patterns (e.g. {IGNORE_PATTERNS.join(', ')}), but please check to ensure accuracy.
              </p>
            </div>
          </div>

          {/* RIGHT PANEL: Output */}
          <div className={styles.rightPanel}>
            <div className={styles.card}>
              {jsonOutput ? (
                <div className={styles.outputSection}>
                  <div className={styles.outputHeader}>
                    <h2 className={styles.subtitle}>JSON Output Preview</h2>
                    <div className={styles.buttonGroup}>
                      <button
                        onClick={handleCopy}
                        className={styles.secondaryButton}
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={handleDownload}
                        className={styles.button}
                      >
                        Download JSON
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={jsonOutput}
                    onChange={(e) => setJsonOutput(e.target.value)}
                    className={styles.textarea}
                  />
                </div>
              ) : (
                <div className={`${styles.outputSection} ${styles.placeholderPanel}`}>
                  <h2 className={styles.subtitle} style={{ opacity: 0.5 }}>JSON Output Preview</h2>
                  <div style={{
                    height: '28rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '1rem',
                    color: 'var(--color-text-secondary)',
                    border: '2px dashed rgba(58, 31, 102, 0.1)'
                  }}>
                    Upload a CSV to generate JSON
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
