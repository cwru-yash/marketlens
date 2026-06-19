import { demo_listings } from "@/lib/data/demo-listings";
import { enrichListings } from "@/lib/analytics/score";

export function GET() {
    const enrichedListings = enrichListings(demo_listings);

    return Response.json({
        count: enrichedListings.length,
        listings: enrichedListings,
    });
}