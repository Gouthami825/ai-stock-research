import { useState, useEffect } from "react";

const STEPS = [
  "Fetching stock data...",
  "Analyzing key metrics...",
  "Generating research report...",
  "Finalizing...",
];

function App() {
  const [stock, setStock] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"analyze" | "history">("analyze");
  const [reports, setReports] = useState<string[]>([]);

  const fetchReports = async () => {
    try {
      const res = await fetch("https://ai-stock-research-kfay.onrender.com/reports");
      const data = await res.json();
      setReports(data.reports);
    } catch (e) {
      setReports([]);
    }
  };

  useEffect(() => {
    if (tab === "history") fetchReports();
  }, [tab]);

  const analyze = async () => {
    if (!stock) return;
    setLoading(true);
    setResult(null);
    setError("");
    setStep(0);

    const interval = setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 3000);

    try {
      const res = await fetch("https://ai-stock-research-kfay.onrender.com/reports");
      const data = await res.json();
      clearInterval(interval);
      if (data.status === "success") {
        setResult(data);
      } else {
        setError(data.message);
      }
    } catch (e) {
      clearInterval(interval);
      setError("Could not connect to backend.");
    }
    setLoading(false);
  };

  const formatReport = (text: string) => {
    return text.split("\n").map((line: string, i: number) => {
      const clean = line.replace(/\*\*/g, "");
      if (clean.trim() === "") return <br key={i} />;
      if (
        clean.includes("Executive Summary") ||
        clean.includes("Key Metrics") ||
        clean.includes("Risk Factors") ||
        clean.includes("Analyst Verdict") ||
        clean.includes("Investment Research Report")
      ) {
        return (
          <p key={i} style={{ color: "#00d4aa", fontWeight: 700, marginTop: 16, marginBottom: 4 }}>
            {clean}
          </p>
        );
      }
      return (
        <p key={i} style={{ margin: "4px 0", color: "#ccc", lineHeight: 1.8 }}>
          {clean}
        </p>
      );
    });
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.logo}>⚡ StockMind AI</h1>
        <p style={styles.tagline}>AI-Powered Stock Research — Indian Markets</p>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(tab === "analyze" ? styles.tabActive : {}) }}
          onClick={() => setTab("analyze")}
        >
          🔍 Analyze Stock
        </button>
        <button
          style={{ ...styles.tab, ...(tab === "history" ? styles.tabActive : {}) }}
          onClick={() => setTab("history")}
        >
          📁 Past Reports
        </button>
      </div>

      {/* Analyze Tab */}
      {tab === "analyze" && (
        <>
          <div style={styles.searchBox}>
            <input
              style={styles.input}
              placeholder="Enter NSE stock symbol (e.g. INFY, RELIANCE, TCS)"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyze()}
            />
            <button style={styles.button} onClick={analyze} disabled={loading}>
              {loading ? "Analyzing..." : "Analyze →"}
            </button>
          </div>

          {loading && (
            <div style={styles.stepsBox}>
              {STEPS.map((s, i) => (
                <div key={i} style={styles.stepRow}>
                  <span style={{ marginRight: 10 }}>
                    {i < step ? "✅" : i === step ? "⏳" : "⬜"}
                  </span>
                  <span style={{ color: i <= step ? "#00d4aa" : "#666" }}>{s}</span>
                </div>
              ))}
            </div>
          )}

          {error && <div style={styles.error}>{error}</div>}

          {result && (
            <div style={styles.resultBox}>
              <div style={styles.infoBar}>
                <div>
                  <div style={styles.stockName}>{result.stock.name}</div>
                  <div style={styles.stockSector}>{result.stock.sector}</div>
                </div>
                <div style={styles.priceBox}>
                  <div style={styles.price}>₹{result.stock.price}</div>
                  <div style={styles.stockSector}>Current Price</div>
                </div>
              </div>

              <div style={styles.metricsRow}>
                <div style={styles.metric}>
                  <div style={styles.metricLabel}>52W High</div>
                  <div style={styles.metricValue}>₹{result.stock["52w_high"]}</div>
                </div>
                <div style={styles.metric}>
                  <div style={styles.metricLabel}>52W Low</div>
                  <div style={styles.metricValue}>₹{result.stock["52w_low"]}</div>
                </div>
                <div style={styles.metric}>
                  <div style={styles.metricLabel}>P/E Ratio</div>
                  <div style={styles.metricValue}>
                    {Number(result.stock.pe_ratio).toFixed(2)}
                  </div>
                </div>
                <div style={styles.metric}>
                  <div style={styles.metricLabel}>Market Cap</div>
                  <div style={styles.metricValue}>
                    ₹{(result.stock.market_cap / 1e12).toFixed(2)}T
                  </div>
                </div>
              </div>

              <div style={styles.reportBox}>
                <div style={styles.reportTitle}>🤖 AI Research Report</div>
                <div style={{ fontSize: 14 }}>{formatReport(result.report)}</div>
              </div>

              <div style={styles.savedNote}>
                💾 Report saved to: {result.saved_to}
              </div>
            </div>
          )}
        </>
      )}

      {/* History Tab */}
      {tab === "history" && (
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <button
            onClick={fetchReports}
            style={{ ...styles.button, marginBottom: 20, fontSize: 14, padding: "10px 20px" }}
          >
            🔄 Refresh
          </button>
          {reports.length === 0 ? (
            <div style={styles.emptyState}>No reports generated yet.</div>
          ) : (
            reports.map((file, i) => {
              const parts = file.replace(".json", "").split("_");
              const symbol = parts[0];
              const date = parts[1];
              const time = parts[2];
              const formatted = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)} ${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`;
              return (
                <div key={i} style={styles.reportCard}>
                  <div>
                    <div style={styles.reportCardSymbol}>{symbol}</div>
                    <div style={styles.reportCardTime}>{formatted}</div>
                  </div>
                  <div style={styles.reportCardBadge}>✅ Completed</div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0f",
    color: "#ffffff",
    fontFamily: "'Segoe UI', sans-serif",
    padding: "40px 20px",
  },
  header: { textAlign: "center", marginBottom: 30 },
  logo: { fontSize: 42, fontWeight: 700, color: "#00d4aa", margin: 0 },
  tagline: { color: "#888", marginTop: 8 },
  tabs: {
    display: "flex",
    gap: 12,
    maxWidth: 700,
    margin: "0 auto 30px",
  },
  tab: {
    flex: 1,
    padding: "12px 20px",
    borderRadius: 10,
    border: "1px solid #333",
    background: "#12121a",
    color: "#888",
    fontSize: 15,
    cursor: "pointer",
    fontWeight: 500,
  },
  tabActive: {
    background: "#00d4aa22",
    color: "#00d4aa",
    border: "1px solid #00d4aa55",
  },
  searchBox: {
    display: "flex",
    gap: 12,
    maxWidth: 700,
    margin: "0 auto 40px",
  },
  input: {
    flex: 1,
    padding: "14px 18px",
    borderRadius: 10,
    border: "1px solid #333",
    background: "#12121a",
    color: "#fff",
    fontSize: 16,
    outline: "none",
  },
  button: {
    padding: "14px 28px",
    borderRadius: 10,
    border: "none",
    background: "#00d4aa",
    color: "#000",
    fontWeight: 700,
    fontSize: 16,
    cursor: "pointer",
  },
  stepsBox: {
    maxWidth: 700,
    margin: "0 auto 30px",
    background: "#12121a",
    borderRadius: 12,
    padding: 24,
  },
  stepRow: { display: "flex", alignItems: "center", marginBottom: 12 },
  error: {
    maxWidth: 700,
    margin: "0 auto",
    background: "#2a1010",
    color: "#ff6b6b",
    padding: 16,
    borderRadius: 10,
  },
  resultBox: {
    maxWidth: 700,
    margin: "0 auto",
    background: "#12121a",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid #222",
  },
  infoBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 28px",
    borderBottom: "1px solid #222",
  },
  stockName: { fontSize: 22, fontWeight: 700 },
  stockSector: { color: "#888", marginTop: 4, fontSize: 13 },
  priceBox: { textAlign: "right" },
  price: { fontSize: 28, fontWeight: 700, color: "#00d4aa" },
  metricsRow: {
    display: "flex",
    justifyContent: "space-around",
    padding: "20px 28px",
    borderBottom: "1px solid #222",
    background: "#0e0e18",
  },
  metric: { textAlign: "center" },
  metricLabel: { color: "#888", fontSize: 12, marginBottom: 6 },
  metricValue: { fontSize: 18, fontWeight: 600 },
  reportBox: { padding: 28 },
  reportTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 16,
    color: "#00d4aa",
  },
  savedNote: {
    padding: "12px 28px",
    background: "#0a0a0f",
    color: "#555",
    fontSize: 12,
  },
  emptyState: {
    textAlign: "center",
    color: "#555",
    padding: 60,
    fontSize: 16,
  },
  reportCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#12121a",
    border: "1px solid #222",
    borderRadius: 12,
    padding: "18px 24px",
    marginBottom: 12,
  },
  reportCardSymbol: { fontSize: 18, fontWeight: 700, color: "#00d4aa" },
  reportCardTime: { color: "#666", fontSize: 13, marginTop: 4 },
  reportCardBadge: {
    background: "#00d4aa22",
    color: "#00d4aa",
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: 13,
  },
};

export default App;