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

type AiSearchHardFilters = {
    maxPrice: number | null;
    minBeds: number | null;
    minBaths: number | null;
    propertyTypes: string[];
    neighbourhoods: string[];
    zipcodes: string[];
    excludeLowConfidence: boolean;
};

type AiSearchMatch = {
    listing: EnrichedListing;
    matchScore: number;
    reason: string;
};

type AiSearchResult = {
    interpretedRequest: string;
    hardFilters: AiSearchHardFilters;
    softPreferences: string[];
    matches: AiSearchMatch[];
    clarifyingQuestion: string | null;
    source: "gemini" | "fallback";
};

type AiMatchState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "ready"; result: AiSearchResult }
    | { status: "error"; message: string };

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
    const [aiMatchState, setAiMatchState] = useState<AiMatchState>({
        status: "idle",
    });

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

    const manuallyFilteredListings = useMemo(() => {
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

    const displayedListings = useMemo(() => {
        if (aiMatchState.status !== "ready") {
            return manuallyFilteredListings;
        }

        return aiMatchState.result.matches.map((match) => match.listing);
    }, [aiMatchState, manuallyFilteredListings]);

    const selectedListing =
        displayedListings.find((listing) => listing.id === selectedListingId) ?? null;

    const detailListing = selectedListing ?? displayedListings[0] ?? null;

    useEffect(() => {
        if (!hasMountedFilterState.current) {
            hasMountedFilterState.current = true;
            return;
        }

        setSelectedListingId(null);
    }, [searchQuery, marketPositionFilter]);

    async function handleAiMatch() {
        const query = searchQuery.trim();

        if (query.length === 0) {
            return;
        }

        setAiMatchState({ status: "loading" });

        try {
            const response = await fetch("/api/ai/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query }),
            });

            if (!response.ok) {
                const errorBody = (await response.json().catch(() => null)) as {
                    error?: string;
                } | null;
                throw new Error(errorBody?.error ?? "Unable to run AI match.");
            }

            const result = (await response.json()) as AiSearchResult;
            setAiMatchState({ status: "ready", result });
            setSelectedListingId(result.matches[0]?.listing.id ?? null);
        } catch (error) {
            setAiMatchState({
                status: "error",
                message:
                    error instanceof Error ? error.message : "Unable to run AI match.",
            });
        }
    }

    function handleClearAiMatch() {
        setAiMatchState({ status: "idle" });
        setSelectedListingId(manuallyFilteredListings[0]?.id ?? null);
    }

    return (
        <section className="mt-8">
            <FilterBar
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                searchSuggestions={searchSuggestions}
                onSearchSuggestionSelect={setSearchQuery}
                onAiMatch={handleAiMatch}
                isAiMatchLoading={aiMatchState.status === "loading"}
                isAiMatchActive={aiMatchState.status === "ready"}
                marketPositionFilter={marketPositionFilter}
                onMarketPositionFilterChange={setMarketPositionFilter}
                sortOption={sortOption}
                onSortOptionChange={setSortOption}
            />

            <KpiCards listings={displayedListings} />

            <p className="mt-4 text-sm text-slate-400">
                Showing {displayedListings.length} of {listings.length} listings
            </p>

            {aiMatchState.status === "error" ? (
                <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">
                    {aiMatchState.message}
                </div>
            ) : null}

            {aiMatchState.status === "ready" ? (
                <div className="mt-4 rounded-xl border border-cyan-400/20 bg-slate-900 p-4 shadow-lg shadow-slate-950/30">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-cyan-300">
                                AI match summary
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                {aiMatchState.result.interpretedRequest}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                                Source: {aiMatchState.result.source} ·{" "}
                                {aiMatchState.result.matches.length} matches
                            </p>
                            {aiMatchState.result.clarifyingQuestion ? (
                                <p className="mt-2 text-xs text-amber-200">
                                    {aiMatchState.result.clarifyingQuestion}
                                </p>
                            ) : null}
                        </div>

                        <button
                            type="button"
                            onClick={handleClearAiMatch}
                            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
                        >
                            Clear AI match
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.15fr)]">
                <div className="min-w-0 space-y-4">
                    {displayedListings.length === 0 ? (
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
                        displayedListings.map((listing) => {
                            const aiMatch =
                                aiMatchState.status === "ready"
                                    ? aiMatchState.result.matches.find(
                                        (match) => match.listing.id === listing.id,
                                    )
                                    : null;

                            return (
                                <div key={listing.id} className="space-y-2">
                                    <ListingCard
                                        listing={listing}
                                        isSelected={listing.id === selectedListingId}
                                        onSelect={() => setSelectedListingId(listing.id)}
                                    />

                                    {aiMatch ? (
                                        <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs leading-5 text-cyan-100">
                                            <span className="font-semibold">
                                                {aiMatch.matchScore}/100 match:
                                            </span>{" "}
                                            {aiMatch.reason}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="min-w-0">
                    <div className="space-y-6 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-2">
                        <MapSection
                            listings={displayedListings}
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
