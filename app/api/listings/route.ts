// import { enrichListings } from "@/lib/analytics/score";
// import { getListings } from "@/lib/data/listing-provider";

// export async function GET() {
//     const listings = await getListings();
//     const enrichedListings = enrichListings(listings);

//     return Response.json({
//         count: enrichedListings.length,
//         listings: enrichedListings,
//     });
// }


import { NextResponse } from "next/server";
import { enrichListings } from "@/lib/analytics/score";
import { getListings } from "@/lib/data/listing-provider";

export async function GET() {
    const listings = await getListings();
    const enrichedListings = enrichListings(listings);

    return NextResponse.json({
        count: enrichedListings.length,
        listings: enrichedListings,
    });
}