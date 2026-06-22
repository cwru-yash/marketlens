"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

    const [searchQuery, setSearchQuery] = useState("");
    const hasMountedFilterState = useRef(false);

    const [marketPositionFilter, setMarketPositionFilter] = useState<
        MarketPosition | "all"
    >("all");

    const [sortOption, setSortOption] = useState<SortOption>("opportunity_first");

    const searchSuggestions = useMemo(() => {
        const normalizedSearchQuery = searchQuery.trim().toLowerCase();

        if (normalizedSearchQuery.length === 0) {
            return [];
        }

        const suggestionCandidates = listings.flatMap((listing) => [
            listing.neighbourhood,
            listing.zipcode,
            listing.address,
            listing.property_type,
        ]);

        const uniqueMatches: string[] = [];
        const seenSuggestions = new Set<string>();

        for (const candidate of suggestionCandidates) {
            const normalizedCandidate = candidate.toLowerCase();

            if (
                normalizedCandidate.includes(normalizedSearchQuery) &&
                !seenSuggestions.has(normalizedCandidate)
            ) {
                uniqueMatches.push(candidate);
                seenSuggestions.add(normalizedCandidate);
            }

            if (uniqueMatches.length === 6) {
                break;
            }
        }

        return uniqueMatches;
    }, [listings, searchQuery]);

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
        filteredListings.find((listing) => listing.id === selectedListingId) ?? null;

    const detailListing = selectedListing ?? filteredListings[0] ?? null;

    useEffect(() => {
        if (!hasMountedFilterState.current) {
            hasMountedFilterState.current = true;
            return;
        }

        setSelectedListingId(null);
    }, [searchQuery, marketPositionFilter]);

    return (
        <section className="mt-8">
            <FilterBar
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                searchSuggestions={searchSuggestions}
                onSearchSuggestionSelect={setSearchQuery}
                marketPositionFilter={marketPositionFilter}
                onMarketPositionFilterChange={setMarketPositionFilter}
                sortOption={sortOption}
                onSortOptionChange={setSortOption}
            />

            <KpiCards listings={filteredListings} />

            <p className="mt-4 text-sm text-slate-400">
                Showing {filteredListings.length} of {listings.length} listings
            </p>

            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]">
                <div className="min-w-0 space-y-4">
                    {filteredListings.length === 0 ? (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
                            <p className="text-lg font-semibold text-slate-200">
                                No listings match your search.
                            </p>
                            <p className="mt-2 text-sm text-slate-400">
                                Try a different neighbourhood, ZIP code, property type, or
                                market-position filter.
                            </p>
                        </div>
                    ) : (
                        filteredListings.map((listing) => (
                            <ListingCard
                                key={listing.id}
                                listing={listing}
                                isSelected={listing.id === selectedListingId}
                                onSelect={() => setSelectedListingId(listing.id)}
                            />
                        ))
                    )}
                </div>

                <div className="min-w-0">
                    <div className="sticky top-6 space-y-6">
                        <MapSection
                            listings={filteredListings}
                            selectedListingId={selectedListing?.id ?? null}
                            onSelectListing={setSelectedListingId}
                        />

                        <DetailDrawer listing={detailListing} />
                    </div>
                </div>
            </div>
        </section>
    );
}
