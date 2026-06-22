import type { EnrichedListing } from "@/lib/types";

type KpiCardsProps = {
    listings: EnrichedListing[];
};

function formatCurrency(value: number): string {
    return `$${value.toLocaleString()}`;
}

export function KpiCards({ listings }: KpiCardsProps) {
    const totalListings = listings.length;

    const potentialOpportunities = listings.filter(
        (listing) => listing.analytics.marketPosition === "potential_opportunity",
    ).length;

    const aboveRange = listings.filter(
        (listing) => listing.analytics.marketPosition === "above_range",
    ).length;

    const lowConfidence = listings.filter(
        (listing) => listing.analytics.marketPosition === "low_confidence",
    ).length;

    const avgCompMedianPricePerSqft =
        listings.length === 0
            ? 0
            : Math.round(
                listings.reduce(
                    (sum, listing) => sum + listing.analytics.compMedianPricePerSqft,
                    0,
                ) / listings.length,
            );

    return (
        <section className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/30">
                <p className="text-sm text-slate-400">Listings analyzed</p>
                <p className="mt-2 text-3xl font-bold">{totalListings}</p>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 shadow-lg shadow-slate-950/30">
                <p className="text-sm text-emerald-300">Potential opportunities</p>
                <p className="mt-2 text-3xl font-bold">{potentialOpportunities}</p>
            </div>

            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-5 shadow-lg shadow-slate-950/30">
                <p className="text-sm text-rose-300">Above range</p>
                <p className="mt-2 text-3xl font-bold">{aboveRange}</p>
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5 shadow-lg shadow-slate-950/30">
                <p className="text-sm text-amber-300">Low confidence</p>
                <p className="mt-2 text-3xl font-bold">{lowConfidence}</p>
                <p className="mt-1 text-xs text-slate-400">
                    Avg comp median: {formatCurrency(avgCompMedianPricePerSqft)}/sqft
                </p>
            </div>
        </section>
    );
}