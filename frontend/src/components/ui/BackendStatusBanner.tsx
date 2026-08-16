"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

export function BackendStatusBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const checkHealth = async () => {
      try {
        const res = await fetch("http://localhost:8000/health");
        if (!res.ok) throw new Error("Offline");
        if (mounted) setIsOffline(false);
      } catch {
        if (mounted) setIsOffline(true);
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

  if (!isOffline) return null;

  return (
    <div className="bg-red-500 text-white px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 shadow-sm z-50 sticky top-0">
      <AlertCircle className="w-4 h-4" />
      <span>FraudShield backend is currently unavailable. Ensure the FastAPI server is running on port 8000.</span>
    </div>
  );
}
