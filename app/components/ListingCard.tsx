import type { EnrichedListing } from "@/lib/types";

type ListingCardProps = {
    listing: EnrichedListing;
};

function formatMarketPosition(value: string): string {
    return value.replaceAll("_", " ");
}

export function ListingCard({ listing }: ListingCardProps) {
    return (
        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-cyan-400">
                        {listing.neighbourhood}
                    </p>

                    <h2 className="mt-1 text-xl font-semibold">{listing.address}</h2>

                    <p className="mt-2 text-sm text-slate-400">
                        {listing.beds} beds · {listing.baths} baths ·{" "}
                        {listing.sqft.toLocaleString()} sqft · {listing.daysOnMarket} days
                        on market
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
                <p className="text-sm font-medium capitalize text-slate-300">
                    {formatMarketPosition(listing.analytics.marketPosition)}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                    {listing.analytics.explanation}
                </p>
            </div>
        </article>
    );
}