// src/app/matches/page.tsx
"use client";

import React, { useState } from "react";
import type { Deal } from "@/lib/dealMatches";
import { getDealsForInvestor } from "@/lib/dealMatches";

export default function MatchesPage() {
  const [investorId, setInvestorId] = useState("");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRunMatch() {
    setError(null);
    setDeals([]);

    const trimmedId = investorId.trim();
    if (!trimmedId) {
      setError("Please paste an investor ID.");
      return;
    }

    try {
      setLoading(true);
      const result = await getDealsForInvestor(trimmedId);

      if (result.error) {
        setError(result.error);
        setDeals([]);
      } else {
        setDeals(result.deals);
      }
    } catch (err: any) {
      setError(err?.message || "Unexpected error while matching deals.");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <h1 style={{ fontSize: 32, marginBottom: 24 }}>Deal Matches (v1)</h1>

      {/* Input + button */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
            Investor ID (paste existing ID from Supabase)
          </div>
          <input
            value={investorId}
            onChange={(e) => setInvestorId(e.target.value)}
            placeholder="e.g. 96c98577-7885-4d3b-92ab-c8787708ad68"
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 4,
              border: "1px solid #d1d5db",
              fontSize: 14,
            }}
          />
        </div>

        <button
          onClick={handleRunMatch}
          disabled={loading}
          style={{
            padding: "10px 18px",
            borderRadius: 6,
            border: "none",
            cursor: loading ? "default" : "pointer",
            background: "#111827",
            color: "#fff",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Matching…" : "Run Match"}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div style={{ color: "#b91c1c", marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      <h2 style={{ fontSize: 20, marginBottom: 8 }}>Matched deals</h2>

      {/* Deals table / empty state */}
      {deals.length === 0 ? (
        <div style={{ fontSize: 14, color: "#4b5563" }}>
          No deals loaded yet. Enter an investor ID and click &ldquo;Run Match&rdquo;.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              fontSize: 14,
              marginTop: 8,
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Address</th>
                <th style={thStyle}>City</th>
                <th style={thStyle}>State</th>
                <th style={thStyle}>List Price</th>
                <th style={thStyle}>Rent Estimate</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal.id}>
                  <td style={tdStyle}>{deal.address}</td>
                  <td style={tdStyle}>{deal.city ?? "—"}</td>
                  <td style={tdStyle}>{deal.state ?? "—"}</td>
                  <td style={tdStyle}>
                    {typeof deal.list_price === "number"
                      ? `$${deal.list_price.toLocaleString()}`
                      : "—"}
                  </td>
                  <td style={tdStyle}>
                    {deal.rent_estimate != null
                      ? `$${deal.rent_estimate.toLocaleString()}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 500,
};

const tdStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #f3f4f6",
};
