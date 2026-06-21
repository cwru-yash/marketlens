"use client";

import "leaflet/dist/leaflet.css";

import type { EnrichedListing } from "@/lib/types";
import { Icon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

type ListingMapProps = {
    listings: EnrichedListing[];
};

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

function createMarkerIcon(marketPosition: string) {
    const color = getMarkerColor(marketPosition);

    return new Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    });
}

export function ListingMap({ listings }: ListingMapProps) {
    const center: [number, number] = [41.4993, -81.6944];

    return (
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800">
            <MapContainer
                center={center}
                zoom={12}
                scrollWheelZoom={false}
                className="h-[520px] w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {listings.map((listing) => (
                    <Marker
                        key={listing.id}
                        position={[listing.latitude, listing.longitude]}
                        icon={createMarkerIcon(listing.analytics.marketPosition)}
                    >
                        <Popup>
                            <div>
                                <p className="font-semibold">{listing.address}</p>
                                <p>{listing.neighbourhood}</p>
                                <p>${listing.listPrice.toLocaleString()}</p>
                                <p>${listing.analytics.pricePerSqft}/sqft</p>
                                <p>{listing.analytics.marketPosition.replaceAll("_", " ")}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}