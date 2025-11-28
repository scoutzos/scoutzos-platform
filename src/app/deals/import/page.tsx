"use client";

import { useState, useCallback } from "react";

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
  // Additional fields
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
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

const PROPERTY_TYPES = [
  { value: "", label: "All Types" },
  { value: "Houses", label: "House" },
  { value: "Condos", label: "Condo" },
  { value: "Townhomes", label: "Townhouse" },
  { value: "Multi-family", label: "Multi-family" },
];

export default function DealsImportPage() {
  const [activeTab, setActiveTab] = useState<"csv" | "zillow">("csv");

  // CSV Import State
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    success: number;
    failed: number;
  } | null>(null);

  // Zillow Search State
  const [zillowForm, setZillowForm] = useState({
    city: "",
    state: "",
    minPrice: "",
    maxPrice: "",
    bedsMin: "",
    bedsMax: "",
    home_type: "",
  });
  const [zillowSearching, setZillowSearching] = useState(false);
  const [zillowResults, setZillowResults] = useState<ZillowProperty[]>([]);
  const [zillowTotalResults, setZillowTotalResults] = useState(0);
  const [zillowError, setZillowError] = useState<string | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<Set<number>>(new Set());
  const [importingSelected, setImportingSelected] = useState(false);
  const [zillowImportSummary, setZillowImportSummary] = useState<{
    total: number;
    success: number;
    failed: number;
  } | null>(null);

  // CSV Import Functions
  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV must have a header row and at least one data row");
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
    const requiredHeaders = ["address", "city", "state", "list_price"];

    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(", ")}`);
    }

    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length !== headers.length) {
        console.warn(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
        continue;
      }

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim().replace(/^["']|["']$/g, "") || "";
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
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i - 1] !== "\\") {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const validateRow = (row: CSVRow, rowIndex: number): string | null => {
    if (!row.address?.trim()) {
      return `Row ${rowIndex}: Address is required`;
    }
    if (!row.city?.trim()) {
      return `Row ${rowIndex}: City is required`;
    }
    if (!row.state?.trim()) {
      return `Row ${rowIndex}: State is required`;
    }

    const listPrice = parseFloat(String(row.list_price).replace(/[,$]/g, ""));
    if (isNaN(listPrice) || listPrice < 0) {
      return `Row ${rowIndex}: Invalid list_price`;
    }

    if (row.rent_estimate !== undefined && row.rent_estimate !== "") {
      const rentEstimate = parseFloat(String(row.rent_estimate).replace(/[,$]/g, ""));
      if (isNaN(rentEstimate) || rentEstimate < 0) {
        return `Row ${rowIndex}: Invalid rent_estimate`;
      }
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

      if (rows.length === 0) {
        throw new Error("No valid data rows found in CSV");
      }

      const importResults: ImportResult[] = [];
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2;

        const validationError = validateRow(row, rowNumber);
        if (validationError) {
          importResults.push({
            row: rowNumber,
            address: row.address || "Unknown",
            success: false,
            error: validationError,
          });
          failedCount++;
          setProgress(((i + 1) / rows.length) * 100);
          continue;
        }

        try {
          const listPrice = parseFloat(String(row.list_price).replace(/[,$]/g, ""));
          const rentEstimate = row.rent_estimate !== undefined && row.rent_estimate !== ""
            ? parseFloat(String(row.rent_estimate).replace(/[,$]/g, ""))
            : null;

          const dealInput = {
            address: row.address.trim(),
            city: row.city.trim(),
            state: row.state.trim(),
            list_price: listPrice,
            rent_estimate: rentEstimate,
            source: "csv_import",
          };

          // Use API route for import
          const response = await fetch("/api/deals/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deals: [dealInput] }),
          });

          const result = await response.json();
          if (!result.success || result.failed > 0) {
            throw new Error(result.errors?.[0] || "Import failed");
          }

          importResults.push({
            row: rowNumber,
            address: row.address,
            success: true,
          });
          successCount++;
        } catch (error) {
          importResults.push({
            row: rowNumber,
            address: row.address,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          failedCount++;
        }

        setProgress(((i + 1) / rows.length) * 100);
        setResults([...importResults]);
      }

      setSummary({
        total: rows.length,
        success: successCount,
        failed: failedCount,
      });
    } catch (error) {
      setResults([
        {
          row: 0,
          address: "N/A",
          success: false,
          error: error instanceof Error ? error.message : "Failed to parse CSV",
        },
      ]);
      setSummary({ total: 0, success: 0, failed: 1 });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === "text/csv" || droppedFile?.name.endsWith(".csv")) {
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
      setZillowError("City and State are required");
      return;
    }

    setZillowSearching(true);
    setZillowError(null);
    setZillowResults([]);
    setZillowTotalResults(0);
    setSelectedProperties(new Set());
    setZillowImportSummary(null);

    try {
      const response = await fetch("/api/scrape-zillow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: zillowForm.city,
          state: zillowForm.state,
          minPrice: zillowForm.minPrice ? parseInt(zillowForm.minPrice) : undefined,
          maxPrice: zillowForm.maxPrice ? parseInt(zillowForm.maxPrice) : undefined,
          bedsMin: zillowForm.bedsMin ? parseInt(zillowForm.bedsMin) : undefined,
          bedsMax: zillowForm.bedsMax ? parseInt(zillowForm.bedsMax) : undefined,
          home_type: zillowForm.home_type || undefined,
          saveToDb: false, // Don't auto-save, let user select
        }),
      });

      const data: ZillowSearchResponse = await response.json();

      if (!data.success) {
        setZillowError(data.error || "Search failed");
        return;
      }

      setZillowResults(data.properties);
      setZillowTotalResults(data.totalResults);
    } catch (error) {
      setZillowError(error instanceof Error ? error.message : "Search failed");
    } finally {
      setZillowSearching(false);
    }
  };

  const togglePropertySelection = (index: number) => {
    const newSelected = new Set(selectedProperties);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedProperties(newSelected);
  };

  const selectAllProperties = () => {
    if (selectedProperties.size === zillowResults.length) {
      setSelectedProperties(new Set());
    } else {
      setSelectedProperties(new Set(zillowResults.map((_, i) => i)));
    }
  };

  const handleImportSelected = async () => {
    if (selectedProperties.size === 0) return;

    setImportingSelected(true);
    setZillowImportSummary(null);

    // Collect all selected properties with full details
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
        source: "zillow",
        source_url: prop.source_url,
        is_off_market: prop.is_off_market,
        // Additional fields
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
      const response = await fetch("/api/deals/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deals: dealsToImport }),
      });

      const result = await response.json();

      setZillowImportSummary({
        total: selectedProperties.size,
        success: result.imported || 0,
        failed: result.failed || 0,
      });
    } catch (error) {
      console.error("Import error:", error);
      setZillowImportSummary({
        total: selectedProperties.size,
        success: 0,
        failed: selectedProperties.size,
      });
    }

    setImportingSelected(false);
    setSelectedProperties(new Set());
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <a
            href="/deals"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm mb-6"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Deals
          </a>
          <h1 className="text-3xl font-semibold tracking-tight">Import Deals</h1>
          <p className="text-zinc-500 mt-2">
            Import deals from CSV or search Zillow for properties
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 mb-8">
          <button
            onClick={() => setActiveTab("csv")}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "csv"
                ? "text-emerald-500"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            CSV Import
            {activeTab === "csv" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("zillow")}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "zillow"
                ? "text-emerald-500"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Zillow Search
            {activeTab === "zillow" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
            )}
          </button>
        </div>

        {/* CSV Import Tab */}
        {activeTab === "csv" && (
          <>
            {/* Upload Area */}
            {!summary && (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                className={`
                  relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
                  ${isDragging
                    ? "border-emerald-500 bg-emerald-500/5"
                    : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/50"
                  }
                  ${file ? "border-emerald-600 bg-emerald-500/5" : ""}
                `}
              >
                {file ? (
                  <div className="space-y-4">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10">
                      <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-zinc-100">{file.name}</p>
                      <p className="text-sm text-zinc-500 mt-1">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={reset}
                      className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Choose different file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-zinc-800">
                      <svg className="w-7 h-7 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-zinc-300">
                        Drop your CSV file here
                      </p>
                      <p className="text-sm text-zinc-500 mt-1">or click to browse</p>
                    </div>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Progress Bar */}
            {isProcessing && (
              <div className="mt-8">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-zinc-400">Importing deals...</span>
                  <span className="text-zinc-500">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Import Button */}
            {file && !isProcessing && !summary && (
              <button
                onClick={handleImport}
                className="mt-8 w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
              >
                Import Deals
              </button>
            )}

            {/* Summary */}
            {summary && (
              <div className="mt-8 p-6 bg-zinc-900 rounded-xl border border-zinc-800">
                <h3 className="text-lg font-medium mb-4">Import Complete</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                    <p className="text-2xl font-semibold text-zinc-100">{summary.total}</p>
                    <p className="text-sm text-zinc-500 mt-1">Total Rows</p>
                  </div>
                  <div className="text-center p-4 bg-emerald-500/10 rounded-lg">
                    <p className="text-2xl font-semibold text-emerald-500">{summary.success}</p>
                    <p className="text-sm text-zinc-500 mt-1">Successful</p>
                  </div>
                  <div className="text-center p-4 bg-red-500/10 rounded-lg">
                    <p className="text-2xl font-semibold text-red-500">{summary.failed}</p>
                    <p className="text-sm text-zinc-500 mt-1">Failed</p>
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="mt-6 w-full py-3 px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium rounded-lg transition-colors"
                >
                  Import Another File
                </button>
              </div>
            )}

            {/* Results Table */}
            {results.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">
                  {isProcessing ? "Processing..." : "Results"}
                </h3>
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-zinc-800/50 sticky top-0">
                        <tr>
                          <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">
                            Row
                          </th>
                          <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">
                            Address
                          </th>
                          <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {results.map((result, index) => (
                          <tr key={index} className="hover:bg-zinc-800/30">
                            <td className="px-4 py-3 text-sm text-zinc-400">
                              {result.row}
                            </td>
                            <td className="px-4 py-3 text-sm text-zinc-300 max-w-xs truncate">
                              {result.address}
                            </td>
                            <td className="px-4 py-3">
                              {result.success ? (
                                <span className="inline-flex items-center gap-1.5 text-sm text-emerald-500">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Success
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-sm text-red-500">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  <span className="truncate max-w-[200px]" title={result.error}>
                                    {result.error}
                                  </span>
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
            <div className="mt-12 p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Expected CSV Format</h3>
              <p className="text-xs text-zinc-500 mb-3">
                Required: address, city, state, list_price - Optional: rent_estimate
              </p>
              <pre className="text-xs text-zinc-500 overflow-x-auto">
{`address,city,state,list_price,rent_estimate
123 Main St,Atlanta,GA,350000,2500
456 Oak Ave,Marietta,GA,275000,1800
789 Pine Rd,Decatur,GA,425000,`}</pre>
            </div>
          </>
        )}

        {/* Zillow Search Tab */}
        {activeTab === "zillow" && (
          <>
            {/* Search Form */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-medium mb-6">Search Zillow Properties</h3>

              <div className="grid grid-cols-2 gap-4">
                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={zillowForm.city}
                    onChange={(e) => setZillowForm({ ...zillowForm, city: e.target.value })}
                    placeholder="e.g., Atlanta"
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={zillowForm.state}
                    onChange={(e) => setZillowForm({ ...zillowForm, state: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="">Select State</option>
                    {US_STATES.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Price */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Min Price
                  </label>
                  <input
                    type="number"
                    value={zillowForm.minPrice}
                    onChange={(e) => setZillowForm({ ...zillowForm, minPrice: e.target.value })}
                    placeholder="e.g., 100000"
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Max Price
                  </label>
                  <input
                    type="number"
                    value={zillowForm.maxPrice}
                    onChange={(e) => setZillowForm({ ...zillowForm, maxPrice: e.target.value })}
                    placeholder="e.g., 500000"
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Min Beds */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Min Beds
                  </label>
                  <input
                    type="number"
                    value={zillowForm.bedsMin}
                    onChange={(e) => setZillowForm({ ...zillowForm, bedsMin: e.target.value })}
                    placeholder="e.g., 2"
                    min="0"
                    max="10"
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Max Beds */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Max Beds
                  </label>
                  <input
                    type="number"
                    value={zillowForm.bedsMax}
                    onChange={(e) => setZillowForm({ ...zillowForm, bedsMax: e.target.value })}
                    placeholder="e.g., 5"
                    min="0"
                    max="10"
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Property Type */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Property Type
                  </label>
                  <select
                    value={zillowForm.home_type}
                    onChange={(e) => setZillowForm({ ...zillowForm, home_type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Error */}
              {zillowError && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-500">{zillowError}</p>
                </div>
              )}

              {/* Search Button */}
              <button
                onClick={handleZillowSearch}
                disabled={zillowSearching || !zillowForm.city || !zillowForm.state}
                className="mt-6 w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {zillowSearching ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search Zillow
                  </>
                )}
              </button>
            </div>

            {/* Import Summary */}
            {zillowImportSummary && (
              <div className="mt-6 p-6 bg-zinc-900 rounded-xl border border-zinc-800">
                <h3 className="text-lg font-medium mb-4">Import Complete</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                    <p className="text-2xl font-semibold text-zinc-100">{zillowImportSummary.total}</p>
                    <p className="text-sm text-zinc-500 mt-1">Selected</p>
                  </div>
                  <div className="text-center p-4 bg-emerald-500/10 rounded-lg">
                    <p className="text-2xl font-semibold text-emerald-500">{zillowImportSummary.success}</p>
                    <p className="text-sm text-zinc-500 mt-1">Imported</p>
                  </div>
                  <div className="text-center p-4 bg-red-500/10 rounded-lg">
                    <p className="text-2xl font-semibold text-red-500">{zillowImportSummary.failed}</p>
                    <p className="text-sm text-zinc-500 mt-1">Failed</p>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {zillowResults.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Search Results</h3>
                    <p className="text-sm text-zinc-500">
                      Showing {zillowResults.length} of {zillowTotalResults} properties
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={selectAllProperties}
                      className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors"
                    >
                      {selectedProperties.size === zillowResults.length ? "Deselect All" : "Select All"}
                    </button>
                    {selectedProperties.size > 0 && (
                      <button
                        onClick={handleImportSelected}
                        disabled={importingSelected}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        {importingSelected ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
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
                      className={`p-4 bg-zinc-900 rounded-xl border cursor-pointer transition-all ${
                        selectedProperties.has(index)
                          ? "border-emerald-500 bg-emerald-500/5"
                          : "border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedProperties.has(index)
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-zinc-600"
                        }`}>
                          {selectedProperties.has(index) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-zinc-100 truncate">
                                {prop.address}
                              </p>
                              <p className="text-sm text-zinc-500">
                                {prop.city}, {prop.state}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold text-emerald-500">
                                {formatCurrency(prop.list_price)}
                              </p>
                              {prop.rent_estimate && (
                                <p className="text-xs text-zinc-500">
                                  Est. Rent: {formatCurrency(prop.rent_estimate)}/mo
                                </p>
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
              <div className="mt-12 text-center text-zinc-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-lg">Search Zillow to find properties</p>
                <p className="text-sm mt-1">Enter a city and state to get started</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
