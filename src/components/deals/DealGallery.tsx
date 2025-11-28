'use client';

import { useState } from 'react';
import Image from 'next/image';

interface DealGalleryProps {
    photos: string[];
    address: string;
}

export default function DealGallery({ photos, address }: DealGalleryProps) {
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(photos.length > 0 ? photos[0] : null);

    if (!photos || photos.length === 0) {
        return (
            <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                <p className="text-gray-500">No photos available</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Main Photo */}
            <div className="relative h-96 w-full overflow-hidden rounded-lg bg-gray-100">
                {selectedPhoto ? (
                    <img
                        src={selectedPhoto}
                        alt={`Main photo of ${address}`}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-gray-500">Select a photo</p>
                    </div>
                )}
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 lg:grid-cols-8">
                {photos.map((photo, index) => (
                    <button
                        key={index}
                        onClick={() => setSelectedPhoto(photo)}
                        className={`relative aspect-square overflow-hidden rounded-lg bg-gray-100 ${selectedPhoto === photo ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                            }`}
                    >
                        <img
                            src={photo}
                            alt={`Thumbnail ${index + 1}`}
                            className="h-full w-full object-cover"
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}
