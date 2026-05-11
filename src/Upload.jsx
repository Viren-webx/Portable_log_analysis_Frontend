import { useState, useEffect } from "react";
import axios from "axios";

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);


export default function Upload() {

  const [mode, setMode] = useState("upload");

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("all");
  const [showChart, setShowChart] = useState(false);

  const [limit, setLimit] = useState(10);
  const [showAllIPs, setShowAllIPs] = useState(false);

  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc");

  const [liveLogs, setLiveLogs] = useState([]);
  const [liveStats, setLiveStats] = useState({});

  // 🔥 SOC PANEL
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [classification, setClassification] = useState("");
  const [reason, setReason] = useState("");

  const formatIP = (ip) => {
    if (!ip) return "";
    const parts = ip.split(".");
    return parts.length === 4 ? `${parts[0]}..${parts[3]}` : ip;
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    if (!f.name.endsWith(".log") && !f.name.endsWith(".txt")) {
      setError("Upload valid file");
      return;
    }

    setError("");
    setFile(f);
  };

  const uploadFile = async () => {

    if (!file) {
      setError("Select file first");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("https://portable-log-analysis-backend.onrender.com/analyze", formData);
      setResult(res.data);
    } catch {
      setError("Server error");
    }

    setLoading(false);
  };


  // ================= DATA =================

  const alerts = result?.alerts || [];
  let ipStats = result?.ip_statistics || [];

  const totalFailed = ipStats.reduce((s, i) => s + i.failed_attempts, 0);
  const totalSuccess = ipStats.reduce((s, i) => s + i.successful_attempts, 0);

  if (filter === "failed") {
    ipStats = ipStats.filter(i => i.failed_attempts > 0);
  }

  if (filter === "success") {
    ipStats = ipStats.filter(i => i.successful_attempts > 0);
  }

  if (sortField) {
    ipStats.sort((a, b) =>
      sortOrder === "asc"
        ? a[sortField] - b[sortField]
        : b[sortField] - a[sortField]
    );
  }

  const limitedStats = ipStats.slice(0, limit);
  const displayStats = showAllIPs ? ipStats : limitedStats;

  // ✅ TITLE FIX
  let tableTitle = "All IP Activity";
  if (filter === "failed") tableTitle = "Failed Attempts";
  if (filter === "success") tableTitle = "Successful Attempts";

  // CHART
  const chartData = {
    labels: limitedStats.map(ip => formatIP(ip.ip)),
    datasets: [
      {
        label: "Failed",
        data: limitedStats.map(ip => ip.failed_attempts),
        backgroundColor: "rgba(239,68,68,0.7)"
      },
      {
        label: "Success",
        data: limitedStats.map(ip => ip.successful_attempts),
        backgroundColor: "rgba(34,197,94,0.7)"
      }
    ]
  };

  const chartOptions = {
    plugins: {
      legend: { labels: { color: "#fff" } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const d = limitedStats[ctx.dataIndex];
            return [
              `IP: ${d.ip}`,
              `Failed: ${d.failed_attempts}`,
              `Success: ${d.successful_attempts}`
            ];
          }
        }
      }
    },
    scales: {
      x: { ticks: { color: "#ccc" } },
      y: { ticks: { color: "#ccc" } }
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const liveIpList = Object.entries(liveStats).map(([ip, val]) => ({
  ip,
  failed: val.failed,
  success: val.success
})).sort((a, b) => b.failed - a.failed).slice(0, 10);

  // ================= UI =================
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-black p-10">

      <h1 className="text-4xl text-blue-200 text-center mb-10 font-bold">
        AirGap Log Analyzer
      </h1>

      {/* MODE */}
      <div className="flex justify-center gap-6 mb-8">
        <button onClick={()=>setMode("upload")}
          className={`px-6 py-2 rounded ${mode==="upload"?"bg-blue-600":"bg-gray-800"}`}>
          Upload
        </button>

      </div>

      {/* ================= UPLOAD ================= */}
      {mode==="upload" && (
        <>
          <div className="flex justify-between mb-10 bg-gray-900 p-6 rounded-xl">
            <input type="file" onChange={handleFileChange} className="text-white"/>
            <button onClick={uploadFile} className="bg-blue-600 px-6 py-2 text-white rounded">
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>

          {result && (
            <>
              {/* STATS */}
              <div className="grid grid-cols-4 gap-4 mb-6 text-white">
                <div onClick={()=>setFilter("all")} className="bg-gray-800 p-4 rounded cursor-pointer">
                  Total: {result.total_logs}
                </div>

                <div className="bg-gray-800 p-4 rounded">
                  Parsed: {result.parsed_logs}
                </div>

                <div onClick={()=>setFilter("failed")} className="bg-gray-800 p-4 rounded cursor-pointer">
                  Failed: {totalFailed}
                </div>

                <div onClick={()=>setFilter("success")} className="bg-gray-800 p-4 rounded cursor-pointer">
                  Success: {totalSuccess}
                </div>
              </div>

              {/* CHART */}
              <button onClick={()=>setShowChart(!showChart)}
                className="bg-purple-600 px-4 py-2 text-white rounded mb-4">
                {showChart ? "Back" : "View Chart"}
              </button>

              {showChart ? (
                <div className="bg-gray-900 p-6 rounded mb-6">
                  <Bar data={chartData} options={chartOptions}/>
                </div>
              ) : (
                <div className="mb-6">
                  <h2 className="text-white mb-2">🔴 Security Alerts</h2>

                  <div className="max-h-60 overflow-y-auto border border-gray-700">
                    <table className="w-full text-white text-sm">
                      <thead className="bg-gray-800 sticky top-0">
                        <tr>
                          <th>#</th>
                          <th>IP</th>
                          <th>Attack</th>
                          <th>Attempts</th>
                          <th>Severity</th>
                        </tr>
                      </thead>

                      <tbody>
                        {alerts.map((a,i)=>(
                          <tr key={i}
                            onClick={()=>setSelectedAlert(a)}
                            className="text-center border-t cursor-pointer hover:bg-gray-700">
                            <td>{i+1}</td>
                            <td>{a.source_ip}</td>
                            <td>{a.attack_type}</td>
                            <td>{a.attempts}</td>
                            <td className="text-red-400">{a.severity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 🔥 SOC PANEL */}
              {selectedAlert && (
                <div className="bg-gray-900 p-6 rounded mb-6 border border-gray-700">

                  <h3 className="text-white mb-3">🚨 Alert Investigation</h3>

                  <p className="text-white mb-2">
                    IP: {selectedAlert.source_ip}
                  </p>

                  <select
                    value={classification}
                    onChange={(e)=>setClassification(e.target.value)}
                    className="bg-gray-800 text-white p-2 mb-3 w-full">
                    <option value="">Select Classification</option>
                    <option value="TP">True Positive</option>
                    <option value="FP">False Positive</option>
                    <option value="Suspicious">Suspicious</option>
                  </select>

                  <textarea
                    placeholder="Reason / Description"
                    value={reason}
                    onChange={(e)=>setReason(e.target.value)}
                    className="w-full bg-gray-800 text-white p-3 mb-3"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={()=>{
                        alert("Saved Successfully ✅");
                        setSelectedAlert(null);
                      }}
                      className="bg-blue-600 px-4 py-1 text-white">
                      Save
                    </button>

                    <button
                      onClick={()=>{
                        if (classification === "TP") {
                          alert("Escalated to L2 🚀");
                        } else {
                          alert("Mark as TP to escalate");
                        }
                      }}
                      className="bg-red-600 px-4 py-1 text-white">
                      Escalate
                    </button>

                    <button
                      onClick={()=>setSelectedAlert(null)}
                      className="bg-gray-600 px-4 py-1 text-white">
                      Close
                    </button>
                  </div>

                </div>
              )}

              {/* ✅ TITLE FIXED */}
              <h2 className="text-white mb-2">{tableTitle}</h2>

              {/* OPTIONS */}
              <div className="flex justify-between text-white mb-2">

                <div>
                  Show Top:
                  <select
                    value={limit}
                    onChange={(e)=>setLimit(Number(e.target.value))}
                    className="ml-2 bg-gray-800 p-1">
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <button
                  onClick={()=>setShowAllIPs(!showAllIPs)}
                  className="bg-gray-700 px-3 py-1 rounded">
                  {showAllIPs ? "Show Top" : "View All IPs"}
                </button>

              </div>

              {/* IP TABLE */}
              <div className="max-h-80 overflow-y-auto border border-gray-700">
                <table className="w-full text-white text-lg">
                  <thead className="bg-gray-800 sticky top-0 cursor-pointer">
                    <tr>
                      <th>#</th>
                      <th>IP</th>
                      <th onClick={()=>handleSort("failed_attempts")}>Failed ⬍</th>
                      <th onClick={()=>handleSort("successful_attempts")}>Success ⬍</th>
                    </tr>
                  </thead>

                  <tbody>
                    {displayStats.map((ip,i)=>(
                      <tr key={i} className="text-center border-t">
                        <td>{i+1}</td>
                        <td>{ip.ip}</td>
                        <td>{ip.failed_attempts}</td>
                        <td>{ip.successful_attempts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </>
          )}
        </>
      )}


    




    </div>
  );
}
