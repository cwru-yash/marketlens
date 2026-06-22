"use client";

import { useMemo, useState } from "react";
import { DetailDrawer } from "@/app/components/DetailDrawer";
import { FilterBar } from "@/app/components/FilterBar";
import { KpiCards } from "@/app/components/KpiCards";
import { ListingCard } from "@/app/components/ListingCard";
import { MapSection } from "@/app/components/MapSection";
import type { EnrichedListing, MarketPosition } from "@/lib/types";

type SortOption = "price_asc" | "price_desc" | "opportunity_first";

type DashboardExplorerProps = {
    listings: EnrichedListing[];
};

export function DashboardExplorer({ listings }: DashboardExplorerProps) {
    const [selectedListingId, setSelectedListingId] = useState<string | null>(
        listings[0]?.id ?? null,
    );

    const [marketPositionFilter, setMarketPositionFilter] = useState<
        MarketPosition | "all"
    >("all");

    const [sortOption, setSortOption] = useState<SortOption>("opportunity_first");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredListings = useMemo(() => {
        const normalizedSearchQuery = searchQuery.trim().toLowerCase();

        const searched = listings.filter((listing) => {
            if (normalizedSearchQuery.length === 0) {
                return true;
            }

            const searchableText = [
                listing.address,
                listing.neighbourhood,
                listing.zipcode,
                listing.property_type,
            ]
                .join(" ")
                .toLowerCase();

            return searchableText.includes(normalizedSearchQuery);
        });

        const filtered =
            marketPositionFilter === "all"
                ? searched
                : searched.filter(
                    (listing) =>
                        listing.analytics.marketPosition === marketPositionFilter,
                );

        return [...filtered].sort((a, b) => {
            if (sortOption === "price_asc") {
                return a.listPrice - b.listPrice;
            }

            if (sortOption === "price_desc") {
                return b.listPrice - a.listPrice;
            }

            return a.analytics.priceDeltaPct - b.analytics.priceDeltaPct;
        });
    }, [listings, searchQuery, marketPositionFilter, sortOption]);

    const selectedListing =
        filteredListings.find((listing) => listing.id === selectedListingId) ??
        filteredListings[0] ??
        null;

    return (
        <section className="mt-8">
            <FilterBar
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                marketPositionFilter={marketPositionFilter}
                onMarketPositionFilterChange={setMarketPositionFilter}
                sortOption={sortOption}
                onSortOptionChange={setSortOption}
            />

            <KpiCards listings={filteredListings} />
            <p className="mt-4 text-sm text-slate-400">
                Showing {filteredListings.length} of {listings.length} listings
            </p>

            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
                <div>
                    <MapSection
                        listings={filteredListings}
                        selectedListingId={selectedListing?.id ?? null}
                        onSelectListing={setSelectedListingId}
                    />

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {filteredListings.map((listing) => (
                            <ListingCard
                                key={listing.id}
                                listing={listing}
                                isSelected={listing.id === selectedListing?.id}
                                onSelect={() => setSelectedListingId(listing.id)}
                            />
                        ))}
                    </div>
                </div>

                <DetailDrawer listing={selectedListing} />
            </div>
        </section>
    );
}