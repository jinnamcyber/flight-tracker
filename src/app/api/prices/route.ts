import { NextRequest, NextResponse } from 'next/server';

const FLIGHTAPI_KEY = process.env.FLIGHTAPI_KEY;
const FLIGHTAPI_BASE_URL = 'https://api.flightapi.io';

interface FlightApiPricingOption {
    price: {
        amount: number;
        update_status: string;
    };
    agent_ids: string[];
    items: {
        url: string;
    }[];
}

interface FlightApiLeg {
    id: string;
    origin_place_id: number;
    destination_place_id: number;
    departure: string;
    arrival: string;
    duration: number;
    stop_count: number;
    marketing_carrier_ids: number[];
}

interface FlightApiItinerary {
    id: string;
    pricing_options: FlightApiPricingOption[];
    legs: FlightApiLeg[];
}

interface FlightApiPlace {
    id: number;
    iata: string;
    name: string;
    type: string;
}

interface FlightApiCarrier {
    id: number;
    name: string;
    iata: string;
}

interface FlightApiResponse {
    itineraries: FlightApiItinerary[];
    places: Record<string, FlightApiPlace>;
    carriers: Record<string, FlightApiCarrier>;
    currency: string;
}

interface PriceResult {
    id: string;
    price: number;
    currency: string;
    airline: string;
    airlineCode: string;
    departure: {
        airport: string;
        airportName: string;
        time: string;
    };
    arrival: {
        airport: string;
        airportName: string;
        time: string;
    };
    duration: number;
    stops: number;
    bookingUrl: string;
}

function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

function transformPricingData(data: FlightApiResponse): PriceResult[] {
    const results: PriceResult[] = [];
    const places = data.places || {};
    const carriers = data.carriers || {};
    const currency = data.currency || 'USD';

    for (const itinerary of data.itineraries || []) {
        const pricingOption = itinerary.pricing_options?.[0];
        if (!pricingOption) continue;

        const leg = itinerary.legs?.[0];
        if (!leg) continue;

        const originPlace = places[leg.origin_place_id];
        const destPlace = places[leg.destination_place_id];
        const carrierId = leg.marketing_carrier_ids?.[0];
        const carrier = carriers[carrierId];

        const bookingItem = pricingOption.items?.[0];
        let bookingUrl = '';
        if (bookingItem?.url) {
            // FlightAPI returns relative URLs, we'd need to construct full URL
            // For now, we'll leave it as-is or construct a search link
            bookingUrl = bookingItem.url.startsWith('http')
                ? bookingItem.url
                : `https://www.skyscanner.com${bookingItem.url}`;
        }

        results.push({
            id: itinerary.id,
            price: pricingOption.price?.amount || 0,
            currency,
            airline: carrier?.name || 'Unknown Airline',
            airlineCode: carrier?.iata || '',
            departure: {
                airport: originPlace?.iata || '',
                airportName: originPlace?.name || '',
                time: leg.departure,
            },
            arrival: {
                airport: destPlace?.iata || '',
                airportName: destPlace?.name || '',
                time: leg.arrival,
            },
            duration: leg.duration,
            stops: leg.stop_count,
            bookingUrl,
        });
    }

    // Sort by price ascending
    results.sort((a, b) => a.price - b.price);

    return results;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from')?.toUpperCase().trim();
    const to = searchParams.get('to')?.toUpperCase().trim();
    const date = searchParams.get('date'); // YYYY-MM-DD format
    const adults = searchParams.get('adults') || '1';
    const currency = searchParams.get('currency') || 'USD';

    // Validate required params
    if (!from || !to || !date) {
        return NextResponse.json(
            { error: 'Missing required parameters: from, to, date' },
            { status: 400 }
        );
    }

    // Validate IATA codes
    if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
        return NextResponse.json(
            { error: 'Invalid airport code. Use 3-letter IATA codes (e.g., JFK, LAX)' },
            { status: 400 }
        );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json(
            { error: 'Invalid date format. Use YYYY-MM-DD' },
            { status: 400 }
        );
    }

    if (!FLIGHTAPI_KEY) {
        return NextResponse.json(
            { error: 'FlightAPI.io API key not configured. Please set FLIGHTAPI_KEY environment variable.' },
            { status: 500 }
        );
    }

    try {
        // Build FlightAPI.io URL for one-way trip
        // Format: /onewaytrip/{apiKey}/{from}/{to}/{date}/{adults}/{children}/{infants}/{cabinClass}/{currency}
        const apiUrl = `${FLIGHTAPI_BASE_URL}/onewaytrip/${FLIGHTAPI_KEY}/${from}/${to}/${date}/${adults}/0/0/Economy/${currency}`;

        const response = await fetch(apiUrl, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('FlightAPI.io error:', response.status, errorText);

            if (response.status === 401) {
                return NextResponse.json(
                    { error: 'Invalid API key. Please check your FLIGHTAPI_KEY.' },
                    { status: 401 }
                );
            }

            if (response.status === 429) {
                return NextResponse.json(
                    { error: 'API rate limit exceeded. Please try again later.' },
                    { status: 429 }
                );
            }

            return NextResponse.json(
                { error: 'Failed to fetch pricing data. Please try again.' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Handle case where API returns error in body
        if (data.error || data.message) {
            return NextResponse.json(
                { error: data.message || data.error || 'Unknown API error' },
                { status: 400 }
            );
        }

        const prices = transformPricingData(data);

        return NextResponse.json({
            prices,
            meta: {
                from,
                to,
                date,
                adults: parseInt(adults),
                currency,
                resultsCount: prices.length,
            }
        });
    } catch (error) {
        console.error('Failed to fetch from FlightAPI.io:', error);
        return NextResponse.json(
            { error: 'Failed to fetch pricing data. Please try again.' },
            { status: 500 }
        );
    }
}
