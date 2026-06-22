import type { KeyboardEvent } from "react";
import type { EnrichedListing } from "@/lib/types";

type ListingCardProps = {
    listing: EnrichedListing;
    isSelected?: boolean;
    onSelect?: () => void;
};

function formatMarketPosition(value: string): string {
    return value.replaceAll("_", " ");
}

function getBadgeClasses(value: string): string {
    if (value === "potential_opportunity") {
        return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
    }

    if (value === "above_range") {
        return "border-rose-400/30 bg-rose-400/10 text-rose-300";
    }

    if (value === "low_confidence") {
        return "border-amber-400/30 bg-amber-400/10 text-amber-300";
    }

    return "border-cyan-400/30 bg-cyan-400/10 text-cyan-300";
}

export function ListingCard({
    listing,
    isSelected = false,
    onSelect,
}: ListingCardProps) {
    const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (!onSelect) {
            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect();
        }
    };

    return (
        <article
            onClick={onSelect}
            onKeyDown={handleKeyDown}
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            className={`rounded-xl border bg-slate-900/95 p-4 shadow-lg shadow-slate-950/25 outline-none transition ${onSelect ? "cursor-pointer" : ""
                } ${isSelected
                    ? "border-cyan-400 ring-2 ring-cyan-400/25 shadow-cyan-950/30"
                    : "border-slate-800 hover:border-slate-600 hover:bg-slate-900 focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400/25"
                }`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-slate-100">
                        {listing.address}
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        {listing.neighbourhood} · {listing.zipcode}
                    </p>
                </div>

                <div className="shrink-0 text-right">
                    <p className="text-lg font-bold text-slate-50">
                        ${listing.listPrice.toLocaleString()}
                    </p>

                    <p className="text-xs text-slate-400">
                        ${listing.analytics.pricePerSqft.toLocaleString()}/sqft
                    </p>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getBadgeClasses(
                        listing.analytics.marketPosition,
                    )}`}
                >
                    {formatMarketPosition(listing.analytics.marketPosition)}
                </span>

                <span className="text-xs text-slate-400">
                    {listing.beds} bd
                </span>
                <span className="text-xs text-slate-600">/</span>
                <span className="text-xs text-slate-400">
                    {listing.baths} ba
                </span>
                <span className="text-xs text-slate-600">/</span>
                <span className="text-xs text-slate-400">
                    {listing.sqft.toLocaleString()} sqft
                </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-slate-800 bg-slate-950/80 p-3">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        Median
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-200">
                        ${listing.analytics.compMedianPricePerSqft.toLocaleString()}
                    </p>
                </div>

                <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        Comps
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-200">
                        {listing.analytics.compCount}
                    </p>
                </div>

                <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        Delta
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-200">
                        {listing.analytics.priceDeltaPct.toFixed(1)}%
                    </p>
                </div>
            </div>
        </article>
    );
}
