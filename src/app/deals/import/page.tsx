'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileSpreadsheet, Search, Loader2, Check, X } from 'lucide-react';

interface CSVRow {
  address: string;
  city: string;
  state: string;
  list_price: string | number;
  rent_estimate?: string | number;
}

interface ImportResult {
  row: number;
  address: string;
  success: boolean;
  error?: string;
}

interface ZillowProperty {
  address: string;
  city: string;
  state: string;
  zipcode: string;
  list_price: number;
  rent_estimate: number | null;
  url: string;
  source: string;
  source_url: string;
  is_off_market: boolean;
  status: string;
  beds: number;
  baths: number;
  sqft: number;
  lot_size: number;
  year_built: number | null;
  property_type: string;
  days_on_market: number;
  photos: string[];
  latitude: number;
  longitude: number;
}

interface ZillowSearchResponse {
  success: boolean;
  totalResults: number;
  savedCount: number;
  properties: ZillowProperty[];
  errors?: string[];
  error?: string;
}

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

const PROPERTY_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'Houses', label: 'House' },
  { value: 'Condos', label: 'Condo' },
  { value: 'Townhomes', label: 'Townhouse' },
  { value: 'Multi-family', label: 'Multi-family' },
];

export default function ImportDealsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'csv' | 'zillow'>('csv');

  // CSV Import State
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [summary, setSummary] = useState<{ total: number; success: number; failed: number } | null>(null);

  // Zillow Search State
  const [zillowForm, setZillowForm] = useState({
    city: '',
    state: '',
    minPrice: '',
    maxPrice: '',
    bedsMin: '',
    bedsMax: '',
    home_type: '',
  });
  const [zillowSearching, setZillowSearching] = useState(false);
  const [zillowResults, setZillowResults] = useState<ZillowProperty[]>([]);
  const [zillowTotalResults, setZillowTotalResults] = useState(0);
  const [zillowError, setZillowError] = useState<string | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<Set<number>>(new Set());
  const [importingSelected, setImportingSelected] = useState(false);
  const [zillowImportSummary, setZillowImportSummary] = useState<{ total: number; success: number; failed: number } | null>(null);

  // CSV Parsing Functions
  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
    const requiredHeaders = ['address', 'city', 'state', 'list_price'];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);

    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length !== headers.length) continue;

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim().replace(/^["']|["']$/g, '') || '';
      });

      rows.push({
        address: row.address,
        city: row.city,
        state: row.state,
        list_price: row.list_price,
        rent_estimate: row.rent_estimate,
      });
    }
    return rows;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i - 1] !== '\\') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const validateRow = (row: CSVRow, rowIndex: number): string | null => {
    if (!row.address?.trim()) return `Row ${rowIndex}: Address is required`;
    if (!row.city?.trim()) return `Row ${rowIndex}: City is required`;
    if (!row.state?.trim()) return `Row ${rowIndex}: State is required`;
    const listPrice = parseFloat(String(row.list_price).replace(/[,$]/g, ''));
    if (isNaN(listPrice) || listPrice < 0) return `Row ${rowIndex}: Invalid list_price`;
    if (row.rent_estimate !== undefined && row.rent_estimate !== '') {
      const rentEstimate = parseFloat(String(row.rent_estimate).replace(/[,$]/g, ''));
      if (isNaN(rentEstimate) || rentEstimate < 0) return `Row ${rowIndex}: Invalid rent_estimate`;
    }
    return null;
  };

  const handleImport = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setResults([]);
    setSummary(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) throw new Error('No valid data rows found in CSV');

      const importResults: ImportResult[] = [];
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2;
        const validationError = validateRow(row, rowNumber);

        if (validationError) {
          importResults.push({ row: rowNumber, address: row.address || 'Unknown', success: false, error: validationError });
          failedCount++;
          setProgress(((i + 1) / rows.length) * 100);
          continue;
        }

        try {
          const listPrice = parseFloat(String(row.list_price).replace(/[,$]/g, ''));
          const rentEstimate = row.rent_estimate !== undefined && row.rent_estimate !== ''
            ? parseFloat(String(row.rent_estimate).replace(/[,$]/g, ''))
            : null;

          const response = await fetch('/api/deals/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deals: [{
                address: row.address.trim(),
                city: row.city.trim(),
                state: row.state.trim(),
                list_price: listPrice,
                rent_estimate: rentEstimate,
                source: 'csv_import',
              }],
            }),
          });

          const result = await response.json();
          if (!result.success || result.failed > 0) throw new Error(result.errors?.[0] || 'Import failed');

          importResults.push({ row: rowNumber, address: row.address, success: true });
          successCount++;
        } catch (error) {
          importResults.push({ row: rowNumber, address: row.address, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
          failedCount++;
        }

        setProgress(((i + 1) / rows.length) * 100);
        setResults([...importResults]);
      }

      setSummary({ total: rows.length, success: successCount, failed: failedCount });
    } catch (error) {
      setResults([{ row: 0, address: 'N/A', success: false, error: error instanceof Error ? error.message : 'Failed to parse CSV' }]);
      setSummary({ total: 0, success: 0, failed: 1 });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'text/csv' || droppedFile?.name.endsWith('.csv')) {
      setFile(droppedFile);
      setResults([]);
      setSummary(null);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults([]);
      setSummary(null);
    }
  };

  const reset = () => {
    setFile(null);
    setResults([]);
    setSummary(null);
    setProgress(0);
  };

  // Zillow Search Functions
  const handleZillowSearch = async () => {
    if (!zillowForm.city || !zillowForm.state) {
      setZillowError('City and State are required');
      return;
    }

    setZillowSearching(true);
    setZillowError(null);
    setZillowResults([]);
    setZillowTotalResults(0);
    setSelectedProperties(new Set());
    setZillowImportSummary(null);

    try {
      const response = await fetch('/api/scrape-zillow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: zillowForm.city,
          state: zillowForm.state,
          minPrice: zillowForm.minPrice ? parseInt(zillowForm.minPrice) : undefined,
          maxPrice: zillowForm.maxPrice ? parseInt(zillowForm.maxPrice) : undefined,
          bedsMin: zillowForm.bedsMin ? parseInt(zillowForm.bedsMin) : undefined,
          bedsMax: zillowForm.bedsMax ? parseInt(zillowForm.bedsMax) : undefined,
          home_type: zillowForm.home_type || undefined,
          saveToDb: false,
        }),
      });

      const data: ZillowSearchResponse = await response.json();
      if (!data.success) {
        setZillowError(data.error || 'Search failed');
        return;
      }
      setZillowResults(data.properties);
      setZillowTotalResults(data.totalResults);
    } catch (error) {
      setZillowError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setZillowSearching(false);
    }
  };

  const togglePropertySelection = (index: number) => {
    const newSelected = new Set(selectedProperties);
    if (newSelected.has(index)) newSelected.delete(index);
    else newSelected.add(index);
    setSelectedProperties(newSelected);
  };

  const selectAllProperties = () => {
    if (selectedProperties.size === zillowResults.length) setSelectedProperties(new Set());
    else setSelectedProperties(new Set(zillowResults.map((_, i) => i)));
  };

  const handleImportSelected = async () => {
    if (selectedProperties.size === 0) return;
    setImportingSelected(true);
    setZillowImportSummary(null);

    const dealsToImport = Array.from(selectedProperties).map((index) => {
      const prop = zillowResults[index];
      return {
        address: prop.address,
        city: prop.city,
        state: prop.state,
        zipcode: prop.zipcode,
        list_price: prop.list_price,
        rent_estimate: prop.rent_estimate,
        url: prop.url,
        source: 'zillow',
        source_url: prop.source_url,
        is_off_market: prop.is_off_market,
        beds: prop.beds,
        baths: prop.baths,
        sqft: prop.sqft,
        lot_size: prop.lot_size,
        year_built: prop.year_built,
        property_type: prop.property_type,
        days_on_market: prop.days_on_market,
        photos: prop.photos,
        latitude: prop.latitude,
        longitude: prop.longitude,
      };
    });

    try {
      const response = await fetch('/api/deals/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deals: dealsToImport }),
      });
      const result = await response.json();
      setZillowImportSummary({
        total: selectedProperties.size,
        success: result.imported || 0,
        failed: result.failed || 0,
      });
    } catch {
      setZillowImportSummary({ total: selectedProperties.size, success: 0, failed: selectedProperties.size });
    }

    setImportingSelected(false);
    setSelectedProperties(new Set());
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-primary-deep">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/deals" className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Deals
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Import Deals</h1>
          <p className="text-gray-500 mt-1">Import deals from CSV or search Zillow for properties</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'csv' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            CSV Import
          </button>
          <button
            onClick={() => setActiveTab('zillow')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'zillow' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Zillow Search
          </button>
        </div>

        {/* CSV Import Tab */}
        {activeTab === 'csv' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-brand-primary-soft flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Import from CSV</h2>
                <p className="text-gray-500 text-sm mt-0.5">Upload a CSV file to bulk import deals</p>
              </div>
            </div>

            {/* Upload Area */}
            {!summary && (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  isDragging ? 'border-brand-primary bg-brand-primary-soft' : 'border-gray-300 hover:border-gray-400'
                } ${file ? 'bg-success-soft border-success' : ''}`}
              >
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {file ? (
                  <>
                    <FileSpreadsheet className="w-12 h-12 text-success mx-auto mb-4" />
                    <p className="text-gray-900 font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    <button onClick={reset} className="mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                      Choose different file
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-900 font-medium">Drop your CSV file here or click to browse</p>
                    <p className="text-sm text-gray-500 mt-2">Required columns: address, city, state, list_price</p>
                  </>
                )}
              </div>
            )}

            {/* Progress Bar */}
            {isProcessing && (
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Importing deals...</span>
                  <span className="text-gray-500">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {/* Import Button */}
            {file && !isProcessing && !summary && (
              <button
                onClick={handleImport}
                className="mt-6 w-full py-3 px-6 bg-brand-primary hover:bg-brand-primary-hover text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import Deals
              </button>
            )}

            {/* Summary */}
            {summary && (
              <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Complete</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                    <p className="text-2xl font-semibold text-gray-900">{summary.total}</p>
                    <p className="text-sm text-gray-500 mt-1">Total Rows</p>
                  </div>
                  <div className="text-center p-4 bg-success-soft rounded-lg">
                    <p className="text-2xl font-semibold text-success">{summary.success}</p>
                    <p className="text-sm text-gray-500 mt-1">Successful</p>
                  </div>
                  <div className="text-center p-4 bg-error-soft rounded-lg">
                    <p className="text-2xl font-semibold text-error">{summary.failed}</p>
                    <p className="text-sm text-gray-500 mt-1">Failed</p>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => router.push('/deals')}
                    className="flex-1 py-2.5 px-4 bg-brand-primary hover:bg-brand-primary-hover text-white font-medium rounded-lg transition-colors"
                  >
                    View Deals
                  </button>
                  <button
                    onClick={reset}
                    className="flex-1 py-2.5 px-4 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Import More
                  </button>
                </div>
              </div>
            )}

            {/* Results Table */}
            {results.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">{isProcessing ? 'Processing...' : 'Results'}</h3>
                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Row</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Address</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {results.map((result, index) => (
                          <tr key={index} className="bg-white">
                            <td className="px-4 py-3 text-sm text-gray-600">{result.row}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{result.address}</td>
                            <td className="px-4 py-3">
                              {result.success ? (
                                <span className="inline-flex items-center gap-1.5 text-sm text-success">
                                  <Check className="w-4 h-4" />
                                  Success
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-sm text-error">
                                  <X className="w-4 h-4" />
                                  <span className="truncate max-w-[180px]" title={result.error}>{result.error}</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* CSV Format Help */}
            {!summary && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Expected CSV Format</h3>
                <p className="text-xs text-gray-500 mb-2">Required: address, city, state, list_price - Optional: rent_estimate</p>
                <pre className="text-xs text-gray-500 overflow-x-auto bg-white p-3 rounded border border-gray-200">
{`address,city,state,list_price,rent_estimate
123 Main St,Atlanta,GA,350000,2500
456 Oak Ave,Marietta,GA,275000,1800`}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Zillow Search Tab */}
        {activeTab === 'zillow' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-brand-primary-soft flex items-center justify-center">
                <Search className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Search Zillow</h2>
                <p className="text-gray-500 text-sm mt-0.5">Find and import properties from Zillow</p>
              </div>
            </div>

            {/* Search Form */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City <span className="text-error">*</span></label>
                <input
                  type="text"
                  value={zillowForm.city}
                  onChange={(e) => setZillowForm({ ...zillowForm, city: e.target.value })}
                  placeholder="e.g., Atlanta"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">State <span className="text-error">*</span></label>
                <select
                  value={zillowForm.state}
                  onChange={(e) => setZillowForm({ ...zillowForm, state: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-colors"
                >
                  <option value="">Select State</option>
                  {US_STATES.map((state) => (
                    <option key={state.value} value={state.value}>{state.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Price</label>
                <input
                  type="number"
                  value={zillowForm.minPrice}
                  onChange={(e) => setZillowForm({ ...zillowForm, minPrice: e.target.value })}
                  placeholder="e.g., 100000"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Price</label>
                <input
                  type="number"
                  value={zillowForm.maxPrice}
                  onChange={(e) => setZillowForm({ ...zillowForm, maxPrice: e.target.value })}
                  placeholder="e.g., 500000"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Beds</label>
                <input
                  type="number"
                  value={zillowForm.bedsMin}
                  onChange={(e) => setZillowForm({ ...zillowForm, bedsMin: e.target.value })}
                  placeholder="e.g., 2"
                  min="0"
                  max="10"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Beds</label>
                <input
                  type="number"
                  value={zillowForm.bedsMax}
                  onChange={(e) => setZillowForm({ ...zillowForm, bedsMax: e.target.value })}
                  placeholder="e.g., 5"
                  min="0"
                  max="10"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-colors"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Type</label>
                <select
                  value={zillowForm.home_type}
                  onChange={(e) => setZillowForm({ ...zillowForm, home_type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-colors"
                >
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error */}
            {zillowError && (
              <div className="mt-4 p-4 bg-error-soft border border-error rounded-lg">
                <p className="text-sm text-error">{zillowError}</p>
              </div>
            )}

            {/* Search Button */}
            <button
              onClick={handleZillowSearch}
              disabled={zillowSearching || !zillowForm.city || !zillowForm.state}
              className="mt-6 w-full py-3 px-6 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {zillowSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search Zillow
                </>
              )}
            </button>

            {/* Import Summary */}
            {zillowImportSummary && (
              <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Complete</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                    <p className="text-2xl font-semibold text-gray-900">{zillowImportSummary.total}</p>
                    <p className="text-sm text-gray-500 mt-1">Selected</p>
                  </div>
                  <div className="text-center p-4 bg-success-soft rounded-lg">
                    <p className="text-2xl font-semibold text-success">{zillowImportSummary.success}</p>
                    <p className="text-sm text-gray-500 mt-1">Imported</p>
                  </div>
                  <div className="text-center p-4 bg-error-soft rounded-lg">
                    <p className="text-2xl font-semibold text-error">{zillowImportSummary.failed}</p>
                    <p className="text-sm text-gray-500 mt-1">Failed</p>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {zillowResults.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
                    <p className="text-sm text-gray-500">Showing {zillowResults.length} of {zillowTotalResults} properties</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={selectAllProperties} className="text-sm text-brand-primary hover:text-brand-primary-hover transition-colors">
                      {selectedProperties.size === zillowResults.length ? 'Deselect All' : 'Select All'}
                    </button>
                    {selectedProperties.size > 0 && (
                      <button
                        onClick={handleImportSelected}
                        disabled={importingSelected}
                        className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        {importingSelected ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          `Import Selected (${selectedProperties.size})`
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {zillowResults.map((prop, index) => (
                    <div
                      key={index}
                      onClick={() => togglePropertySelection(index)}
                      className={`p-4 bg-gray-50 rounded-xl border cursor-pointer transition-all ${
                        selectedProperties.has(index) ? 'border-brand-primary bg-brand-primary-soft' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedProperties.has(index) ? 'bg-brand-primary border-brand-primary' : 'border-gray-300'
                        }`}>
                          {selectedProperties.has(index) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-gray-900 truncate">{prop.address}</p>
                              <p className="text-sm text-gray-500">{prop.city}, {prop.state}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold text-brand-primary">{formatCurrency(prop.list_price)}</p>
                              {prop.rent_estimate && (
                                <p className="text-xs text-gray-500">Est. Rent: {formatCurrency(prop.rent_estimate)}/mo</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!zillowSearching && zillowResults.length === 0 && !zillowError && (
              <div className="mt-8 text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600">Search Zillow to find properties</p>
                <p className="text-sm mt-1">Enter a city and state to get started</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
