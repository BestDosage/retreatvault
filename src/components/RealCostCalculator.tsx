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
    <div className="rounded-3xl border border-white/[0.04] bg-white/[0.015] p-8 sm:p-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-500">
        Trip Budget
      </p>
      <h2 className="mt-3 font-serif text-3xl font-light text-white">Real Cost Calculator</h2>
      <p className="mt-2 text-[12px] text-dark-400">
        Estimate the true total cost of a trip to {retreatName}
      </p>

      {/* Trip Length Selector */}
      <div className="mt-8 flex items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-dark-500">
          Trip Length
        </span>
        <div className="flex gap-2">
          {TRIP_LENGTHS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-all duration-300 ${
                days === d
                  ? "border border-gold-400/30 bg-gold-400/10 text-gold-300"
                  : "border border-white/[0.06] bg-white/[0.02] text-dark-400 hover:border-white/[0.1] hover:text-dark-200"
              }`}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {/* Line Items */}
      <div className="mt-8 space-y-1">
        {lineItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-white/[0.02]"
          >
            <div>
              <span className="text-[13px] font-medium text-dark-200">{item.label}</span>
              <span className="ml-3 text-[11px] text-dark-500">{item.detail}</span>
            </div>
            <span className={`font-serif text-[15px] ${item.value === 0 ? "text-emerald-400" : "text-white"}`}>
              {item.value === 0 ? "Included" : fmt(item.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="my-4 border-t border-white/[0.06]" />

      {/* Total */}
      <div className="flex items-center justify-between rounded-2xl border border-gold-400/10 bg-gold-400/[0.04] px-6 py-5">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-500">
            Estimated Total
          </span>
          <p className="mt-0.5 text-[11px] text-dark-500">{days}-day trip for 1 person</p>
        </div>
        <span className="font-serif text-3xl font-light text-gold-300">{fmt(costs.total)}</span>
      </div>

      {/* Disclaimer */}
      <p className="mt-6 text-[11px] leading-relaxed text-dark-600">
        Estimates based on typical costs from the US. Actual prices vary by origin, season, and booking.
      </p>
    </div>
  );
}
