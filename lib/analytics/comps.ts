import type { Listing } from "@/lib/types";

function isWithinPercentRange(
    candidateValue: number,
    targetValue: number,
    percent: number,
): boolean {
    const lowerBound = targetValue * (1 - percent / 100);
    const upperBound = targetValue * (1 + percent / 100);

    return candidateValue >= lowerBound && candidateValue <= upperBound;
}

export function getComparableListings(
    targetListing: Listing,
    allListings: Listing[],
): Listing[] {
    return allListings.filter((candidate) => {
        if (candidate.id === targetListing.id) {
            return false;
        }

        const sameNeighborhood =
            candidate.neighbourhood === targetListing.neighbourhood;

        const samePropertyType =
            candidate.property_type === targetListing.property_type;

        const similarBeds =
            Math.abs(candidate.beds - targetListing.beds) <= 1;

        const similarBaths =
            Math.abs(candidate.baths - targetListing.baths) <= 1;

        const similarSqft = isWithinPercentRange(
            candidate.sqft,
            targetListing.sqft,
            20,
        );

        return (
            sameNeighborhood &&
            samePropertyType &&
            similarBeds &&
            similarBaths &&
            similarSqft
        );
    });
}

export function getFallbackComparableListings(
    targetListing: Listing,
    allListings: Listing[],
): Listing[] {
    return allListings.filter((candidate) => {
        if (candidate.id === targetListing.id) {
            return false;
        }

        const samePropertyType =
            candidate.property_type === targetListing.property_type;

        const similarBeds =
            Math.abs(candidate.beds - targetListing.beds) <= 1;

        return samePropertyType && similarBeds;
    });
}