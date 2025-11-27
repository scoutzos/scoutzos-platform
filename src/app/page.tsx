import { supabase } from "../lib/supabaseClient";

export default async function Home() {
  // Test query to confirm Supabase connection
  const { data, error } = await supabase
    .from("investors")
    .select("*")
    .limit(10);

  return (
    <div style={{ padding: 40 }}>
      <h1>ScoutzOS Supabase Test</h1>

      {error && (
        <p style={{ color: "red" }}>
          Error: {error.message}
        </p>
      )}

      <pre style={{ background: "#efefef", padding: 20 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
