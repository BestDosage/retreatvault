"use client";

import { useState, useMemo } from "react";

interface RealCostCalculatorProps {
  retreatName: string;
  priceMinPerNight: number;
  priceMaxPerNight: number;
  pricingModel: string;
  minimumStayNights: number;
  country: string;
  region: string;
  airportDistanceKm: number;
  nearestAirport: string;
}

const TRIP_LENGTHS = [3, 5, 7, 14] as const;

function getFlightCost(country: string): number {
  const c = country.toLowerCase();
  if (c === "united states" || c === "usa" || c === "us") return 400;
  if (c === "mexico") return 500;
  if (c === "canada") return 350;
  // Europe
  const euroCountries = [
    "austria", "belgium", "croatia", "czech republic", "denmark", "finland",
    "france", "germany", "greece", "hungary", "iceland", "ireland", "italy",
    "netherlands", "norway", "poland", "portugal", "romania", "spain",
    "sweden", "switzerland", "turkey", "united kingdom", "uk",
  ];
  if (euroCountries.includes(c)) return 800;
  // Asia
  const asiaCountries = [
    "bali", "cambodia", "china", "india", "indonesia", "japan", "laos",
    "malaysia", "maldives", "myanmar", "nepal", "philippines", "singapore",
    "south korea", "sri lanka", "taiwan", "thailand", "vietnam",
  ];
  if (asiaCountries.includes(c)) return 1200;
  return 1000;
}

function getTipPercent(country: string): number {
  const c = country.toLowerCase();
  if (c === "united states" || c === "usa" || c === "us" || c === "mexico") return 0.15;
  const euroCountries = [
    "austria", "belgium", "croatia", "czech republic", "denmark", "finland",
    "france", "germany", "greece", "hungary", "iceland", "ireland", "italy",
    "netherlands", "norway", "poland", "portugal", "romania", "spain",
    "sweden", "switzerland", "turkey", "united kingdom", "uk",
  ];
  if (euroCountries.includes(c)) return 0.05;
  return 0.10;
}

function fmt(n: number): string {
  return "$" + Math.round(n).toLocaleString();
}

export default function RealCostCalculator({
  retreatName,
  priceMinPerNight,
  priceMaxPerNight,
  pricingModel,
  minimumStayNights,
  country,
  region,
  airportDistanceKm,
  nearestAirport,
}: RealCostCalculatorProps) {
  const defaultDays = TRIP_LENGTHS.includes(minimumStayNights as typeof TRIP_LENGTHS[number])
    ? minimumStayNights
    : 7;
  const [days, setDays] = useState(defaultDays);

  const costs = useMemo(() => {
    const avgPerNight = (priceMinPerNight + priceMaxPerNight) / 2;
    const accommodation = avgPerNight * days;
    const flights = getFlightCost(country);
    const transferOneWay = Math.max(airportDistanceKm * 1.5, 30);
    const transfer = transferOneWay * 2;
    const isAllInclusive = pricingModel?.toLowerCase().includes("all_inclusive") ||
      pricingModel?.toLowerCase().includes("all-inclusive") ||
      pricingModel?.toLowerCase().includes("allinclusive");
    const treatments = isAllInclusive ? 0 : 150 * days;
    const tipPercent = getTipPercent(country);
    const tipping = accommodation * tipPercent;
    const insurance = 15 * days;
    const total = accommodation + flights + transfer + treatments + tipping + insurance;

    return { accommodation, flights, transfer, treatments, tipping, insurance, total, isAllInclusive };
  }, [days, priceMinPerNight, priceMaxPerNight, pricingModel, country, airportDistanceKm]);

  const lineItems = [
    { label: "Accommodation", value: costs.accommodation, detail: `${days} nights avg` },
    { label: "Flights (round trip)", value: costs.flights, detail: "from US" },
    { label: "Airport Transfer", value: costs.transfer, detail: `${nearestAirport}, round trip` },
    {
      label: "Treatments & Extras",
      value: costs.treatments,
      detail: costs.isAllInclusive ? "Included in stay" : `est. $150/day`,
    },
    { label: "Tipping", value: costs.tipping, detail: `${Math.round(getTipPercent(country) * 100)}% of accommodation` },
    { label: "Travel Insurance", value: costs.insurance, detail: "$15/day" },
  ];

  return (
    <section className="border-t border-cream-200 pt-8">
      <div className="grid gap-6 md:grid-cols-[1fr_2fr] md:gap-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">
            Trip Budget
          </p>
          <h3 className="mt-2 font-display text-xl text-ink-900">Real Cost Calculator</h3>
          <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-ink-700">
            Estimate the true total cost of a trip to {retreatName}.
          </p>
        </div>
        <div>
          {/* Trip Length Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs text-ink-500">Trip length:</span>
            {TRIP_LENGTHS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors duration-150 ease-out ${
                  days === d
                    ? "bg-ink-900 text-cream-50"
                    : "text-ink-500 ring-1 ring-ink-900/15 hover:text-ink-900"
                }`}
              >
                {d} days
              </button>
            ))}
          </div>

          {/* Line Items */}
          <div className="mt-7">
            {lineItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 border-b border-cream-200 py-3"
              >
                <div>
                  <span className="text-[13px] font-medium text-ink-700">{item.label}</span>
                  <span className="ml-3 text-[11px] text-ink-500">{item.detail}</span>
                </div>
                <span className={`font-display text-[15px] tabular-nums ${item.value === 0 ? "text-sage-700" : "text-ink-900"}`}>
                  {item.value === 0 ? "Included" : fmt(item.value)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-sage-100 px-6 py-5">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-700">
                Estimated Total
              </span>
              <p className="mt-0.5 text-[11px] text-sage-700/80">{days}-day trip for 1 person</p>
            </div>
            <span className="font-display text-3xl tabular-nums text-sage-700">{fmt(costs.total)}</span>
          </div>

          {/* Disclaimer */}
          <p className="mt-6 text-[11px] italic leading-relaxed text-ink-500">
            Estimates based on typical costs from the US. Actual prices vary by origin, season, and booking.
          </p>
        </div>
      </div>
    </section>
  );
}
