export type PropertyType =
    | "single family"
    | "condo"
    | "townhouse"
    | "multi-family";

export type MarketPosition =
    | "potential_opportunity"
    | "within_range"
    | "above range"
    | "low_confidence";

export type Listing = {
    id: string;
    address: string;
    neighbourhood: string;
    zipcode: string;
    latitude: number;
    longitude: number;
    property_type: PropertyType;
    listPrice: number;
    beds: number;
    baths: number;
    yearBuilt: number;
    sqft: number;
    daysOnMarket: number;
};

export type ListingState =
    | { status: "loading" }
    | { status: "ready", listings: Listing[] }
    | { status: "error", message: string };

export type DrawerState =
    | { status: "closed" }
    | { status: "open", listingId: string };