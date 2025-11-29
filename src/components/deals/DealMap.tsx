'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { Deal } from '@/types/deals';
import { formatCurrency } from '@/lib/services/underwriting';
import Link from 'next/link';
import L from 'leaflet';

// Custom marker colors by deal status
const getMarkerIcon = (status: string) => {
    const colors = {
        new: '#3B82F6',           // blue
        analyzing: '#F59E0B',     // yellow
        saved: '#10B981',         // green
        offered: '#8B5CF6',       // purple
        under_contract: '#EC4899', // pink
        closed: '#059669',        // dark green
        passed: '#6B7280',        // gray
        dead: '#DC2626'           // red
    };

    const color = colors[status as keyof typeof colors] || colors.new;

    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });
};

// Map controls component
function MapControls({ deals }: { deals: Deal[] }) {
    const map = useMap();

    const fitBounds = () => {
        const bounds = deals
            .filter(d => d.latitude && d.longitude)
            .map(d => [d.latitude!, d.longitude!] as [number, number]);

        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    };

    return (
        <button
            onClick={fitBounds}
            className="absolute top-4 right-4 z-[1000] bg-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow font-semibold text-sm border border-gray-200 hover:bg-gray-50"
        >
            Fit All Deals
        </button>
    );
}

interface DealMapProps {
    deals: Deal[];
}

export default function DealMap({ deals }: DealMapProps) {
    // Default center (Austin, TX) or center of first deal
    const center: [number, number] = deals.length > 0 && deals[0].latitude && deals[0].longitude
        ? [deals[0].latitude, deals[0].longitude]
        : [30.2672, -97.7431];

    return (
        <div className="h-[600px] w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm relative">
            <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapControls deals={deals} />
                <MarkerClusterGroup
                    chunkedLoading
                    maxClusterRadius={50}
                    spiderfyOnMaxZoom={true}
                    showCoverageOnHover={false}
                >
                    {deals.map((deal) => (
                        deal.latitude && deal.longitude && (
                            <Marker
                                key={deal.id}
                                position={[deal.latitude, deal.longitude]}
                                icon={getMarkerIcon(deal.status)}
                            >
                                <Popup>
                                    <div className="p-1 min-w-[200px]">
                                        {deal.photos && deal.photos.length > 0 && (
                                            <img
                                                src={deal.photos[0]}
                                                alt={deal.address_line1}
                                                className="w-full h-24 object-cover rounded mb-2"
                                            />
                                        )}
                                        <h3 className="font-semibold text-sm">{deal.address_line1}</h3>
                                        <p className="text-blue-600 font-bold text-sm">{formatCurrency(deal.list_price)}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${deal.status === 'new' ? 'bg-blue-100 text-blue-700' :
                                                    deal.status === 'analyzing' ? 'bg-yellow-100 text-yellow-700' :
                                                        deal.status === 'saved' ? 'bg-green-100 text-green-700' :
                                                            deal.status === 'offered' ? 'bg-purple-100 text-purple-700' :
                                                                deal.status === 'under_contract' ? 'bg-pink-100 text-pink-700' :
                                                                    deal.status === 'closed' ? 'bg-emerald-100 text-emerald-700' :
                                                                        deal.status === 'passed' ? 'bg-gray-100 text-gray-700' :
                                                                            deal.status === 'dead' ? 'bg-red-100 text-red-700' :
                                                                                'bg-gray-100 text-gray-700'
                                                }`}>
                                                {deal.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            <Link href={`/deals/${deal.id}`} className="text-xs text-blue-500 hover:underline font-medium">
                                                View Details →
                                            </Link>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    ))}
                </MarkerClusterGroup>
            </MapContainer>
        </div>
    );
}
