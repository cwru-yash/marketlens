import type { EnrichedListing, Listing, MarketPosition } from "@/lib/types";
import { getComparableListings, getFallbackComparableListings } from "@/lib/analytics/comps";
import { calculatePricePerSquareFoot } from "@/lib/analytics/price";
import { median } from "@/lib/analytics/stats";

const MIN_COMP_COUNT = 2;

function classifyMarketPosition(
    priceDeltaPct: number,
    lowConfidence: boolean,
): MarketPosition {
    if (lowConfidence) {
        return "low_confidence";
    }

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
    compMedianPricePerSqft: number,
    priceDeltaPct: number,
    marketPosition: MarketPosition,
    compCount: number,
): string {
    const absDelta = Math.abs(priceDeltaPct).toFixed(1);

    if (marketPosition === "low_confidence") {
        return `${listing.address} has only ${compCount} usable comparable listings in this demo dataset, so MarketLens does not assign a strong market-position signal yet.`;
    }

    if (marketPosition === "potential_opportunity") {
        return `${listing.address} is priced at $${pricePerSqft}/sqft, about ${absDelta}% below the comparable median of $${compMedianPricePerSqft}/sqft across ${compCount} similar listings. This is a price-positioning signal for further due diligence, not a recommendation.`;
    }

    if (marketPosition === "above_range") {
        return `${listing.address} is priced at $${pricePerSqft}/sqft, about ${absDelta}% above the comparable median of $${compMedianPricePerSqft}/sqft across ${compCount} similar listings. The price may need stronger justification from condition, location, or property features.`;
    }

    return `${listing.address} is priced at $${pricePerSqft}/sqft, close to the comparable median of $${compMedianPricePerSqft}/sqft across ${compCount} similar listings.`;
}

export function enrichListings(listings: Listing[]): EnrichedListing[] {
    return listings.map((listing) => {
        const strictComps = getComparableListings(listing, listings);
        const fallbackComps =
            strictComps.length >= MIN_COMP_COUNT
                ? strictComps
                : getFallbackComparableListings(listing, listings);

        const lowConfidence = fallbackComps.length < MIN_COMP_COUNT;

        const compPricePerSqftValues =
            fallbackComps.length > 0
                ? fallbackComps.map((comp) => calculatePricePerSquareFoot(comp))
                : listings.map((candidate) => calculatePricePerSquareFoot(candidate));

        const compMedianPricePerSqft = Math.round(median(compPricePerSqftValues));
        const pricePerSqft = calculatePricePerSquareFoot(listing);

        const priceDeltaPct =
            ((pricePerSqft - compMedianPricePerSqft) / compMedianPricePerSqft) * 100;

        const marketPosition = classifyMarketPosition(
            priceDeltaPct,
            lowConfidence,
        );

        return {
            ...listing,
            analytics: {
                pricePerSqft,
                datasetMedianPricePerSqft: compMedianPricePerSqft,
                priceDeltaPct,
                marketPosition,
                explanation: explainMarketPosition(
                    listing,
                    pricePerSqft,
                    compMedianPricePerSqft,
                    priceDeltaPct,
                    marketPosition,
                    fallbackComps.length,
                ),
            },
        };
    });
}