import { NextResponse } from "next/server";
import {
    getComparableListings,
    getFallbackComparableListings,
} from "@/lib/analytics/comps";
import { enrichListings } from "@/lib/analytics/score";
import { getListings } from "@/lib/data/listing-provider";

const MIN_COMP_COUNT = 2;

export async function GET(
    _request: Request,
    context: { params: Promise<{ id: string }> },
) {
    const { id } = await context.params;

    const listings = await getListings();
    const rawListing = listings.find((listing) => listing.id === id);

    if (!rawListing) {
        return NextResponse.json(
            {
                error: "Listing not found",
            },
            { status: 404 },
        );
    }

    const enrichedListings = enrichListings(listings);
    const enrichedListing = enrichedListings.find((listing) => listing.id === id);

    const strictComps = getComparableListings(rawListing, listings);

    const comparableListings =
        strictComps.length >= MIN_COMP_COUNT
            ? strictComps
            : getFallbackComparableListings(rawListing, listings);

    const comparableIds = new Set(comparableListings.map((listing) => listing.id));

    const enrichedComparables = enrichedListings.filter((listing) =>
        comparableIds.has(listing.id),
    );

    return NextResponse.json({
        listing: enrichedListing,
        comparables: enrichedComparables,
        methodology: {
            comparableStrategy:
                strictComps.length >= MIN_COMP_COUNT ? "strict" : "fallback",
            strictComparableCount: strictComps.length,
            returnedComparableCount: enrichedComparables.length,
            primaryRules: [
                "same neighbourhood",
                "same property type",
                "bedrooms within ±1",
                "bathrooms within ±1",
                "square footage within ±20%",
            ],
            fallbackRules: ["same property type", "bedrooms within ±1"],
            minimumComparableCount: MIN_COMP_COUNT,
            disclaimer:
                "MarketLens signals are for prioritization and due diligence, not investment advice or an appraisal.",
        },
    });
}