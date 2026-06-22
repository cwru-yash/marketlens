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
    return (
        <article
            onClick={onSelect}
            className={`cursor-pointer rounded-2xl border bg-slate-900 p-5 shadow-lg shadow-slate-950/30 transition ${isSelected
                    ? "border-cyan-400 ring-2 ring-cyan-400/20"
                    : "border-slate-800 hover:border-slate-600"
                }`}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getBadgeClasses(
                            listing.analytics.marketPosition,
                        )}`}
                    >
                        {formatMarketPosition(listing.analytics.marketPosition)}
                    </div>

                    <h2 className="mt-3 text-xl font-semibold">{listing.address}</h2>

                    <p className="mt-2 text-sm text-slate-400">
                        {listing.neighbourhood} · {listing.beds} beds · {listing.baths}{" "}
                        baths · {listing.sqft.toLocaleString()} sqft
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-xl font-bold">
                        ${listing.listPrice.toLocaleString()}
                    </p>

                    <p className="text-sm text-slate-400">
                        ${listing.analytics.pricePerSqft.toLocaleString()}/sqft
                    </p>
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Comparable signal
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                    Comp median: $
                    {listing.analytics.compMedianPricePerSqft.toLocaleString()}/sqft ·{" "}
                    {listing.analytics.compCount} comps · Delta{" "}
                    {listing.analytics.priceDeltaPct.toFixed(1)}%
                </p>
            </div>
        </article>
    );
}