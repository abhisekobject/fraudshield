"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

export function BackendStatusBanner() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    let mounted = true;
    
    const checkHealth = async () => {
      try {
        const res = await fetch("http://localhost:8000/health");
        if (!res.ok) throw new Error("Offline");
        if (mounted) setStatus("online");
      } catch {
        if (mounted) setStatus("offline");
      }
    };

    // Check immediately, then every 5 seconds
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (status === "online") return null;

  if (status === "checking") {
    return (
      <div className="bg-risk-medium-bg border-b border-risk-medium/20 text-risk-medium px-4 py-1.5 text-xs font-medium flex items-center justify-center gap-2 shadow-sm z-50 sticky top-0">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Checking backend status...</span>
      </div>
    );
  }

  return (
    <div className="bg-red-900 border-b border-red-500 text-white px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 shadow-sm z-50 sticky top-0">
      <AlertCircle className="w-4 h-4 text-red-400" />
      <span>⚠ Backend offline — ensure FastAPI is running on port 8000</span>
    </div>
  );
}
