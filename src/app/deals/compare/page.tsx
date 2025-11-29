'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Home, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Deal } from '@/types/deals';

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '-';
  return `$${value.toLocaleString()}`;
}

function formatNumber(value: number | undefined | null): string {
  if (value == null) return '-';
  return value.toLocaleString();
}

function getPricePerSqft(price: number | undefined, sqft: number | undefined): number | null {
  if (!price || !sqft || sqft === 0) return null;
  return Math.round(price / sqft);
}

interface ComparisonRowProps {
  label: string;
  values: (string | number | null | undefined)[];
  format?: 'currency' | 'number' | 'text';
  highlight?: 'lowest' | 'highest' | 'none';
}

function ComparisonRow({ label, values, format = 'text', highlight = 'none' }: ComparisonRowProps) {
  const numericValues = values.map(v => typeof v === 'number' ? v : null);
  const validNumbers = numericValues.filter((v): v is number => v !== null);

  let minVal: number | null = null;
  let maxVal: number | null = null;

  if (validNumbers.length > 1) {
    minVal = Math.min(...validNumbers);
    maxVal = Math.max(...validNumbers);
  }

  const formatValue = (val: string | number | null | undefined): string => {
    if (val == null || val === '') return '-';
    if (format === 'currency' && typeof val === 'number') return formatCurrency(val);
    if (format === 'number' && typeof val === 'number') return formatNumber(val);
    return String(val);
  };

  const getCellClass = (val: string | number | null | undefined): string => {
    if (typeof val !== 'number' || highlight === 'none' || validNumbers.length <= 1) return '';

    if (highlight === 'lowest' && val === minVal) return 'bg-green-100 text-green-800 font-semibold';
    if (highlight === 'lowest' && val === maxVal) return 'bg-red-100 text-red-800';
    if (highlight === 'highest' && val === maxVal) return 'bg-green-100 text-green-800 font-semibold';
    if (highlight === 'highest' && val === minVal) return 'bg-red-100 text-red-800';
    return '';
  };

  const getDiffIndicator = (val: string | number | null | undefined, index: number): JSX.Element | null => {
    if (typeof val !== 'number' || index === 0 || validNumbers.length <= 1) return null;

    const firstVal = numericValues[0];
    if (firstVal === null) return null;

    const diff = val - firstVal;
    const percentDiff = ((val - firstVal) / firstVal * 100).toFixed(1);

    if (diff > 0) {
      return (
        <span className={`text-xs ml-1 ${highlight === 'lowest' ? 'text-red-600' : 'text-green-600'}`}>
          <TrendingUp className="w-3 h-3 inline" /> +{percentDiff}%
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className={`text-xs ml-1 ${highlight === 'lowest' ? 'text-green-600' : 'text-red-600'}`}>
          <TrendingDown className="w-3 h-3 inline" /> {percentDiff}%
        </span>
      );
    }
    return <span className="text-xs ml-1 text-gray-400"><Minus className="w-3 h-3 inline" /></span>;
  };

  return (
    <tr className="border-b border-gray-100">
      <td className="py-3 px-4 text-sm font-medium text-gray-600 bg-gray-50 w-40">{label}</td>
      {values.map((val, idx) => (
        <td key={idx} className={`py-3 px-4 text-sm text-center ${getCellClass(val)}`}>
          {formatValue(val)}
          {getDiffIndicator(val, idx)}
        </td>
      ))}
    </tr>
  );
}

export default function ComparePage() {
  const searchParams = useSearchParams();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const idsParam = searchParams.get('ids');
    if (!idsParam) {
      setError('No deals selected for comparison');
      setLoading(false);
      return;
    }

    const ids = idsParam.split(',').filter(Boolean);
    if (ids.length < 2) {
      setError('Please select at least 2 deals to compare');
      setLoading(false);
      return;
    }

    async function fetchDeals() {
      try {
        const dealPromises = ids.map(id =>
          fetch(`/api/deals/${id}`).then(res => {
            if (!res.ok) throw new Error(`Failed to fetch deal ${id}`);
            return res.json().then(data => data.deal);
          })
        );

        const fetchedDeals = await Promise.all(dealPromises);
        setDeals(fetchedDeals);
      } catch (err) {
        console.error('Failed to fetch deals:', err);
        setError('Failed to load deals for comparison');
      } finally {
        setLoading(false);
      }
    }

    fetchDeals();
  }, [searchParams]);

  const removeDeal = (dealId: string) => {
    const newDeals = deals.filter(d => d.id !== dealId);
    if (newDeals.length < 2) {
      window.history.back();
    } else {
      setDeals(newDeals);
      const newIds = newDeals.map(d => d.id).join(',');
      window.history.replaceState(null, '', `/deals/compare?ids=${newIds}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Link href="/deals" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Deals
        </Link>
        <div className="text-center py-12">
          <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{error}</h3>
          <Link href="/deals" className="text-blue-600 hover:underline">
            Go back to deals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Link href="/deals" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Deals
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Compare Deals</h1>
        <p className="text-gray-600">Side-by-side comparison of {deals.length} properties</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="py-4 px-4 text-left text-sm font-semibold text-gray-900 bg-gray-50 w-40">
                Property
              </th>
              {deals.map((deal) => (
                <th key={deal.id} className="py-4 px-4 text-center relative min-w-[200px]">
                  <button
                    onClick={() => removeDeal(deal.id)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                    title="Remove from comparison"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="pr-6">
                    {deal.photos?.[0] && (
                      <img
                        src={deal.photos[0]}
                        alt={deal.address_line1}
                        className="w-full h-32 object-cover rounded-lg mb-2"
                      />
                    )}
                    <Link
                      href={`/deals/${deal.id}`}
                      className="text-sm font-semibold text-gray-900 hover:text-blue-600 block"
                    >
                      {deal.address_line1}
                    </Link>
                    <p className="text-xs text-gray-500">{deal.city}, {deal.state} {deal.zip}</p>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Price Section */}
            <tr className="bg-gray-100">
              <td colSpan={deals.length + 1} className="py-2 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Pricing
              </td>
            </tr>
            <ComparisonRow
              label="List Price"
              values={deals.map(d => d.list_price)}
              format="currency"
              highlight="lowest"
            />
            <ComparisonRow
              label="Original Price"
              values={deals.map(d => d.original_list_price)}
              format="currency"
              highlight="lowest"
            />
            <ComparisonRow
              label="Price/Sq Ft"
              values={deals.map(d => getPricePerSqft(d.list_price, d.sqft))}
              format="currency"
              highlight="lowest"
            />
            <ComparisonRow
              label="Est. Rent"
              values={deals.map(d => d.estimated_rent || d.zillow_rent_estimate)}
              format="currency"
              highlight="highest"
            />
            <ComparisonRow
              label="HOA/Month"
              values={deals.map(d => d.hoa_monthly)}
              format="currency"
              highlight="lowest"
            />
            <ComparisonRow
              label="Annual Taxes"
              values={deals.map(d => d.tax_annual)}
              format="currency"
              highlight="lowest"
            />

            {/* Property Details Section */}
            <tr className="bg-gray-100">
              <td colSpan={deals.length + 1} className="py-2 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Property Details
              </td>
            </tr>
            <ComparisonRow
              label="Property Type"
              values={deals.map(d => d.property_type || '-')}
            />
            <ComparisonRow
              label="Beds"
              values={deals.map(d => d.beds)}
              format="number"
              highlight="highest"
            />
            <ComparisonRow
              label="Baths"
              values={deals.map(d => d.baths)}
              format="number"
              highlight="highest"
            />
            <ComparisonRow
              label="Sq Ft"
              values={deals.map(d => d.sqft)}
              format="number"
              highlight="highest"
            />
            <ComparisonRow
              label="Lot Size"
              values={deals.map(d => d.lot_size)}
              format="number"
              highlight="highest"
            />
            <ComparisonRow
              label="Year Built"
              values={deals.map(d => d.year_built)}
              format="number"
              highlight="highest"
            />

            {/* Market Info Section */}
            <tr className="bg-gray-100">
              <td colSpan={deals.length + 1} className="py-2 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Market Info
              </td>
            </tr>
            <ComparisonRow
              label="Days on Market"
              values={deals.map(d => d.days_on_market)}
              format="number"
              highlight="lowest"
            />
            <ComparisonRow
              label="Price Reduced"
              values={deals.map(d => d.price_reduced ? 'Yes' : 'No')}
            />
            <ComparisonRow
              label="Status"
              values={deals.map(d => d.status)}
            />
            <ComparisonRow
              label="Source"
              values={deals.map(d => d.source)}
            />
          </tbody>
        </table>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex gap-3">
        <Link
          href="/deals"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Back to Deals
        </Link>
        {deals.length > 0 && (
          <Link
            href={`/deals/${deals[0].id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Best Deal
          </Link>
        )}
      </div>
    </div>
  );
}
