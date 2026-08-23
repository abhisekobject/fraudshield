"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from"react";
import { usePathname } from"next/navigation";
import { animate } from"animejs";

// Node definition in the cybersecurity pipeline
interface NetworkNode {
 id: string;
 name: string;
 code: string;
 x: number; // 0 - 1920
 y: number; // 0 - 1080
 baseRadius: number;
 stage:"ingest"|"rules"|"behavior"|"ai"|"threat"|"action";
 color: string;
 threatLevel?:"low"|"medium"|"high"|"critical";
}

interface NetworkConnection {
 from: string;
 to: string;
 type:"primary"|"secondary"|"feedback";
}

// 14 Strategic nodes representing the real-time fraud defense pipeline
const PIPELINE_NODES: NetworkNode[] = [
 // 1. Transaction Ingestion & Identity
 { id:"n1", name:"UPI Ingress Gateway", code:"INGRESS_01", x: 180, y: 220, baseRadius: 4.5, stage:"ingest", color:"#38bdf8"},
 { id:"n2", name:"Device Fingerprint & SIM", code:"AUTH_DEVICE", x: 300, y: 440, baseRadius: 4, stage:"ingest", color:"#38bdf8"},
 { id:"n3", name:"Geo & Velocity Matrix", code:"GEO_VELOCITY", x: 220, y: 760, baseRadius: 4, stage:"ingest", color:"#38bdf8"},

 // 2. Rules & Behavioral Signal Engine
 { id:"n4", name:"Rule Engine (Deterministic)", code:"RULES_EXEC", x: 520, y: 280, baseRadius: 5, stage:"rules", color:"#60a5fa"},
 { id:"n5", name:"Mule Account Graph", code:"GRAPH_INTEL", x: 620, y: 580, baseRadius: 4.5, stage:"behavior", color:"#818cf8"},
 { id:"n6", name:"Behavioral Biometrics", code:"BEHAVIOR_BIO", x: 740, y: 190, baseRadius: 4, stage:"behavior", color:"#818cf8"},
 { id:"n7", name:"State Vector Cache", code:"CACHE_STATE", x: 500, y: 880, baseRadius: 3.5, stage:"behavior", color:"#60a5fa"},

 // 3. AI / NLP / ML Inference
 { id:"n8", name:"Voice NLP Classifier", code:"NLP_INTERACT", x: 980, y: 340, baseRadius: 5, stage:"ai", color:"#38bdf8"},
 { id:"n9", name:"XGBoost Fraud Model", code:"ML_INFERENCE", x: 1120, y: 640, baseRadius: 5, stage:"ai", color:"#a855f7"},
 { id:"n10", name:"Anomaly Vector Fusion", code:"VECTOR_FUSION", x: 1260, y: 260, baseRadius: 4.5, stage:"ai", color:"#a855f7"},

 // 4. Threat Evaluation & Multi-Signal Shield
 { id:"n11", name:"Multi-Signal Risk Core", code:"RISK_EVAL", x: 1420, y: 480, baseRadius: 6, stage:"threat", color:"#f97316"},
 { id:"n12", name:"Step-Up Verification", code:"STEP_UP_AUTH", x: 1620, y: 280, baseRadius: 4.5, stage:"action", color:"#38bdf8"},
 { id:"n13", name:"Autonomous Mitigation", code:"AUTO_BLOCK", x: 1720, y: 680, baseRadius: 5, stage:"action", color:"#ef4444"},
 { id:"n14", name:"Analyst Feedback Loop", code:"ANALYST_LOOP", x: 1480, y: 860, baseRadius: 4, stage:"action", color:"#34d399"},
];

const PIPELINE_CONNECTIONS: NetworkConnection[] = [
 // Ingress to rules & behavioral
 { from:"n1", to:"n4", type:"primary"},
 { from:"n1", to:"n2", type:"secondary"},
 { from:"n2", to:"n4", type:"primary"},
 { from:"n2", to:"n5", type:"secondary"},
 { from:"n3", to:"n5", type:"primary"},
 { from:"n3", to:"n7", type:"secondary"},

 // Rules / Behavior to AI
 { from:"n4", to:"n6", type:"secondary"},
 { from:"n4", to:"n8", type:"primary"},
 { from:"n5", to:"n9", type:"primary"},
 { from:"n6", to:"n8", type:"secondary"},
 { from:"n7", to:"n5", type:"secondary"},

 // AI to Risk Core
 { from:"n8", to:"n10", type:"primary"},
 { from:"n8", to:"n11", type:"primary"},
 { from:"n9", to:"n11", type:"primary"},
 { from:"n10", to:"n11", type:"primary"},

 // Risk Core to Action & Feedback
 { from:"n11", to:"n12", type:"primary"},
 { from:"n11", to:"n13", type:"primary"},
 { from:"n11", to:"n14", type:"secondary"},
 { from:"n14", to:"n9", type:"feedback"},
 { from:"n14", to:"n4", type:"feedback"},
];

// Active pulse paths for traveling data particles
const PULSE_ROUTES = [
 ["n1","n4","n8","n11","n13"],
 ["n2","n5","n9","n11","n12"],
 ["n3","n5","n11","n14","n9"],
 ["n6","n8","n10","n11"],
];

export function CyberThreatNetwork() {
 const pathname = usePathname();
 const svgRef = useRef<SVGSVGElement>(null);
 const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
 const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

 // Map nodes by ID for fast coordinate lookup
 const nodeMap = useMemo(() => {
 const map = new Map<string, NetworkNode>();
 PIPELINE_NODES.forEach((n) => map.set(n.id, n));
 return map;
 }, []);

 // Determine current active risk theme based on page or default state
 const riskTheme = useMemo<"low"|"medium"|"high"|"critical"|"neutral">(() => {
 if (pathname ==="/interaction") return"medium";
 if (pathname ==="/analyst") return"high";
 if (pathname ==="/payment") return"neutral";
 return"low"; // Dashboard default
 }, [pathname]);

 // Track mouse coordinates over SVG for subtle proximity interaction
 const handlePointerMove = useCallback((e: MouseEvent) => {
 if (!svgRef.current) return;
 const rect = svgRef.current.getBoundingClientRect();
 if (rect.width === 0 || rect.height === 0) return;

 // Convert client coordinates to 1920x1080 viewBox space
 const x = ((e.clientX - rect.left) / rect.width) * 1920;
 const y = ((e.clientY - rect.top) / rect.height) * 1080;
 setMousePos({ x, y });

 // Check if mouse is near any node (within 140 viewBox units)
 let closestId: string | null = null;
 let minDistance = 140;

 for (const node of PIPELINE_NODES) {
 const dx = node.x - x;
 const dy = node.y - y;
 const dist = Math.hypot(dx, dy);
 if (dist < minDistance) {
 minDistance = dist;
 closestId = node.id;
 }
 }
 setHoveredNodeId(closestId);
 }, []);

 const handlePointerLeave = useCallback(() => {
 setMousePos(null);
 setHoveredNodeId(null);
 }, []);

 useEffect(() => {
 window.addEventListener("pointermove", handlePointerMove, { passive: true });
 window.addEventListener("pointerleave", handlePointerLeave, { passive: true });
 return () => {
 window.removeEventListener("pointermove", handlePointerMove);
 window.removeEventListener("pointerleave", handlePointerLeave);
 };
 }, [handlePointerMove, handlePointerLeave]);

 // Anime.js Node Breathing & Traveling Pulses
 useEffect(() => {
 if (!svgRef.current) return;

 // Check prefers-reduced-motion
 const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 if (prefersReduced) return;

 const animations: any[] = [];

 // 1. Subtle breathing pulse on individual nodes
 PIPELINE_NODES.forEach((node, i) => {
 const el = svgRef.current?.querySelector(`#node-circle-${node.id}`);
 const halo = svgRef.current?.querySelector(`#node-halo-${node.id}`);

 if (el) {
 const anim = animate(el, {
 scale: [0.9, 1.2, 0.9],
 opacity: [0.45, 0.95, 0.45],
 duration: 2200 + (i % 6) * 350,
 delay: (i * 180) % 900,
 loop: true,
 ease:"inOutSine",
 });
 animations.push(anim);
 }

 if (halo) {
 const haloAnim = animate(halo, {
 scale: [0.7, 1.6, 0.7],
 opacity: [0.6, 0, 0.6],
 duration: 2400 + (i % 5) * 400,
 delay: (i * 200) % 1000,
 loop: true,
 ease:"outSine",
 });
 animations.push(haloAnim);
 }
 });

 // 2. Data Packet Pulses traveling along connection routes
 PULSE_ROUTES.forEach((route, routeIdx) => {
 const pulseEl = svgRef.current?.querySelector(`#data-pulse-${routeIdx}`);
 if (!pulseEl) return;

 // Animate sequential hops across nodes in route
 let currentHop = 0;
 let isRunning = true;

 const runNextHop = () => {
 if (!isRunning || !pulseEl) return;

 const fromId = route[currentHop];
 const toId = route[(currentHop + 1) % route.length];
 const fromNode = nodeMap.get(fromId);
 const toNode = nodeMap.get(toId);

 if (!fromNode || !toNode) return;

 // Speed adjusts based on riskTheme
 const baseSpeed = riskTheme ==="critical"? 750 : riskTheme ==="high"? 1000 : 1600;
 const dist = Math.hypot(toNode.x - fromNode.x, toNode.y - fromNode.y);
 const duration = Math.max(700, (dist / 400) * baseSpeed);

 const anim = animate(pulseEl, {
 cx: [fromNode.x, toNode.x],
 cy: [fromNode.y, toNode.y],
 opacity: [0, 0.85, 0.85, 0],
 scale: [0.8, 1.3, 0.8],
 duration,
 ease:"inOutQuad",
 onComplete: () => {
 currentHop = (currentHop + 1) % (route.length - 1);
 // Small pause between hops
 setTimeout(() => {
 if (isRunning) runNextHop();
 }, 300 + (routeIdx * 250));
 },
 });

 animations.push(anim);
 };

 // Initial stagger delay
 const initTimer = setTimeout(runNextHop, routeIdx * 600 + 400);

 return () => {
 isRunning = false;
 clearTimeout(initTimer);
 };
 });

 return () => {
 animations.forEach((anim) => {
 try {
 if (anim && typeof anim.pause ==="function") anim.pause();
 } catch {
 // cleanup safe
 }
 });
 };
 }, [riskTheme, nodeMap]);

 return (
 <div className="fixed inset-0 w-full h-full pointer-events-none z-[1] overflow-hidden select-none">
 <svg
 ref={svgRef}
 viewBox="0 0 1920 1080"
 preserveAspectRatio="xMidYMid slice"
 className="w-full h-full opacity-60 transition-opacity duration-1000"
 >
 <defs>
 {/* Subtle Glow Filter */}
 <filter id="cyber-glow"x="-50%"y="-50%"width="200%"height="200%">
 <feGaussianBlur in="SourceGraphic"stdDeviation="3.5"result="blur"/>
 <feMerge>
 <feMergeNode in="blur"/>
 <feMergeNode in="SourceGraphic"/>
 </feMerge>
 </filter>

 {/* Pulse Particle Glow */}
 <filter id="pulse-glow"x="-100%"y="-100%"width="300%"height="300%">
 <feGaussianBlur in="SourceGraphic"stdDeviation="4.5"result="blur"/>
 <feMerge>
 <feMergeNode in="blur"/>
 <feMergeNode in="SourceGraphic"/>
 </feMerge>
 </filter>

 {/* Gradients */}
 <linearGradient id="line-grad-cyan"x1="0%"y1="0%"x2="100%"y2="100%">
 <stop offset="0%"stopColor="#38bdf8"stopOpacity="0.25"/>
 <stop offset="100%"stopColor="#3b82f6"stopOpacity="0.12"/>
 </linearGradient>

 <linearGradient id="line-grad-threat"x1="0%"y1="0%"x2="100%"y2="100%">
 <stop offset="0%"stopColor="#f97316"stopOpacity="0.30"/>
 <stop offset="100%"stopColor="#ef4444"stopOpacity="0.15"/>
 </linearGradient>
 </defs>

 {/* ── 1. Connection Lines Layer ── */}
 <g id="cyber-connections"strokeWidth="1">
 {PIPELINE_CONNECTIONS.map((conn, idx) => {
 const from = nodeMap.get(conn.from);
 const to = nodeMap.get(conn.to);
 if (!from || !to) return null;

 const isHighlighted =
 hoveredNodeId === conn.from || hoveredNodeId === conn.to;
 const isThreatConn =
 conn.to ==="n11"|| conn.to ==="n13"|| conn.from ==="n11";

 const strokeColor = isHighlighted
 ?"#60a5fa"
 : isThreatConn && riskTheme !=="low"
 ?"url(#line-grad-threat)"
 :"url(#line-grad-cyan)";

 const opacity = isHighlighted
 ? 0.55
 : conn.type ==="primary"
 ? 0.22
 : 0.12;

 return (
 <line
 key={`conn-${idx}`}
 x1={from.x}
 y1={from.y}
 x2={to.x}
 y2={to.y}
 stroke={strokeColor}
 strokeOpacity={opacity}
 strokeDasharray={conn.type ==="feedback"?"4 4": undefined}
 className="transition-all duration-300"
 />
 );
 })}
 </g>

 {/* ── 2. Traveling Data Particles ── */}
 <g id="cyber-pulses">
 {PULSE_ROUTES.map((_, routeIdx) => (
 <circle
 key={`data-pulse-${routeIdx}`}
 id={`data-pulse-${routeIdx}`}
 r={3}
 cx={0}
 cy={0}
 fill={routeIdx % 2 === 0 ?"#38bdf8":"#60a5fa"}
 filter="url(#pulse-glow)"
 opacity={0}
 />
 ))}
 </g>

 {/* ── 3. Pipeline Nodes Layer ── */}
 <g id="cyber-nodes">
 {PIPELINE_NODES.map((node) => {
 const isHovered = hoveredNodeId === node.id;
 const radius = isHovered ? node.baseRadius * 1.5 : node.baseRadius;

 // Proximity brightness calculation
 let proximityAlpha = 0.35;
 if (mousePos) {
 const dist = Math.hypot(node.x - mousePos.x, node.y - mousePos.y);
 if (dist < 220) {
 proximityAlpha = Math.min(0.9, 0.35 + (1 - dist / 220) * 0.55);
 }
 }

 return (
 <g
 key={node.id}
 id={`node-group-${node.id}`}
 style={{ transformOrigin:`${node.x}px ${node.y}px`}}
 className="duration-300"
 >
 {/* Outer Halo / Ripple */}
 <circle
 id={`node-halo-${node.id}`}
 cx={node.x}
 cy={node.y}
 r={radius * 2.6}
 fill="none"
 stroke={node.color}
 strokeWidth="1"
 opacity={isHovered ? 0.8 : 0.25}
 style={{ transformOrigin:`${node.x}px ${node.y}px`}}
 />

 {/* Inner Glow Center */}
 <circle
 id={`node-circle-${node.id}`}
 cx={node.x}
 cy={node.y}
 r={radius}
 fill={node.color}
 filter="url(#cyber-glow)"
 opacity={isHovered ? 1 : proximityAlpha}
 style={{ transformOrigin:`${node.x}px ${node.y}px`}}
 />

 {/* Node Technical Label (Subtle Monospace) */}
 <text
 x={node.x}
 y={node.y + (node.y > 540 ? -12 : 18)}
 textAnchor="middle"
 fill="#94a3b8"
 fontSize={8.5}
 fontFamily="IBM Plex Mono, monospace"
 letterSpacing="0.08em"
 opacity={isHovered ? 0.9 : 0.35}
 className="transition-opacity duration-300"
 >
 {node.code}
 </text>
 </g>
 );
 })}
 </g>
 </svg>
 </div>
 );
}
