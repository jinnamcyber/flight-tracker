'use client';

import { useState, useCallback } from 'react';

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
}

const statusStyles: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-600',
  boarding: 'bg-amber-50 text-amber-600',
  departed: 'bg-violet-50 text-violet-600',
  'in-flight': 'bg-sky-50 text-sky-600',
  active: 'bg-sky-50 text-sky-600',
  landed: 'bg-emerald-50 text-emerald-600',
  delayed: 'bg-orange-50 text-orange-600',
  cancelled: 'bg-red-50 text-red-600',
};

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function Home() {
  const [query, setQuery] = useState('');

  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchFlights = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setFlights([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('q', searchQuery);
      const response = await fetch(`/api/flights?${params.toString()}`);
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        setFlights([]);
      } else {
        setFlights(data.flights || []);
      }
    } catch (error) {
      console.error('Failed to fetch flights:', error);
      setFlights([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchFlights(query);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 sm:pt-24 pb-16">
        {/* Logo & Title - Google/Perplexity style centered */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <svg className="w-10 h-10 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
            <span className="text-3xl font-medium text-gray-800">Flight Tracker</span>
          </div>
        </div>

        {/* Search Box - Clean, Google-style */}
        <form onSubmit={handleSubmit} className="mb-8">
          {/* Search Input */}
          <div className="relative flex items-center bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md focus-within:shadow-md transition-shadow duration-200">
            <svg className="absolute left-4 sm:left-5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Flight, airline, or airport..."
              className="w-full py-3 sm:py-4 pl-12 sm:pl-14 pr-20 sm:pr-28 text-gray-700 placeholder-gray-400 bg-transparent rounded-full focus:outline-none text-base"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                'Search'
              )}
            </button>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-sm text-gray-500">
            <span>Try:</span>
            <button type="button" onClick={() => { setQuery('AA100'); searchFlights('AA100'); }} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
              AA100
            </button>
            <button type="button" onClick={() => { setQuery('UA'); searchFlights('UA'); }} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
              UA
            </button>
            <button type="button" onClick={() => { setQuery('JFK'); searchFlights('JFK'); }} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
              JFK
            </button>
          </div>
        </form>

        {/* Results Section */}
        <div className="mt-8">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-500">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Searching flights...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-50 rounded-full mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-gray-600">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && searched && flights.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-1">No flights found</h3>
              <p className="text-gray-500">Try a different flight number, airline, or airport code</p>
            </div>
          )}

          {/* Flight Results */}
          {!loading && flights.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                {flights.length} result{flights.length > 1 ? 's' : ''} for &quot;{query}&quot;
              </p>

              {flights.map((flight) => (
                <div
                  key={flight.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                >
                  {/* Flight Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{flight.flightNumber}</h3>
                        <p className="text-sm text-gray-500">{flight.airline}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[flight.status]}`}>
                      {flight.status.replace('-', ' ')}
                    </span>
                  </div>

                  {/* Route Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Departure */}
                    <div className="flex-1">
                      <p className="text-xl sm:text-2xl font-semibold text-gray-900">{flight.departure.airport}</p>
                      <p className="text-sm text-gray-500">{flight.departure.city}</p>
                      <div className="mt-2">
                        <p className="text-base font-medium text-gray-800">{formatTime(flight.departure.time)}</p>
                        <p className="text-xs text-gray-400">{formatDate(flight.departure.time)} · {flight.departure.timezone}</p>
                      </div>
                    </div>

                    {/* Flight Path Indicator - Hidden on mobile, visible on sm+ */}
                    <div className="hidden sm:flex flex-shrink-0 items-center gap-2 px-4">
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                      <div className="w-12 lg:w-16 h-px bg-gray-300" />
                      <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                      <div className="w-12 lg:w-16 h-px bg-gray-300" />
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                    </div>

                    {/* Mobile arrow divider */}
                    <div className="flex sm:hidden items-center gap-2 text-gray-400">
                      <div className="flex-1 h-px bg-gray-200" />
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Arrival */}
                    <div className="flex-1 sm:text-right">
                      <p className="text-xl sm:text-2xl font-semibold text-gray-900">{flight.arrival.airport}</p>
                      <p className="text-sm text-gray-500">{flight.arrival.city}</p>
                      <div className="mt-2">
                        <p className="text-base font-medium text-gray-800">{formatTime(flight.arrival.time)}</p>
                        <p className="text-xs text-gray-400">{formatDate(flight.arrival.time)} · {flight.arrival.timezone}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
