'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Deal } from '@/types/deals';
import { formatCurrency } from '@/lib/services/underwriting';
import Link from 'next/link';
import L from 'leaflet';

// Fix Leaflet icon issue in Next.js
const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface DealMapProps {
    deals: Deal[];
}

export default function DealMap({ deals }: DealMapProps) {
    // Default center (Austin, TX) or center of first deal
    const center: [number, number] = deals.length > 0 && deals[0].latitude && deals[0].longitude
        ? [deals[0].latitude, deals[0].longitude]
        : [30.2672, -97.7431];

    return (
        <div className="h-[600px] w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm z-0">
            <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {deals.map((deal) => (
                    deal.latitude && deal.longitude && (
                        <Marker
                            key={deal.id}
                            position={[deal.latitude, deal.longitude]}
                            icon={icon}
                        >
                            <Popup>
                                <div className="p-1">
                                    <h3 className="font-semibold text-sm">{deal.address_line1}</h3>
                                    <p className="text-blue-600 font-bold text-sm">{formatCurrency(deal.list_price)}</p>
                                    <div className="mt-2">
                                        <Link href={`/deals/${deal.id}`} className="text-xs text-blue-500 hover:underline">
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>
        </div>
    );
}
