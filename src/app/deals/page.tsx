'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Deal, DealStatus } from '@/types/deals';
import { formatCurrency } from '@/lib/services/underwriting';
import { MoreVertical, Search, FileText, ArrowRight, Download, ChevronLeft, ChevronRight } from 'lucide-react';

const DealMap = dynamic(() => import('@/components/deals/DealMap'), { ssr: false });

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface QuickActionMenuProps {
    deal: Deal;
    onStatusChange: (dealId: string, status: DealStatus) => void;
    onActionComplete: (message: string) => void;
}

function QuickActionMenu({ deal, onStatusChange, onActionComplete }: QuickActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showStatusSubmenu, setShowStatusSubmenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowStatusSubmenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAnalyze = async () => {
        setIsOpen(false);
        try {
            const res = await fetch(`/api/deals/${deal.id}/analyze`, { method: 'POST' });
            if (res.ok) {
                onActionComplete('Analysis complete');
            } else {
                onActionComplete('Analysis failed');
            }
        } catch {
            onActionComplete('Analysis failed');
        }
    };

    const handleFindMatches = async () => {
        setIsOpen(false);
        try {
            const res = await fetch(`/api/deals/${deal.id}/find-matches`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                onActionComplete(`${data.matches} matches found`);
            } else {
                onActionComplete('Match search failed');
            }
        } catch {
            onActionComplete('Match search failed');
        }
    };

    const handleExportPDF = async () => {
        setIsOpen(false);
        try {
            const res = await fetch(`/api/deals/${deal.id}/export-pdf`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `deal-${deal.address_line1.replace(/\s+/g, '-')}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
                onActionComplete('PDF downloaded');
            } else {
                onActionComplete('PDF export failed');
            }
        } catch {
            onActionComplete('PDF export failed');
        }
    };

    const handleChangeStatus = async (status: DealStatus) => {
        setIsOpen(false);
        setShowStatusSubmenu(false);
        try {
            const res = await fetch(`/api/deals/${deal.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                onStatusChange(deal.id, status);
                onActionComplete(`Status changed to ${status}`);
            } else {
                onActionComplete('Status change failed');
            }
        } catch {
            onActionComplete('Status change failed');
        }
    };

    const statuses: DealStatus[] = ['new', 'saved', 'offered', 'under_contract', 'closed', 'passed'];

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                        onClick={(e) => { e.preventDefault(); handleAnalyze(); }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Search className="w-4 h-4" />
                        Analyze
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); handleFindMatches(); }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                        <ArrowRight className="w-4 h-4" />
                        Find Matches
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); handleExportPDF(); }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export PDF
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <div
                        className="relative"
                        onMouseEnter={() => setShowStatusSubmenu(true)}
                        onMouseLeave={() => setShowStatusSubmenu(false)}
                    >
                        <button
                            onClick={(e) => { e.preventDefault(); setShowStatusSubmenu(!showStatusSubmenu); }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                        >
                            <span className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Change Status
                            </span>
                            <span className="text-gray-400">▸</span>
                        </button>
                        {showStatusSubmenu && (
                            <div className="absolute left-full top-0 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 ml-1">
                                {statuses.map((status) => (
                                    <button
                                        key={status}
                                        onClick={(e) => { e.preventDefault(); handleChangeStatus(status); }}
                                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 capitalize ${deal.status === status ? 'text-brand-primary font-medium' : 'text-gray-700'
                                            }`}
                                    >
                                        {status.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DealsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [toast, setToast] = useState<string | null>(null);
    const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const fetchDeals = useCallback(async (page: number, limit: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/deals?page=${page}&limit=${limit}`);
            const data = await res.json();
            setDeals(data.deals || []);
            if (data.pagination) {
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch deals:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        setItemsPerPage(limit);
        fetchDeals(page, limit);
    }, [searchParams, fetchDeals]);

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        params.set('limit', itemsPerPage.toString());
        router.push(`/deals?${params.toString()}`);
    };

    const handleItemsPerPageChange = (newLimit: number) => {
        setItemsPerPage(newLimit);
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', '1'); // Reset to first page
        params.set('limit', newLimit.toString());
        router.push(`/deals?${params.toString()}`);
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const { page, totalPages } = pagination;

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push('...');
            for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                pages.push(i);
            }
            if (page < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleStatusChange = (dealId: string, status: DealStatus) => {
        setDeals(deals.map(d => d.id === dealId ? { ...d, status } : d));
    };

    const toggleDealSelection = (dealId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const newSelected = new Set(selectedDeals);
        if (newSelected.has(dealId)) {
            newSelected.delete(dealId);
        } else if (newSelected.size < 3) {
            newSelected.add(dealId);
        }
        setSelectedDeals(newSelected);
    };

    const handleCompare = () => {
        if (selectedDeals.size >= 2) {
            router.push(`/deals/compare?ids=${Array.from(selectedDeals).join(',')}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Toast notification */}
                {toast && (
                    <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-slide-in">
                        {toast}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Deals</h1>
                        {selectedDeals.size >= 2 && (
                            <button
                                onClick={handleCompare}
                                className="bg-brand-ai text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-ai-strong transition-colors"
                            >
                                Compare ({selectedDeals.size})
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-gray-100 p-1 rounded-lg flex">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md ${viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                List
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md ${viewMode === 'map' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Map
                            </button>
                        </div>
                        <Link
                            href="/deals/swipe"
                            className="flex items-center gap-2 rounded-lg bg-brand-primary-soft px-3.5 py-2.5 text-sm font-semibold text-brand-primary hover:bg-brand-primary hover:text-white transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                            Swipe
                        </Link>
                        <Link
                            href="/deals/import"
                            className="rounded-lg bg-brand-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-primary-hover transition-colors"
                        >
                            Import Deals
                        </Link>
                    </div>
                </div>

                {deals.length === 0 && viewMode === 'list' ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No deals yet</h3>
                        <p className="text-gray-500 mb-6">Get started by importing deals or connecting to a data source</p>
                        <Link
                            href="/deals/import"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-lg font-semibold hover:bg-brand-primary-hover transition-colors"
                        >
                            Import Your First Deal
                        </Link>
                    </div>
                ) : viewMode === 'map' ? (
                    <DealMap deals={deals} />
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {deals.map((deal) => (
                                <div key={deal.id} className="relative group">
                                    {/* Selection checkbox */}
                                    <div
                                        onClick={(e) => toggleDealSelection(deal.id, e)}
                                        className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md border-2 cursor-pointer transition-all ${selectedDeals.has(deal.id)
                                            ? 'bg-brand-primary border-brand-primary'
                                            : 'bg-white/90 border-gray-300 opacity-0 group-hover:opacity-100'
                                            }`}
                                    >
                                        {selectedDeals.has(deal.id) && (
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>

                                    {/* Quick actions menu */}
                                    <div className="absolute top-2 right-12 z-10">
                                        <QuickActionMenu
                                            deal={deal}
                                            onStatusChange={handleStatusChange}
                                            onActionComplete={setToast}
                                        />
                                    </div>

                                    <Link href={`/deals/${deal.id}`} className="block">
                                        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                                            <div className="h-48 bg-gray-200 relative">
                                                {deal.photos && deal.photos.length > 0 ? (
                                                    <img src={deal.photos[0]} alt={deal.address_line1} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-gray-400">
                                                        No Image
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${deal.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                                        deal.status === 'analyzing' ? 'bg-yellow-100 text-yellow-800' :
                                                            deal.status === 'saved' ? 'bg-green-100 text-green-800' :
                                                                deal.status === 'offered' ? 'bg-purple-100 text-purple-800' :
                                                                    deal.status === 'under_contract' ? 'bg-orange-100 text-orange-800' :
                                                                        deal.status === 'closed' ? 'bg-brand-ai-soft text-brand-ai-strong' :
                                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {deal.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="px-4 py-4">
                                                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 truncate">
                                                    {deal.address_line1}
                                                </h3>
                                                <p className="text-sm text-gray-500 truncate">
                                                    {deal.city}, {deal.state} {deal.zip}
                                                </p>
                                                <div className="mt-4 flex justify-between items-center">
                                                    <span className="text-xl font-bold text-gray-900">
                                                        {formatCurrency(deal.list_price)}
                                                    </span>
                                                    <div className="text-sm text-gray-500">
                                                        {deal.beds}bd {deal.baths}ba {deal.sqft?.toLocaleString()}sqft
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>

                        {/* Pagination UI */}
                        {pagination.totalPages > 0 && (
                            <div className="mt-8 bg-white rounded-lg shadow px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                                        <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                                        <span className="font-medium">{pagination.total}</span> deals
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <label htmlFor="perPage" className="text-sm text-gray-600">Per page:</label>
                                        <select
                                            id="perPage"
                                            value={itemsPerPage}
                                            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                            className="rounded-md border-gray-300 text-sm focus:ring-brand-primary focus:border-brand-primary"
                                        >
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>

                                    {getPageNumbers().map((pageNum, idx) => (
                                        pageNum === '...' ? (
                                            <span key={`ellipsis-${idx}`} className="px-3 py-1 text-gray-500">...</span>
                                        ) : (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum as number)}
                                                className={`px-3 py-1 rounded-md text-sm font-medium ${pagination.page === pageNum
                                                    ? 'bg-brand-primary text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        )
                                    ))}

                                    <button
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page === pagination.totalPages}
                                        className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
