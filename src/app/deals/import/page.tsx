"use client";

import { useState, useCallback } from "react";
import { upsertDeal, type RawDealInput } from "@/lib/dealsIngest";

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

export default function DealsImportPage() {
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

    // rent_estimate is optional, but validate if provided
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
        const rowNumber = i + 2; // +2 because of header row and 0-indexing

        // Validate row
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
          // Parse numeric values
          const listPrice = parseFloat(String(row.list_price).replace(/[,$]/g, ""));
          const rentEstimate = row.rent_estimate !== undefined && row.rent_estimate !== ""
            ? parseFloat(String(row.rent_estimate).replace(/[,$]/g, ""))
            : null;

          // Build the deal input matching RawDealInput type
          const dealInput: RawDealInput = {
            address: row.address.trim(),
            city: row.city.trim(),
            state: row.state.trim(),
            list_price: listPrice,
            rent_estimate: rentEstimate,
            source: "csv_import",
            status: "active",
          };

          await upsertDeal(dealInput);

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
            Upload a CSV with columns: address, city, state, list_price (required) and rent_estimate (optional)
          </p>
        </div>

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
            Required: address, city, state, list_price • Optional: rent_estimate
          </p>
          <pre className="text-xs text-zinc-500 overflow-x-auto">
{`address,city,state,list_price,rent_estimate
123 Main St,Atlanta,GA,350000,2500
456 Oak Ave,Marietta,GA,275000,1800
789 Pine Rd,Decatur,GA,425000,`}</pre>
        </div>
      </div>
    </div>
  );
}
