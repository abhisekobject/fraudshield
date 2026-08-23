"use client";

import React, { useEffect, useRef } from"react";
import { usePathname } from"next/navigation";
import { createTimeline, stagger } from"animejs";

interface PageTransitionProps {
 children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
 const containerRef = useRef<HTMLDivElement>(null);
 const pathname = usePathname();

 useEffect(() => {
 const container = containerRef.current;
 if (!container) return;

 // Respect prefers-reduced-motion
 if (typeof window !=="undefined") {
 const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 if (prefersReduced) {
 return;
 }
 }

 // Set of animated elements to avoid duplicate animations on nested elements
 const animatedElements = new Set<Element>();

 function getDistinctElements(selector: string): HTMLElement[] {
 if (!container) return [];
 const nodes = container.querySelectorAll(selector);
 const result: HTMLElement[] = [];
 nodes.forEach((node) => {
 if (!animatedElements.has(node) && node instanceof HTMLElement) {
 animatedElements.add(node);
 result.push(node);
 }
 });
 return result;
 }

 // 1. Page / Header Area
 const headers = getDistinctElements(
'[data-animate="header"], h1, .page-header, .hero-header'
 );

 // 2. Page Description / Subtitle
 const descriptions = getDistinctElements(
'[data-animate="description"], .page-subtitle, p.text-white, p.text-white'
 ).filter((el) => !headers.includes(el));

 // 3. Main Glass Panels
 const panels = getDistinctElements(
'[data-animate="panel"], .glass-panel, [class*="-[22px]"], [class*="-3xl"]'
 );

 // 4. Cards / Scenario buttons / Stat items
 const cards = getDistinctElements(
'[data-animate="card"], [class*="-2xl"], .card'
 ).filter((el) => !panels.includes(el));

 // 5. Charts / Data Visualizations / Gauges
 const charts = getDistinctElements(
'[data-animate="chart"], .recharts-wrapper, svg.recharts-surface, .chart-container, [data-chart]'
 );

 // 6. Secondary Controls / Buttons / Inputs
 const controls = getDistinctElements(
'[data-animate="control"], button.btn-secondary, .controls-group'
 );

 // Fallback: If no structured elements were captured, animate top-level direct children
 let fallbackElements: HTMLElement[] = [];
 if (headers.length === 0 && panels.length === 0 && cards.length === 0) {
 const children = Array.from(container.children);
 fallbackElements = children.filter(
 (child): child is HTMLElement => child instanceof HTMLElement && !animatedElements.has(child)
 );
 }

 // Create Anime.js Timeline for sequence
 const tl = createTimeline({
 defaults: {
 ease:"outCubic",
 },
 });

 let currentTime = 0;

 // Sequence Step 1: Header Area (500–600ms, subtle translateY)
 if (headers.length > 0) {
 tl.add(
 headers,
 {
 opacity: [0, 1],
 translateY: [18, 0],
 duration: 550,
 delay: stagger(60),
 },
 currentTime
 );
 currentTime += 70;
 }

 // Sequence Step 2: Page Description
 if (descriptions.length > 0) {
 tl.add(
 descriptions,
 {
 opacity: [0, 1],
 translateY: [14, 0],
 duration: 500,
 },
 currentTime
 );
 currentTime += 60;
 }

 // Sequence Step 3: Main Glass Panels (subtle scale 0.985 -> 1, translateY 18 -> 0)
 if (panels.length > 0) {
 tl.add(
 panels,
 {
 opacity: [0, 1],
 translateY: [18, 0],
 scale: [0.985, 1],
 duration: 600,
 delay: stagger(75),
 },
 currentTime
 );
 currentTime += 90;
 }

 // Sequence Step 4: Cards & Scenarios
 if (cards.length > 0) {
 tl.add(
 cards,
 {
 opacity: [0, 1],
 translateY: [16, 0],
 scale: [0.99, 1],
 duration: 550,
 delay: stagger(60),
 },
 currentTime
 );
 currentTime += 80;
 }

 // Sequence Step 5: Charts & Gauges
 if (charts.length > 0) {
 tl.add(
 charts,
 {
 opacity: [0, 1],
 translateY: [14, 0],
 scale: [0.98, 1],
 duration: 650,
 delay: stagger(80),
 },
 currentTime
 );
 currentTime += 70;
 }

 // Sequence Step 6: Secondary Controls
 if (controls.length > 0) {
 tl.add(
 controls,
 {
 opacity: [0, 1],
 translateY: [12, 0],
 duration: 500,
 delay: stagger(50),
 },
 currentTime
 );
 }

 // Fallback animation if needed
 if (fallbackElements.length > 0) {
 tl.add(
 fallbackElements,
 {
 opacity: [0, 1],
 translateY: [18, 0],
 duration: 600,
 delay: stagger(80),
 },
 0
 );
 }

 return () => {
 // Clean up timeline on route unmount
 try {
 if (tl && typeof tl.revert ==="function") {
 tl.revert();
 }
 } catch {
 // Timeline completed or already detached
 }
 };
 }, [pathname]);

 return (
 <div ref={containerRef} className="w-full">
 {children}
 </div>
 );
}
