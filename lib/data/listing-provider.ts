import { demo_listings } from "@/lib/data/demo-listings";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Listing, PropertyType } from "@/lib/types";

type ListingRow = {
    id: string;
    address: string;
    neighbourhood: string;
    zipcode: string;
    latitude: number;
    longitude: number;
    property_type: PropertyType;
    list_price: number;
    beds: number;
    baths: number;
    year_built: number;
    sqft: number;
    days_on_market: number;
};

const LISTING_SELECT =
    "id,address,neighbourhood,zipcode,latitude,longitude,property_type,list_price,beds,baths,year_built,sqft,days_on_market";

function mapListingRow(row: ListingRow): Listing {
    return {
        id: row.id,
        address: row.address,
        neighbourhood: row.neighbourhood,
        zipcode: row.zipcode,
        latitude: row.latitude,
        longitude: row.longitude,
        property_type: row.property_type,
        listPrice: row.list_price,
        beds: row.beds,
        baths: row.baths,
        yearBuilt: row.year_built,
        sqft: row.sqft,
        daysOnMarket: row.days_on_market,
    };
}

export async function getListings(): Promise<Listing[]> {
    const supabase = getSupabaseServerClient();

    if (!supabase) {
        return demo_listings;
    }

    const { data, error } = await supabase
        .schema("public")
        .from("listings")
        .select(LISTING_SELECT)
        .order("id", { ascending: true });

    if (error) {
        console.warn("Supabase listings query failed; using demo listings.", error.message);
        return demo_listings;
    }

    if (!data || data.length === 0) {
        return demo_listings;
    }

    return (data as ListingRow[]).map(mapListingRow);
}
