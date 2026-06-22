import { NextResponse } from "next/server";
import {
    getComparableListings,
    getFallbackComparableListings,
} from "@/lib/analytics/comps";
import { enrichListings } from "@/lib/analytics/score";
import { demo_listings } from "@/lib/data/demo-listings";

const MIN_COMP_COUNT = 2;

export async function GET(
    _request: Request,
    context: { params: Promise<{ id: string }> },
) {
    const { id } = await context.params;

    const rawListing = demo_listings.find((listing) => listing.id === id);

    if (!rawListing) {
        return NextResponse.json(
            {
                error: "Listing not found",
            },
            { status: 404 },
        );
    }

    const enrichedListings = enrichListings(demo_listings);
    const enrichedListing = enrichedListings.find((listing) => listing.id === id);

    const strictComps = getComparableListings(rawListing, demo_listings);

    const comparableListings =
        strictComps.length >= MIN_COMP_COUNT
            ? strictComps
            : getFallbackComparableListings(rawListing, demo_listings);

    const comparableIds = new Set(comparableListings.map((listing) => listing.id));

    const enrichedComparables = enrichedListings.filter((listing) =>
        comparableIds.has(listing.id),
    );

    return NextResponse.json({
        listing: enrichedListing,
        comparables: enrichedComparables,
        methodology: {
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