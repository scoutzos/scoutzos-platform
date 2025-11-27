"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Investor = {
  id: string;
  created_at: string;
  name: string;
  email: string | null;
  phone: string | null;
};

export default function InvestorsPage() {
  // Basic investor info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Preference fields (kept as strings for inputs, converted on submit)
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [preferredCity, setPreferredCity] = useState("");
  const [propertyType, setPropertyType] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [investors, setInvestors] = useState<Investor[]>([]);

  // Load the latest investors so you can see what's in the table
  async function loadInvestors() {
    const { data, error } = await supabase
      .from("investors")
      .select("id, created_at, name, email, phone")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setInvestors(data);
    }
  }

  useEffect(() => {
    loadInvestors();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    try {
      setLoading(true);

      // 1) Insert investor
      const { data: investor, error: investorError } = await supabase
        .from("investors")
        .insert({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
        })
        .select("*")
        .single();

      if (investorError || !investor) {
        setError(investorError?.message || "Failed to save investor.");
        return;
      }

      // 2) Insert preferences linked to this investor
      const { error: prefError } = await supabase
        .from("investor_preferences")
        .insert({
          investor_id: investor.id,
          min_price: minPrice.trim() ? Number(minPrice.trim()) : null,
          max_price: maxPrice.trim() ? Number(maxPrice.trim()) : null,
          bedrooms: bedrooms.trim() ? Number(bedrooms.trim()) : null,
          bathrooms: bathrooms.trim() ? Number(bathrooms.trim()) : null,
          preferred_city: preferredCity.trim() || null,
          property_type: propertyType.trim() || null,
        });

      if (prefError) {
        // Investor is saved, but preferences failed. You want to know that.
        setError(
          `Investor saved, but preferences failed: ${prefError.message}`
        );
      } else {
        setSuccess("Investor and preferences saved.");
      }

      // Reset basic info
      setName("");
      setEmail("");
      setPhone("");

      // Reset preferences
      setMinPrice("");
      setMaxPrice("");
      setBedrooms("");
      setBathrooms("");
      setPreferredCity("");
      setPropertyType("");

      // Add the new investor to the top of the list
      setInvestors((prev) => [investor as Investor, ...prev]);
    } catch (err: any) {
      setError(err?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "40px auto",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Investor Intake</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: 20,
          borderRadius: 8,
          border: "1px solid #ddd",
          marginBottom: 30,
        }}
      >
        {/* Basic info */}
        <div style={{ fontWeight: 600 }}>Investor details</div>

        <label>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>Name *</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
            placeholder="Investor name"
          />
        </label>

        <label>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>Email</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
            placeholder="investor@example.com"
          />
        </label>

        <label>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>Phone</div>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
            placeholder="555-555-5555"
          />
        </label>

        {/* Investment preferences */}
        <hr style={{ margin: "12px 0" }} />

        <div style={{ fontWeight: 600 }}>Investment criteria</div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <label>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Min price</div>
            <input
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
              placeholder="150000"
            />
          </label>

          <label>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Max price</div>
            <input
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
              placeholder="400000"
            />
          </label>

          <label>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Bedrooms</div>
            <input
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
              placeholder="3"
            />
          </label>

          <label>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Bathrooms</div>
            <input
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
              placeholder="2"
            />
          </label>
        </div>

        <label>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            Preferred city / market
          </div>
          <input
            value={preferredCity}
            onChange={(e) => setPreferredCity(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
            placeholder="Atlanta, New Braunfels, etc."
          />
        </label>

        <label>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            Property type focus
          </div>
          <input
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
            placeholder="SFR, BTR, townhomes, small multifamily, etc."
          />
        </label>

        {error && (
          <div style={{ color: "red", fontSize: 14 }}>
            Error: {String(error)}
          </div>
        )}

        {success && (
          <div style={{ color: "green", fontSize: 14 }}>{success}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 8,
            padding: "10px 14px",
            borderRadius: 4,
            border: "none",
            background: loading ? "#888" : "#111827",
            color: "#fff",
            fontWeight: 500,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Saving..." : "Save Investor"}
        </button>
      </form>

      <h2 style={{ fontSize: 20, marginBottom: 10 }}>Recent investors</h2>
      <pre
        style={{
          background: "#f5f5f5",
          padding: 16,
          borderRadius: 8,
          fontSize: 13,
          overflowX: "auto",
        }}
      >
        {JSON.stringify(investors, null, 2)}
      </pre>
    </div>
  );
}
