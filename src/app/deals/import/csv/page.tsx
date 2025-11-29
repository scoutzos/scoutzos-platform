'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Upload, ArrowLeft, Check, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface CSVRow {
    [key: string]: string;
}

interface ColumnMapping {
    address: string;
    city: string;
    state: string;
    zip: string;
    price: string;
    beds?: string;
    baths?: string;
    sqft?: string;
    year_built?: string;
    estimated_rent?: string;
}

const REQUIRED_FIELDS = ['address', 'city', 'state', 'zip', 'price'] as const;
const OPTIONAL_FIELDS = ['beds', 'baths', 'sqft', 'year_built', 'estimated_rent'] as const;

export default function CSVImportPage() {
    const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'complete'>('upload');
    const [csvData, setCsvData] = useState<CSVRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<ColumnMapping>({
        address: '',
        city: '',
        state: '',
        zip: '',
        price: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ imported: number; matched: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseCSV = (text: string): { headers: string[]; rows: CSVRow[] } => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row');

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const rows: CSVRow[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const row: CSVRow = {};
            headers.forEach((h, idx) => {
                row[h] = values[idx] || '';
            });
            rows.push(row);
        }

        return { headers, rows };
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        try {
            const text = await file.text();
            const { headers, rows } = parseCSV(text);
            setHeaders(headers);
            setCsvData(rows);

            // Auto-detect column mappings
            const autoMapping: ColumnMapping = {
                address: '',
                city: '',
                state: '',
                zip: '',
                price: '',
            };

            const lowerHeaders = headers.map(h => h.toLowerCase());
            const patterns: Record<keyof ColumnMapping, string[]> = {
                address: ['address', 'street', 'address_line1', 'street_address'],
                city: ['city', 'town'],
                state: ['state', 'st'],
                zip: ['zip', 'zipcode', 'zip_code', 'postal'],
                price: ['price', 'list_price', 'asking_price', 'amount'],
                beds: ['beds', 'bedrooms', 'bed', 'br'],
                baths: ['baths', 'bathrooms', 'bath', 'ba'],
                sqft: ['sqft', 'square_feet', 'sq_ft', 'living_area', 'size'],
                year_built: ['year_built', 'yearbuilt', 'year', 'built'],
                estimated_rent: ['rent', 'estimated_rent', 'rental', 'monthly_rent'],
            };

            for (const [field, patternList] of Object.entries(patterns)) {
                const idx = lowerHeaders.findIndex(h =>
                    patternList.some(p => h.includes(p))
                );
                if (idx !== -1) {
                    autoMapping[field as keyof ColumnMapping] = headers[idx];
                }
            }

            setMapping(autoMapping);
            setStep('mapping');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse CSV');
        }
    };

    const validateMapping = (): boolean => {
        for (const field of REQUIRED_FIELDS) {
            if (!mapping[field]) {
                setError(`Please map the required field: ${field}`);
                return false;
            }
        }
        setError(null);
        return true;
    };

    const handleProceedToPreview = () => {
        if (validateMapping()) {
            setStep('preview');
        }
    };

    const handleImport = async () => {
        setStep('importing');
        setError(null);

        try {
            const deals = csvData.map(row => ({
                address_line1: row[mapping.address] || '',
                city: row[mapping.city] || '',
                state: row[mapping.state] || '',
                zip: row[mapping.zip] || '',
                list_price: parseFloat(row[mapping.price]?.replace(/[$,]/g, '') || '0'),
                beds: mapping.beds ? parseInt(row[mapping.beds]) || null : null,
                baths: mapping.baths ? parseFloat(row[mapping.baths]) || null : null,
                sqft: mapping.sqft ? parseInt(row[mapping.sqft]?.replace(/,/g, '')) || null : null,
                year_built: mapping.year_built ? parseInt(row[mapping.year_built]) || null : null,
                estimated_rent: mapping.estimated_rent ? parseFloat(row[mapping.estimated_rent]?.replace(/[$,]/g, '')) || null : null,
            }));

            const res = await fetch('/api/deals/import-csv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deals }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Import failed');
            }

            const data = await res.json();
            setResult(data);
            setStep('complete');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Import failed');
            setStep('preview');
        }
    };

    const previewDeals = csvData.slice(0, 5).map(row => ({
        address: row[mapping.address] || '-',
        city: row[mapping.city] || '-',
        state: row[mapping.state] || '-',
        zip: row[mapping.zip] || '-',
        price: row[mapping.price] || '-',
        beds: mapping.beds ? row[mapping.beds] || '-' : '-',
        baths: mapping.baths ? row[mapping.baths] || '-' : '-',
    }));

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Link href="/deals" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
                <ArrowLeft className="w-4 h-4" />
                Back to Deals
            </Link>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <FileSpreadsheet className="w-8 h-8 text-brand-primary" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Import Deals from CSV</h1>
                        <p className="text-gray-500">Upload a CSV file to bulk import deals</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-error-soft border border-error rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
                        <p className="text-error">{error}</p>
                    </div>
                )}

                {/* Step: Upload */}
                {step === 'upload' && (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">
                            Drop your CSV file here or click to browse
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Required columns: address, city, state, zip, price
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-brand-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-primary-hover transition-colors"
                        >
                            Select CSV File
                        </button>
                    </div>
                )}

                {/* Step: Mapping */}
                {step === 'mapping' && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Map CSV Columns</h2>
                        <p className="text-gray-500 mb-6">Match your CSV columns to the required fields</p>

                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-700">Required Fields</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {REQUIRED_FIELDS.map(field => (
                                    <div key={field}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                                            {field.replace('_', ' ')} <span className="text-error">*</span>
                                        </label>
                                        <select
                                            value={mapping[field] || ''}
                                            onChange={e => setMapping({ ...mapping, [field]: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                                        >
                                            <option value="">Select column...</option>
                                            {headers.map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <h3 className="font-medium text-gray-700 mt-6">Optional Fields</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {OPTIONAL_FIELDS.map(field => (
                                    <div key={field}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                                            {field.replace('_', ' ')}
                                        </label>
                                        <select
                                            value={mapping[field] || ''}
                                            onChange={e => setMapping({ ...mapping, [field]: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                                        >
                                            <option value="">Select column...</option>
                                            {headers.map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between mt-8">
                            <button
                                onClick={() => setStep('upload')}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleProceedToPreview}
                                className="bg-brand-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-primary-hover transition-colors"
                            >
                                Preview Import
                            </button>
                        </div>
                    </div>
                )}

                {/* Step: Preview */}
                {step === 'preview' && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Preview Import</h2>
                        <p className="text-gray-500 mb-6">
                            Showing first 5 of {csvData.length} deals to import
                        </p>

                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zip</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Beds</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Baths</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {previewDeals.map((deal, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3 text-sm text-gray-900">{deal.address}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{deal.city}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{deal.state}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{deal.zip}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{deal.price}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{deal.beds}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{deal.baths}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between mt-8">
                            <button
                                onClick={() => setStep('mapping')}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleImport}
                                className="bg-brand-ai text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-ai-strong transition-colors"
                            >
                                Import {csvData.length} Deals
                            </button>
                        </div>
                    </div>
                )}

                {/* Step: Importing */}
                {step === 'importing' && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mx-auto mb-4"></div>
                        <p className="text-lg font-medium text-gray-900">Importing deals...</p>
                        <p className="text-gray-500">This may take a moment</p>
                    </div>
                )}

                {/* Step: Complete */}
                {step === 'complete' && result && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-success-soft rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-success" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Complete!</h2>
                        <p className="text-lg text-gray-600 mb-6">
                            Imported {result.imported} deals, {result.matched} matches found
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link
                                href="/deals"
                                className="bg-brand-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-primary-hover transition-colors"
                            >
                                View Deals
                            </Link>
                            <button
                                onClick={() => {
                                    setStep('upload');
                                    setCsvData([]);
                                    setHeaders([]);
                                    setResult(null);
                                }}
                                className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                Import More
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
