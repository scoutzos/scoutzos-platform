'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, X, Trophy, TrendingUp, TrendingDown, Plus } from 'lucide-react';
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

// Calculate a simple deal score (lower price per sqft + higher rent = better)
function calculateDealScore(deal: Deal): number {
  let score = 50; // Base score
  const pricePerSqft = getPricePerSqft(deal.list_price, deal.sqft);
  const rent = deal.estimated_rent || deal.zillow_rent_estimate || 0;
  const price = deal.list_price || 0;
  
  // Better price/sqft = higher score
  if (pricePerSqft && pricePerSqft < 150) score += 20;
  else if (pricePerSqft && pricePerSqft < 200) score += 10;
  
  // Better rent-to-price ratio = higher score
  if (price > 0 && rent > 0) {
    const rentRatio = (rent * 12) / price * 100;
    if (rentRatio >= 10) score += 25;
    else if (rentRatio >= 8) score += 15;
    else if (rentRatio >= 6) score += 5;
  }
  
  // Bonus for more beds/baths
  if (deal.beds && deal.beds >= 4) score += 5;
  if (deal.sqft && deal.sqft >= 2000) score += 5;
  
  return Math.min(100, Math.max(0, score));
}

interface ComparisonRowProps {
  label: string;
  values: (string | number | null | undefined)[];
  format?: 'currency' | 'number' | 'text';
  highlight?: 'lowest' | 'highest' | 'none';
  showDiff?: boolean;
}

function ComparisonRow({ label, values, format = 'text', highlight = 'none', showDiff = true }: ComparisonRowProps) {
  // Skip row if all values are empty
  const hasData = values.some(v => v != null && v !== '' && v !== '-');
  if (!hasData) return null;

  const numericValues = values.map(v => typeof v === 'number' ? v : null);
  const validNumbers = numericValues.filter((v): v is number => v !== null);

  let bestIdx: number | null = null;
  if (validNumbers.length > 1 && highlight !== 'none') {
    const targetVal = highlight === 'lowest' ? Math.min(...validNumbers) : Math.max(...validNumbers);
    bestIdx = numericValues.findIndex(v => v === targetVal);
  }

  const formatValue = (val: string | number | null | undefined): string => {
    if (val == null || val === '') return '-';
    if (format === 'currency' && typeof val === 'number') return formatCurrency(val);
    if (format === 'number' && typeof val === 'number') return formatNumber(val);
    return String(val);
  };

  const getDiff = (val: number, idx: number): JSX.Element | null => {
    if (!showDiff || idx === 0 || numericValues[0] === null) return null;
    const firstVal = numericValues[0]!;
    const percentDiff = ((val - firstVal) / firstVal * 100);
    if (Math.abs(percentDiff) < 0.5) return null;
    
    const isPositive = percentDiff > 0;
    const isBetter = (highlight === 'lowest' && !isPositive) || (highlight === 'highest' && isPositive);
    
    return (
      <span className={`text-xs ml-2 ${isBetter ? 'text-emerald-600' : 'text-gray-400'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3 inline mr-0.5" /> : <TrendingDown className="w-3 h-3 inline mr-0.5" />}
        {percentDiff > 0 ? '+' : ''}{percentDiff.toFixed(0)}%
      </span>
    );
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
      <td className="py-3 px-4 text-sm text-gray-600 w-36">{label}</td>
      {values.map((val, idx) => (
        <td key={idx} className="py-3 px-4 text-sm text-center">
          <span className={`${idx === bestIdx ? 'text-emerald-700 font-semibold' : 'text-gray-900'}`}>
            {formatValue(val)}
          </span>
          {typeof val === 'number' && getDiff(val, idx)}
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

  // Find best deal
  const dealScores = deals.map(d => ({ id: d.id, score: calculateDealScore(d) }));
  const bestDealId = dealScores.length > 0 
    ? dealScores.reduce((a, b) => a.score > b.score ? a : b).id 
    : null;

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Link href="/deals" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Deals
        </Link>
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">{error}</p>
          <Link href="/deals" className="text-blue-600 hover:underline">
            Return to deals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/deals" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Deals
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Compare Properties</h1>
        </div>
        <Link
          href="/deals"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add More
        </Link>
      </div>

      {/* Property Cards Header */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `160px repeat(${deals.length}, 1fr)` }}>
        <div></div>
        {deals.map((deal) => {
          const isBest = deal.id === bestDealId;
          const score = dealScores.find(d => d.id === deal.id)?.score || 0;
          
          return (
            <div 
              key={deal.id} 
              className={`relative bg-white rounded-xl border-2 p-4 transition-all ${
                isBest ? 'border-emerald-400 shadow-lg shadow-emerald-100' : 'border-gray-100'
              }`}
            >
              {/* Remove button */}
              <button
                onClick={() => removeDeal(deal.id)}
                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              {/* Best Deal Badge */}
              {isBest && (
                <div className="absolute -top-3 left-4 px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> Best Value
                </div>
              )}
              
              {/* Image */}
              {deal.photos?.[0] && (
                <img
                  src={deal.photos[0]}
                  alt={deal.address_line1}
                  className="w-full h-20 object-cover rounded-lg mb-3"
                />
              )}
              
              {/* Address */}
              <Link href={`/deals/${deal.id}`} className="block group">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm leading-tight">
                  {deal.address_line1}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{deal.city}, {deal.state} {deal.zip}</p>
              </Link>
              
              {/* Price & Score */}
              <div className="flex items-end justify-between mt-3 pt-3 border-t border-gray-100">
                <div>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(deal.list_price)}</p>
                  <p className="text-xs text-gray-500">{deal.beds}bd {deal.baths}ba · {formatNumber(deal.sqft)} sqft</p>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${score >= 70 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-gray-400'}`}>
                    {score}
                  </div>
                  <p className="text-xs text-gray-400">Score</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <tbody>
            {/* Pricing Section */}
            <tr className="bg-gray-50">
              <td colSpan={deals.length + 1} className="py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
            <tr className="bg-gray-50">
              <td colSpan={deals.length + 1} className="py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Property Details
              </td>
            </tr>
            <ComparisonRow
              label="Type"
              values={deals.map(d => d.property_type)}
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

            {/* Market Section */}
            <tr className="bg-gray-50">
              <td colSpan={deals.length + 1} className="py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Market
              </td>
            </tr>
            <ComparisonRow
              label="Days on Market"
              values={deals.map(d => d.days_on_market)}
              format="number"
              highlight="lowest"
            />
            <ComparisonRow
              label="Status"
              values={deals.map(d => d.status?.replace('_', ' '))}
            />
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Link
          href="/deals"
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Back to Deals
        </Link>
        {bestDealId && (
          <Link
            href={`/deals/${bestDealId}`}
            className="px-4 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            View Best Deal
          </Link>
        )}
      </div>
    </div>
  );
}
