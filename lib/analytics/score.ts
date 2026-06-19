import type { EnrichedListing, Listing, MarketPosition } from "@/lib/types";
import { calculatePricePerSquareFoot } from "@/lib/analytics/price";
import { median } from "@/lib/analytics/stats";

function classifyMarketPosition(priceDeltaPct: number): MarketPosition {
    if (priceDeltaPct <= -15) {
        return "potential_opportunity";
    }

    if (priceDeltaPct >= 15) {
        return "above_range";
    }

    return "within_range";
}

function explainMarketPosition(
    listing: Listing,
    pricePerSqft: number,
    datasetMedianPricePerSqft: number,
    priceDeltaPct: number,
    marketPosition: MarketPosition,
): string {
    const absDelta = Math.abs(priceDeltaPct).toFixed(1);

    if (marketPosition === "potential_opportunity") {
        return `${listing.address} is priced at $${pricePerSqft}/sqft, about ${absDelta}% below the current dataset median of $${datasetMedianPricePerSqft}/sqft. This is a potential price-positioning signal, not a recommendation.`;
    }

    if (marketPosition === "above_range") {
        return `${listing.address} is priced at $${pricePerSqft}/sqft, about ${absDelta}% above the current dataset median of $${datasetMedianPricePerSqft}/sqft. This may require stronger justification from location, condition, or features.`;
    }

    return `${listing.address} is priced at $${pricePerSqft}/sqft, close to the current dataset median of $${datasetMedianPricePerSqft}/sqft.`;
}

export function enrichListings(listings: Listing[]): EnrichedListing[] {
    if (listings.length === 0) {
        return [];
    }

    const pricesPerSqft = listings.map((listing) =>
        calculatePricePerSquareFoot(listing),
    );

    const datasetMedianPricePerSqft = Math.round(median(pricesPerSqft));

    return listings.map((listing) => {
        const pricePerSqft = calculatePricePerSquareFoot(listing);
        const priceDeltaPct =
            ((pricePerSqft - datasetMedianPricePerSqft) /
                datasetMedianPricePerSqft) *
            100;

        const marketPosition = classifyMarketPosition(priceDeltaPct);

        return {
            ...listing,
            analytics: {
                pricePerSqft,
                datasetMedianPricePerSqft,
                priceDeltaPct,
                marketPosition,
                explanation: explainMarketPosition(
                    listing,
                    pricePerSqft,
                    datasetMedianPricePerSqft,
                    priceDeltaPct,
                    marketPosition,
                ),
            },
        };
    });
}