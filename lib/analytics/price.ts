import type { Listing } from "@/lib/types";

export function calculatePricePerSquareFoot(listing: Listing): number {
    if (listing.sqft <= 0) {
        throw new Error("sqft must be greater than 0");
    }

    return Math.round(listing.listPrice / listing.sqft);
}