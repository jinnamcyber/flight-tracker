import { NextRequest, NextResponse } from 'next/server';

const AVIATIONSTACK_API_KEY = process.env.AVIATIONSTACK_API_KEY;
const AVIATIONSTACK_BASE_URL = 'http://api.aviationstack.com/v1';

interface AviationStackRoute {
    departure: {
        airport: string;
        timezone: string;
        iata: string;
        icao: string;
        terminal: string | null;
        time: string;
    };
    arrival: {
        airport: string;
        timezone: string;
        iata: string;
        icao: string;
        terminal: string | null;
        time: string;
    };
    airline: {
        name: string;
        callsign: string;
        iata: string;
        icao: string;
    };
    flight: {
        number: string;
    };
}

export interface FlightRoute {
    id: string;
    flightNumber: string;
    airline: string;
    airlineCode: string;
    departure: {
        airport: string;
        airportName: string;
        time: string;
        timezone: string;
        terminal: string | null;
    };
    arrival: {
        airport: string;
        airportName: string;
        time: string;
        timezone: string;
        terminal: string | null;
    };
}

function transformRoute(route: AviationStackRoute, index: number): FlightRoute {
    return {
        id: `${route.airline.iata}${route.flight.number}-${index}`,
        flightNumber: `${route.airline.iata}${route.flight.number}`,
        airline: route.airline.name,
        airlineCode: route.airline.iata,
        departure: {
            airport: route.departure.iata,
            airportName: route.departure.airport,
            time: route.departure.time,
            timezone: route.departure.timezone,
            terminal: route.departure.terminal,
        },
        arrival: {
            airport: route.arrival.iata,
            airportName: route.arrival.airport,
            time: route.arrival.time,
            timezone: route.arrival.timezone,
            terminal: route.arrival.terminal,
        },
    };
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const origin = searchParams.get('origin')?.toUpperCase().trim() || '';
    const destination = searchParams.get('destination')?.toUpperCase().trim() || '';
    const departureDate = searchParams.get('departureDate') || '';
    const returnDate = searchParams.get('returnDate') || '';

    if (!origin || !destination) {
        return NextResponse.json(
            { error: 'Both origin and destination are required' },
            { status: 400 }
        );
    }

    if (!AVIATIONSTACK_API_KEY) {
        return NextResponse.json(
            { error: 'Aviation Stack API key not configured' },
            { status: 500 }
        );
    }

    try {
        // Fetch outbound routes
        const outboundUrl = new URL(`${AVIATIONSTACK_BASE_URL}/routes`);
        outboundUrl.searchParams.set('access_key', AVIATIONSTACK_API_KEY);
        outboundUrl.searchParams.set('dep_iata', origin);
        outboundUrl.searchParams.set('arr_iata', destination);
        outboundUrl.searchParams.set('limit', '25');

        const outboundResponse = await fetch(outboundUrl.toString());
        const outboundData = await outboundResponse.json();

        if (outboundData.error) {
            console.error('Aviation Stack API error:', outboundData.error);
            return NextResponse.json(
                { error: outboundData.error.message || 'Failed to fetch flight routes' },
                { status: 400 }
            );
        }

        const outboundRoutes: FlightRoute[] = (outboundData.data || []).map(transformRoute);

        // Fetch return routes if return date is provided
        let returnRoutes: FlightRoute[] = [];
        if (returnDate) {
            const returnUrl = new URL(`${AVIATIONSTACK_BASE_URL}/routes`);
            returnUrl.searchParams.set('access_key', AVIATIONSTACK_API_KEY);
            returnUrl.searchParams.set('dep_iata', destination);
            returnUrl.searchParams.set('arr_iata', origin);
            returnUrl.searchParams.set('limit', '25');

            const returnResponse = await fetch(returnUrl.toString());
            const returnData = await returnResponse.json();

            if (!returnData.error) {
                returnRoutes = (returnData.data || []).map(transformRoute);
            }
        }

        return NextResponse.json({
            outbound: {
                routes: outboundRoutes,
                origin,
                destination,
                date: departureDate,
            },
            return: returnDate ? {
                routes: returnRoutes,
                origin: destination,
                destination: origin,
                date: returnDate,
            } : null,
        });
    } catch (error) {
        console.error('Failed to fetch from Aviation Stack:', error);
        return NextResponse.json(
            { error: 'Failed to fetch flight routes. Please try again.' },
            { status: 500 }
        );
    }
}
