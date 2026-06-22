"use client";

import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import type { EnrichedListing } from "@/lib/types";
import { Icon } from "leaflet";
import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    useMap,
} from "react-leaflet";

type ListingMapProps = {
    listings: EnrichedListing[];
    selectedListingId: string | null;
    onSelectListing: (listingId: string) => void;
};

type MapViewportControllerProps = {
    listings: EnrichedListing[];
    selectedListing: EnrichedListing | null;
};

const DEFAULT_CENTER: [number, number] = [41.4993, -81.6944];

function hasValidCoordinates(listing: EnrichedListing): boolean {
    return Number.isFinite(listing.latitude) && Number.isFinite(listing.longitude);
}

function MapViewportController({
    listings,
    selectedListing,
}: MapViewportControllerProps) {
    const map = useMap();

    useEffect(() => {
        if (selectedListing && hasValidCoordinates(selectedListing)) {
            map.flyTo([selectedListing.latitude, selectedListing.longitude], 15, {
                duration: 0.8,
            });
            return;
        }

        const visiblePositions = listings
            .filter(hasValidCoordinates)
            .map((listing): [number, number] => [
                listing.latitude,
                listing.longitude,
            ]);

        if (visiblePositions.length === 0) {
            map.setView(DEFAULT_CENTER, 12);
            return;
        }

        if (visiblePositions.length === 1) {
            map.flyTo(visiblePositions[0], 15, {
                duration: 0.8,
            });
            return;
        }

        map.fitBounds(visiblePositions, {
            maxZoom: 14,
            padding: [36, 36],
        });
    }, [map, listings, selectedListing]);

    return null;
}

function getMarkerColor(marketPosition: string): string {
    if (marketPosition === "potential_opportunity") {
        return "green";
    }

    if (marketPosition === "above_range") {
        return "red";
    }

    if (marketPosition === "low_confidence") {
        return "orange";
    }

    return "blue";
}

function createMarkerIcon(marketPosition: string, isSelected: boolean) {
    const color = isSelected ? "violet" : getMarkerColor(marketPosition);

    return new Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: isSelected ? [30, 49] : [25, 41],
        iconAnchor: isSelected ? [15, 49] : [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    });
}

export function ListingMap({
    listings,
    selectedListingId,
    onSelectListing,
}: ListingMapProps) {
    const selectedListing =
        listings.find((listing) => listing.id === selectedListingId) ?? null;

    const mappableListings = listings.filter(hasValidCoordinates);

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-800 shadow-2xl shadow-slate-950/50">
            <MapContainer
                center={DEFAULT_CENTER}
                zoom={12}
                scrollWheelZoom={false}
                className="h-[520px] w-full"
            >
                <MapViewportController
                    listings={listings}
                    selectedListing={selectedListing}
                />

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {mappableListings.map((listing) => {
                    const isSelected = listing.id === selectedListingId;

                    return (
                        <Marker
                            key={listing.id}
                            position={[listing.latitude, listing.longitude]}
                            icon={createMarkerIcon(
                                listing.analytics.marketPosition,
                                isSelected,
                            )}
                            eventHandlers={{
                                click: () => onSelectListing(listing.id),
                            }}
                        >
                            <Popup>
                                <div>
                                    <p className="font-semibold">{listing.address}</p>
                                    <p>{listing.neighbourhood}</p>
                                    <p>${listing.listPrice.toLocaleString()}</p>
                                    <p>${listing.analytics.pricePerSqft}/sqft</p>
                                    <p>
                                        {listing.analytics.marketPosition.replaceAll("_", " ")}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
