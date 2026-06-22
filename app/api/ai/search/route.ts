import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import { enrichListings } from "@/lib/analytics/score";
import { getListings } from "@/lib/data/listing-provider";
import type { EnrichedListing, PropertyType } from "@/lib/types";

type AiSearchHardFilters = {
    maxPrice: number | null;
    minBeds: number | null;
    minBaths: number | null;
    propertyTypes: string[];
    neighbourhoods: string[];
    zipcodes: string[];
    excludeLowConfidence: boolean;
};

type AiSearchModelMatch = {
    listingId: string;
    matchScore: number;
    reason: string;
};

type AiSearchModelResponse = {
    interpretedRequest: string;
    hardFilters: AiSearchHardFilters;
    softPreferences: string[];
    rankedMatches: AiSearchModelMatch[];
    clarifyingQuestion: string | null;
};

type AiSearchResponse = {
    interpretedRequest: string;
    hardFilters: AiSearchHardFilters;
    softPreferences: string[];
    matches: Array<{
        listing: EnrichedListing;
        matchScore: number;
        reason: string;
    }>;
    clarifyingQuestion: string | null;
    source: "gemini" | "fallback";
};

type ListingFact = {
    id: string;
    address: string;
    neighbourhood: string;
    zipcode: string;
    property_type: PropertyType;
    listPrice: number;
    beds: number;
    baths: number;
    sqft: number;
    daysOnMarket: number;
    marketPosition: string;
    priceDeltaPct: number;
    compCount: number;
    lowConfidence: boolean;
};

const DEFAULT_HARD_FILTERS: AiSearchHardFilters = {
    maxPrice: null,
    minBeds: null,
    minBaths: null,
    propertyTypes: [],
    neighbourhoods: [],
    zipcodes: [],
    excludeLowConfidence: false,
};

const PROPERTY_TYPES: PropertyType[] = [
    "single-family",
    "condo",
    "townhouse",
    "multi-family",
];

const searchResponseSchema = {
    type: Type.OBJECT,
    properties: {
        interpretedRequest: { type: Type.STRING },
        hardFilters: {
            type: Type.OBJECT,
            properties: {
                maxPrice: { type: Type.NUMBER, nullable: true },
                minBeds: { type: Type.NUMBER, nullable: true },
                minBaths: { type: Type.NUMBER, nullable: true },
                propertyTypes: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING,
                        format: "enum",
                        enum: PROPERTY_TYPES,
                    },
                },
                neighbourhoods: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                },
                zipcodes: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                },
                excludeLowConfidence: { type: Type.BOOLEAN },
            },
            required: [
                "maxPrice",
                "minBeds",
                "minBaths",
                "propertyTypes",
                "neighbourhoods",
                "zipcodes",
                "excludeLowConfidence",
            ],
        },
        softPreferences: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            maxItems: "5",
        },
        rankedMatches: {
            type: Type.ARRAY,
            maxItems: "8",
            items: {
                type: Type.OBJECT,
                properties: {
                    listingId: { type: Type.STRING },
                    matchScore: {
                        type: Type.NUMBER,
                        minimum: 0,
                        maximum: 100,
                    },
                    reason: { type: Type.STRING },
                },
                required: ["listingId", "matchScore", "reason"],
            },
        },
        clarifyingQuestion: { type: Type.STRING, nullable: true },
    },
    required: [
        "interpretedRequest",
        "hardFilters",
        "softPreferences",
        "rankedMatches",
        "clarifyingQuestion",
    ],
};

function buildListingFacts(listings: EnrichedListing[]): ListingFact[] {
    return listings.map((listing) => ({
        id: listing.id,
        address: listing.address,
        neighbourhood: listing.neighbourhood,
        zipcode: listing.zipcode,
        property_type: listing.property_type,
        listPrice: listing.listPrice,
        beds: listing.beds,
        baths: listing.baths,
        sqft: listing.sqft,
        daysOnMarket: listing.daysOnMarket,
        marketPosition: listing.analytics.marketPosition,
        priceDeltaPct: Number(listing.analytics.priceDeltaPct.toFixed(1)),
        compCount: listing.analytics.compCount,
        lowConfidence: listing.analytics.lowConfidence,
    }));
}

function clampScore(value: unknown): number {
    const numericValue = typeof value === "number" ? value : Number(value);

    if (!Number.isFinite(numericValue)) {
        return 0;
    }

    return Math.max(0, Math.min(100, Math.round(numericValue)));
}

function normalizeText(value: string): string {
    return value.trim().toLowerCase();
}

function parsePriceCeiling(query: string): number | null {
    const normalizedQuery = query.toLowerCase();
    const shorthandMatch = normalizedQuery.match(
        /(?:under|below|less than|max|maximum|up to)\s*\$?\s*(\d+(?:\.\d+)?)\s*k\b/,
    );

    if (shorthandMatch) {
        return Math.round(Number(shorthandMatch[1]) * 1000);
    }

    const fullMatch = normalizedQuery.match(
        /(?:under|below|less than|max|maximum|up to)\s*\$?\s*([\d,]+)/,
    );

    if (!fullMatch) {
        return null;
    }

    const parsed = Number(fullMatch[1].replaceAll(",", ""));
    return Number.isFinite(parsed) ? parsed : null;
}

function parseMinimumCount(query: string, labelPattern: RegExp): number | null {
    const match = query.toLowerCase().match(labelPattern);

    if (!match) {
        return null;
    }

    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : null;
}

function extractFallbackFilters(
    query: string,
    listingFacts: ListingFact[],
): AiSearchHardFilters {
    const normalizedQuery = normalizeText(query);
    const propertyTypes = PROPERTY_TYPES.filter((propertyType) => {
        const spacedType = propertyType.replace("-", " ");
        return (
            normalizedQuery.includes(propertyType) ||
            normalizedQuery.includes(spacedType)
        );
    });

    const neighbourhoods = Array.from(
        new Set(
            listingFacts
                .map((listing) => listing.neighbourhood)
                .filter((neighbourhood) =>
                    normalizedQuery.includes(neighbourhood.toLowerCase()),
                ),
        ),
    );

    const zipcodes = Array.from(
        new Set(
            listingFacts
                .map((listing) => listing.zipcode)
                .filter((zipcode) => normalizedQuery.includes(zipcode)),
        ),
    );

    return {
        maxPrice: parsePriceCeiling(query),
        minBeds: parseMinimumCount(query, /(\d+(?:\.\d+)?)[\s-]*(?:bed|beds|bd|bedroom|bedrooms)\b/),
        minBaths: parseMinimumCount(query, /(\d+(?:\.\d+)?)[\s-]*(?:bath|baths|ba|bathroom|bathrooms)\b/),
        propertyTypes,
        neighbourhoods,
        zipcodes,
        excludeLowConfidence:
            normalizedQuery.includes("not low confidence") ||
            normalizedQuery.includes("exclude low confidence") ||
            normalizedQuery.includes("avoid low confidence"),
    };
}

function matchesHardFilters(
    listing: EnrichedListing,
    hardFilters: AiSearchHardFilters,
): boolean {
    if (hardFilters.maxPrice !== null && listing.listPrice > hardFilters.maxPrice) {
        return false;
    }

    if (hardFilters.minBeds !== null && listing.beds < hardFilters.minBeds) {
        return false;
    }

    if (hardFilters.minBaths !== null && listing.baths < hardFilters.minBaths) {
        return false;
    }

    if (
        hardFilters.propertyTypes.length > 0 &&
        !hardFilters.propertyTypes.includes(listing.property_type)
    ) {
        return false;
    }

    if (
        hardFilters.neighbourhoods.length > 0 &&
        !hardFilters.neighbourhoods.some(
            (neighbourhood) =>
                normalizeText(neighbourhood) === normalizeText(listing.neighbourhood),
        )
    ) {
        return false;
    }

    if (
        hardFilters.zipcodes.length > 0 &&
        !hardFilters.zipcodes.includes(listing.zipcode)
    ) {
        return false;
    }

    if (hardFilters.excludeLowConfidence && listing.analytics.lowConfidence) {
        return false;
    }

    return true;
}

function buildFallbackSearch(
    query: string,
    enrichedListings: EnrichedListing[],
): AiSearchModelResponse {
    const listingFacts = buildListingFacts(enrichedListings);
    const hardFilters = extractFallbackFilters(query, listingFacts);
    const normalizedQuery = normalizeText(query);
    const wantsBelowMedian =
        normalizedQuery.includes("below comp") ||
        normalizedQuery.includes("below comparable") ||
        normalizedQuery.includes("below median") ||
        normalizedQuery.includes("priced below") ||
        normalizedQuery.includes("opportunity");

    const rankedMatches = enrichedListings
        .map((listing) => {
            let score = 0;
            const reasons: string[] = [];

            if (!matchesHardFilters(listing, hardFilters)) {
                return null;
            }

            if (wantsBelowMedian && listing.analytics.priceDeltaPct >= 0) {
                return null;
            }

            score += 35;

            const searchableText = [
                listing.address,
                listing.neighbourhood,
                listing.zipcode,
                listing.property_type,
            ]
                .join(" ")
                .toLowerCase();

            for (const token of normalizedQuery.split(/\s+/).filter(Boolean)) {
                if (searchableText.includes(token)) {
                    score += 5;
                }
            }

            if (hardFilters.maxPrice !== null) {
                reasons.push(`priced at $${listing.listPrice.toLocaleString()}`);
                score += Math.max(
                    0,
                    Math.min(
                        15,
                        Math.round(
                            ((hardFilters.maxPrice - listing.listPrice) /
                                hardFilters.maxPrice) *
                            15,
                        ),
                    ),
                );
            }

            if (hardFilters.minBeds !== null) {
                reasons.push(`${listing.beds} beds`);
            }

            if (hardFilters.propertyTypes.includes(listing.property_type)) {
                reasons.push(listing.property_type);
                score += 10;
            }

            if (wantsBelowMedian && listing.analytics.priceDeltaPct < 0) {
                reasons.push("priced below comparable median");
                score += 20;
            }

            if (
                normalizedQuery.includes("not low confidence") &&
                !listing.analytics.lowConfidence
            ) {
                reasons.push("not low confidence");
                score += 10;
            }

            if (listing.analytics.marketPosition === "potential_opportunity") {
                score += 10;
            }

            return {
                listingId: listing.id,
                matchScore: clampScore(score),
                reason:
                    reasons.length > 0
                        ? `Matches ${reasons.join(", ")}.`
                        : "Matches the available keyword and listing filters.",
            };
        })
        .filter((match): match is AiSearchModelMatch => match !== null)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 8);

    return {
        interpretedRequest: query,
        hardFilters,
        softPreferences: wantsBelowMedian
            ? ["Prefer listings priced below comparable median."]
            : [],
        rankedMatches,
        clarifyingQuestion:
            rankedMatches.length === 0
                ? "Try adding a neighbourhood, ZIP code, property type, price, or bedroom count."
                : null,
    };
}

function normalizeHardFilters(value: unknown): AiSearchHardFilters {
    if (!value || typeof value !== "object") {
        return DEFAULT_HARD_FILTERS;
    }

    const candidate = value as Partial<AiSearchHardFilters>;

    return {
        maxPrice:
            typeof candidate.maxPrice === "number" &&
                Number.isFinite(candidate.maxPrice)
                ? candidate.maxPrice
                : null,
        minBeds:
            typeof candidate.minBeds === "number" && Number.isFinite(candidate.minBeds)
                ? candidate.minBeds
                : null,
        minBaths:
            typeof candidate.minBaths === "number" &&
                Number.isFinite(candidate.minBaths)
                ? candidate.minBaths
                : null,
        propertyTypes: Array.isArray(candidate.propertyTypes)
            ? candidate.propertyTypes.filter((propertyType) =>
                PROPERTY_TYPES.includes(propertyType as PropertyType),
            )
            : [],
        neighbourhoods: Array.isArray(candidate.neighbourhoods)
            ? candidate.neighbourhoods.filter(
                (neighbourhood): neighbourhood is string =>
                    typeof neighbourhood === "string",
            )
            : [],
        zipcodes: Array.isArray(candidate.zipcodes)
            ? candidate.zipcodes.filter(
                (zipcode): zipcode is string => typeof zipcode === "string",
            )
            : [],
        excludeLowConfidence: candidate.excludeLowConfidence === true,
    };
}

function normalizeGeminiResponse(
    value: unknown,
    query: string,
): AiSearchModelResponse | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const candidate = value as Partial<AiSearchModelResponse>;

    return {
        interpretedRequest:
            typeof candidate.interpretedRequest === "string"
                ? candidate.interpretedRequest
                : query,
        hardFilters: normalizeHardFilters(candidate.hardFilters),
        softPreferences: Array.isArray(candidate.softPreferences)
            ? candidate.softPreferences
                .filter((preference): preference is string => typeof preference === "string")
                .slice(0, 5)
            : [],
        rankedMatches: Array.isArray(candidate.rankedMatches)
            ? candidate.rankedMatches
                .filter(
                    (match): match is AiSearchModelMatch =>
                        typeof match === "object" &&
                        match !== null &&
                        typeof (match as AiSearchModelMatch).listingId === "string",
                )
                .map((match) => ({
                    listingId: match.listingId,
                    matchScore: clampScore(match.matchScore),
                    reason:
                        typeof match.reason === "string"
                            ? match.reason
                            : "Matches the interpreted request.",
                }))
                .slice(0, 8)
            : [],
        clarifyingQuestion:
            typeof candidate.clarifyingQuestion === "string"
                ? candidate.clarifyingQuestion
                : null,
    };
}

function buildClientResponse(
    modelResponse: AiSearchModelResponse,
    enrichedListings: EnrichedListing[],
    source: "gemini" | "fallback",
): AiSearchResponse {
    const listingById = new Map(
        enrichedListings.map((listing) => [listing.id, listing]),
    );
    const seenIds = new Set<string>();
    const matches = modelResponse.rankedMatches
        .filter((match) => {
            if (seenIds.has(match.listingId)) {
                return false;
            }

            seenIds.add(match.listingId);
            return listingById.has(match.listingId);
        })
        .map((match) => ({
            listing: listingById.get(match.listingId) as EnrichedListing,
            matchScore: clampScore(match.matchScore),
            reason: match.reason,
        }))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 8);

    return {
        interpretedRequest: modelResponse.interpretedRequest,
        hardFilters: modelResponse.hardFilters,
        softPreferences: modelResponse.softPreferences,
        matches,
        clarifyingQuestion: modelResponse.clarifyingQuestion,
        source,
    };
}

async function generateGeminiSearch(
    query: string,
    listingFacts: ListingFact[],
): Promise<AiSearchModelResponse | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!apiKey) {
        return null;
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model,
            contents: [
                "You are an intent parser for MarketLens real-estate listing search.",
                "Return strict JSON only using the provided schema.",
                "Only use listing IDs present in the provided listing facts.",
                "Do not invent listings, neighborhoods, prices, or listing IDs.",
                "Do not provide investment advice or decide whether a property is a good investment.",
                "Interpret the request into hard filters, soft preferences, and ranked matches from the provided data.",
                "Return at most 8 ranked matches with matchScore from 0 to 100.",
                `User request: ${query}`,
                `Listing facts: ${JSON.stringify(listingFacts)}`,
            ].join("\n"),
            config: {
                responseMimeType: "application/json",
                responseSchema: searchResponseSchema,
            },
        });

        return normalizeGeminiResponse(JSON.parse(response.text ?? "{}"), query);
    } catch (error) {
        console.warn("Gemini AI search failed; using fallback.", error);
        return null;
    }
}

export async function POST(request: Request) {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Request body must be valid JSON." },
            { status: 400 },
        );
    }

    const query =
        body && typeof body === "object" && "query" in body
            ? (body as { query?: unknown }).query
            : null;

    if (typeof query !== "string" || query.trim().length === 0) {
        return NextResponse.json(
            { error: "query is required." },
            { status: 400 },
        );
    }

    const listings = await getListings();
    const enrichedListings = enrichListings(listings);
    const listingFacts = buildListingFacts(enrichedListings);
    const geminiResponse = await generateGeminiSearch(query, listingFacts);
    const initialResponse = geminiResponse
        ? buildClientResponse(geminiResponse, enrichedListings, "gemini")
        : null;

    if (initialResponse && initialResponse.matches.length > 0) {
        return NextResponse.json(initialResponse);
    }

    const fallbackResponse = buildFallbackSearch(query, enrichedListings);
    return NextResponse.json(
        buildClientResponse(fallbackResponse, enrichedListings, "fallback"),
    );
}
