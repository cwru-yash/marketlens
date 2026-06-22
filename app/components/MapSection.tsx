"use client";

import dynamic from "next/dynamic";
import type { EnrichedListing } from "@/lib/types";

const ListingMap = dynamic(
    () => import("@/app/components/ListingMap").then((mod) => mod.ListingMap),
    {
        ssr: false,
        loading: () => (
            <div className="mt-0 flex h-[360px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-400 md:h-[420px]">
                Loading map...
            </div>
        ),
    },
);

type MapSectionProps = {
    listings: EnrichedListing[];
    selectedListingId: string | null;
    onSelectListing: (listingId: string) => void;
};

export function MapSection({
    listings,
    selectedListingId,
    onSelectListing,
}: MapSectionProps) {
    return (
        <ListingMap
            listings={listings}
            selectedListingId={selectedListingId}
            onSelectListing={onSelectListing}
        />
    );
}
