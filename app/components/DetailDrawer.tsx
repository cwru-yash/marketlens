import type { EnrichedListing } from "@/lib/types";

type DetailDrawerProps = {
    listing: EnrichedListing | null;
};

function formatMarketPosition(value: string): string {
    return value.replaceAll("_", " ");
}

function getPositionBadgeClasses(value: string): string {
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

export function DetailDrawer({ listing }: DetailDrawerProps) {
    if (!listing) {
        return (
            <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <p className="text-slate-400">Select a listing to inspect details.</p>
            </aside>
        );
    }

    return (
        <aside className="sticky top-6 h-fit rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/50">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                Listing intelligence
            </p>

            <h2 className="mt-3 text-2xl font-bold">{listing.address}</h2>

            <p className="mt-2 text-slate-400">
                {listing.neighbourhood} · {listing.zipcode}
            </p>

            <div
                className={`mt-5 inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getPositionBadgeClasses(
                    listing.analytics.marketPosition,
                )}`}
            >
                {formatMarketPosition(listing.analytics.marketPosition)}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-950 p-4">
                    <p className="text-xs text-slate-500">List price</p>
                    <p className="mt-1 text-xl font-semibold">
                        ${listing.listPrice.toLocaleString()}
                    </p>
                </div>

                <div className="rounded-xl bg-slate-950 p-4">
                    <p className="text-xs text-slate-500">Price / sqft</p>
                    <p className="mt-1 text-xl font-semibold">
                        ${listing.analytics.pricePerSqft.toLocaleString()}
                    </p>
                </div>

                <div className="rounded-xl bg-slate-950 p-4">
                    <p className="text-xs text-slate-500">Comp median</p>
                    <p className="mt-1 text-xl font-semibold">
                        ${listing.analytics.compMedianPricePerSqft.toLocaleString()}
                    </p>
                </div>

                <div className="rounded-xl bg-slate-950 p-4">
                    <p className="text-xs text-slate-500">Delta</p>
                    <p className="mt-1 text-xl font-semibold">
                        {listing.analytics.priceDeltaPct.toFixed(1)}%
                    </p>
                </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm font-medium text-slate-300">
                    Why this surfaced
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                    {listing.analytics.explanation}
                </p>
            </div>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm font-medium text-slate-300">Property facts</p>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-400">
                    <p>{listing.beds} beds</p>
                    <p>{listing.baths} baths</p>
                    <p>{listing.sqft.toLocaleString()} sqft</p>
                    <p>Built {listing.yearBuilt}</p>
                    <p>{listing.daysOnMarket} days listed</p>
                    <p>{listing.analytics.compCount} comps</p>
                </div>
            </div>

            <div className="mt-6 rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                <p className="text-sm font-medium text-cyan-300">Methodology</p>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                    MarketLens compares this property against similar listings using
                    neighborhood, property type, bedrooms, bathrooms, and square footage
                    when enough comparable listings are available. Signals are for
                    prioritization and due diligence, not investment advice.
                </p>
            </div>
        </aside>
    );
}