"use client";

import React from"react";

export function GlobalAppBackground() {
 return (
 <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none">

 {/* ── 1. FRAUDSHIELD DIGITAL HANDS IMAGE ─────────────────────────────
 The outer div is 104% to give the slow-drift/scale room to move
 without revealing a gap at the edges.
 ────────────────────────────────────────────────────────────────────── */}
 <div className="absolute inset-[-2%] w-[104%] h-[104%] overflow-hidden">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src="/images/fraudshield-hands.jpg"
 alt=""
 aria-hidden="true"
 className="fs-bg-drift w-full h-full object-cover object-center select-none"
 style={{
 filter:"brightness(0.72) contrast(1.08) saturate(1.05)",
 }}
 />
 </div>

 {/* ── 2. CENTRAL BLUE BREATHING PULSE ──────────────────────────────── */}
 <div
 className="fs-center-glow absolute left-1/2 top-[48%] w-[420px] h-[420px] -full pointer-events-none"
 aria-hidden="true"
 style={{
 background:"radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 70%)",
 filter:"blur(72px)",
 transform:"translate(-50%, -50%)",
 }}
 />

 {/* ── 3. DARK READABILITY OVERLAY ──────────────────────────────────── */}
 {/* Base navy tint */}
 <div
 className="absolute inset-0"
 style={{ backgroundColor:"rgba(6, 9, 24, 0.60)"}}
 aria-hidden="true"
 />

 {/* Top + bottom edge fade to paper colour */}
 <div
 className="absolute inset-0"
 style={{
 background:
"linear-gradient(to bottom, rgba(8,10,25,0.68) 0%, transparent 28%, transparent 72%, rgba(8,10,25,0.78) 100%)",
 }}
 aria-hidden="true"
 />

 {/* Left + right edge fade */}
 <div
 className="absolute inset-0"
 style={{
 background:
"linear-gradient(to right, rgba(8,10,25,0.45) 0%, transparent 20%, transparent 80%, rgba(8,10,25,0.45) 100%)",
 }}
 aria-hidden="true"
 />
 </div>
 );
}
