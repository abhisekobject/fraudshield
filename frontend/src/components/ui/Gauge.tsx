"use client";

import React, { useEffect, useState, useRef } from"react";
import { animate } from"animejs";

interface GaugeProps {
 value: number;
 color?: string;
 showLabels?: boolean;
 min?: string;
 max?: string;
}

export function Gauge({
 value,
 color ="#3b82f6",
 showLabels = false,
 min,
 max,
}: GaugeProps) {
 const [currentVal, setCurrentVal] = useState(0);
 const animRef = useRef<{ val: number }>({ val: 0 });

 useEffect(() => {
 // Respect prefers-reduced-motion
 if (typeof window !=="undefined") {
 const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 if (prefersReduced) {
 setCurrentVal(value);
 return;
 }
 }

 animRef.current.val = 0;
 const anim = animate(animRef.current, {
 val: value,
 duration: 1400,
 ease:"outCubic",
 onUpdate: () => {
 setCurrentVal(Math.round(animRef.current.val));
 },
 });

 return () => {
 try {
 if (anim && typeof anim.pause ==="function") anim.pause();
 } catch {
 // cleanup safe
 }
 };
 }, [value]);

 const totalTicks = 40;
 const activeTicks = Math.round((currentVal / 100) * totalTicks);
 const cx = 100;
 const cy = 100;
 const r = 80;
 const tickLength = 10;

 const ticks = Array.from({ length: totalTicks }, (_, i) => {
 // Sweep from π (left) to 2π (right) — a 180° arc
 const angle = Math.PI + (i / (totalTicks - 1)) * Math.PI;
 const x1 = cx + (r - tickLength) * Math.cos(angle);
 const y1 = cy + (r - tickLength) * Math.sin(angle);
 const x2 = cx + r * Math.cos(angle);
 const y2 = cy + r * Math.sin(angle);
 const isActive = i < activeTicks;

 return (
 <line
 key={i}
 x1={x1}
 y1={y1}
 x2={x2}
 y2={y2}
 stroke={isActive ? color :"rgba(255, 255, 255, 0.10)"}
 strokeWidth={2.5}
 strokeLinecap="round"
 style={{
 transition:"stroke 0.2s ease",
 filter: isActive ?`drop-(0 0 3px ${color})`: undefined,
 }}
 />
 );
 });

 return (
 <div style={{ display:"flex", flexDirection:"column", alignItems:"center"}}>
 <svg
 viewBox="0 0 200 120"
 style={{ maxWidth: 260, width:"100%"}}
 xmlns="http://www.w3.org/2000/svg"
 >
 {ticks}
 <text
 x={100}
 y={105}
 textAnchor="middle"
 style={{
 fontSize: 24,
 fontWeight: 700,
 fill:"#ffffff",
 fontFamily:"IBM Plex Mono, monospace",
 filter:"drop-(0 0 8px rgba(59, 130, 246, 0.3))",
 }}
 >
 {currentVal}%
 </text>
 </svg>
 {showLabels && min && max && (
 <div
 style={{
 display:"flex",
 justifyContent:"space-between",
 width:"100%",
 maxWidth: 260,
 fontSize: 11,
 color:"#94a3b8",
 marginTop: -4,
 fontFamily:"IBM Plex Mono, monospace",
 }}
 >
 <span>{min}</span>
 <span>{max}</span>
 </div>
 )}
 </div>
 );
}
