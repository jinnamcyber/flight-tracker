import { NextRequest, NextResponse } from 'next/server';

const AVIATIONSTACK_API_KEY = process.env.AVIATIONSTACK_API_KEY;
const AVIATIONSTACK_BASE_URL = 'http://api.aviationstack.com/v1';

interface AviationStackFlight {
    flight_date: string;
    flight_status: string;
    departure: {
        airport: string;
        timezone: string;
        iata: string;
        icao: string;
        terminal: string | null;
        gate: string | null;
        delay: number | null;
        scheduled: string;
        estimated: string;
        actual: string | null;
    };
    arrival: {
        airport: string;
        timezone: string;
        iata: string;
        icao: string;
        terminal: string | null;
        gate: string | null;
        baggage: string | null;
        delay: number | null;
        scheduled: string;
        estimated: string;
        actual: string | null;
    };
    airline: {
        name: string;
        iata: string;
        icao: string;
    };
    flight: {
        number: string;
        iata: string;
        icao: string;
        codeshared: unknown;
    };
    live?: {
        updated: string;
        latitude: number;
        longitude: number;
        altitude: number;
        direction: number;
        speed_horizontal: number;
        speed_vertical: number;
        is_ground: boolean;
    };
}

interface Flight {
    id: string;
    flightNumber: string;
    airline: string;
    departure: {
        airport: string;
        city: string;
        time: string;
        timezone: string;
    };
    arrival: {
        airport: string;
        city: string;
        time: string;
        timezone: string;
    };
    status: 'scheduled' | 'boarding' | 'departed' | 'in-flight' | 'landed' | 'delayed' | 'cancelled';
    live?: {
        latitude: number;
        longitude: number;
        altitude: number;
        speed: number;
        updated: string;
    };
}

function mapStatus(apiStatus: string, depDelay: number | null, arrDelay: number | null): Flight['status'] {
    const status = apiStatus?.toLowerCase() || 'scheduled';

    // Check for delays
    if ((depDelay && depDelay > 15) || (arrDelay && arrDelay > 15)) {
        return 'delayed';
    }

    switch (status) {
        case 'scheduled':
            return 'scheduled';
        case 'active':
            return 'in-flight';
        case 'landed':
            return 'landed';
        case 'cancelled':
            return 'cancelled';
        case 'incident':
            return 'delayed';
        case 'diverted':
            return 'delayed';
        default:
            return 'scheduled';
    }
}

function formatTimezone(tz: string): string {
    if (!tz) return '';
    // Extract abbreviated timezone from full timezone string
    // e.g., "America/Los_Angeles" -> "America/Los_Angeles (PST)"
    try {
        const date = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            timeZoneName: 'short',
        });
        const parts = formatter.formatToParts(date);
        const tzAbbr = parts.find(p => p.type === 'timeZoneName')?.value || '';
        return `${tz} (${tzAbbr})`;
    } catch {
        return tz;
    }
}

function transformFlight(apiFlight: AviationStackFlight, index: number): Flight {
    return {
        id: `${apiFlight.flight.iata}-${index}`,
        flightNumber: apiFlight.flight.iata || `${apiFlight.airline.iata}${apiFlight.flight.number}`,
        airline: apiFlight.airline.name,
        departure: {
            airport: apiFlight.departure.iata,
            city: apiFlight.departure.airport,
            time: apiFlight.departure.scheduled,
            timezone: formatTimezone(apiFlight.departure.timezone),
        },
        arrival: {
            airport: apiFlight.arrival.iata,
            city: apiFlight.arrival.airport,
            time: apiFlight.arrival.scheduled,
            timezone: formatTimezone(apiFlight.arrival.timezone),
        },
        status: mapStatus(apiFlight.flight_status, apiFlight.departure.delay, apiFlight.arrival.delay),
        ...(apiFlight.live && {
            live: {
                latitude: apiFlight.live.latitude,
                longitude: apiFlight.live.longitude,
                altitude: apiFlight.live.altitude,
                speed: apiFlight.live.speed_horizontal,
                updated: apiFlight.live.updated,
            },
        }),
    };
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.toUpperCase().trim() || '';
    const flightDate = searchParams.get('date') || '';

    if (!query) {
        return NextResponse.json({ flights: [] });
    }

    if (!AVIATIONSTACK_API_KEY) {
        return NextResponse.json(
            { error: 'Aviation Stack API key not configured. Please set AVIATIONSTACK_API_KEY environment variable.' },
            { status: 500 }
        );
    }

    try {
        // Build API URL with query parameters
        const apiUrl = new URL(`${AVIATIONSTACK_BASE_URL}/flights`);
        apiUrl.searchParams.set('access_key', AVIATIONSTACK_API_KEY);

        // Determine search type based on query format
        // If it looks like a flight number (letters followed by numbers), use flight_iata
        // Otherwise, search by departure airport
        const flightNumberPattern = /^[A-Z]{2}\d+$/;
        const airportPattern = /^[A-Z]{3}$/;

        if (flightNumberPattern.test(query)) {
            apiUrl.searchParams.set('flight_iata', query);
        } else if (airportPattern.test(query)) {
            // Search both departure and arrival airports
            apiUrl.searchParams.set('dep_iata', query);
        } else if (query.length === 2) {
            // Likely an airline code
            apiUrl.searchParams.set('airline_iata', query);
        } else {
            // Try as a partial flight number
            apiUrl.searchParams.set('flight_iata', query);
        }

        // Add date filter if provided
        if (flightDate) {
            apiUrl.searchParams.set('flight_date', flightDate);
        }

        // Limit results
        apiUrl.searchParams.set('limit', '20');

        const response = await fetch(apiUrl.toString());
        const data = await response.json();

        if (data.error) {
            console.error('Aviation Stack API error:', data.error);
            return NextResponse.json(
                { error: data.error.message || 'Failed to fetch flight data' },
                { status: 400 }
            );
        }

        const flights: Flight[] = (data.data || []).map(transformFlight);

        return NextResponse.json({ flights });
    } catch (error) {
        console.error('Failed to fetch from Aviation Stack:', error);
        return NextResponse.json(
            { error: 'Failed to fetch flight data. Please try again.' },
            { status: 500 }
        );
    }
}
