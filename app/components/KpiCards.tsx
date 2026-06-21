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

    const medianCompPricePerSqft =
        listings.length === 0
            ? 0
            : Math.round(
                listings.reduce(
                    (sum, listing) => sum + listing.analytics.compMedianPricePerSqft,
                    0,
                ) / listings.length,
            );

    return (
        <section className="mt-10 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">Listings analyzed</p>
                <p className="mt-2 text-3xl font-bold">{totalListings}</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">Potential opportunities</p>
                <p className="mt-2 text-3xl font-bold">{potentialOpportunities}</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">Above range</p>
                <p className="mt-2 text-3xl font-bold">{aboveRange}</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">Avg comp median</p>
                <p className="mt-2 text-3xl font-bold">
                    {formatCurrency(medianCompPricePerSqft)}/sqft
                </p>
            </div>
        </section>
    );
}