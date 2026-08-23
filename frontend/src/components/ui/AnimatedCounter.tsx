"use client";

import React, { useEffect, useState, useRef } from"react";
import { animate } from"animejs";

interface AnimatedCounterProps {
 value: number;
 duration?: number;
 prefix?: string;
 suffix?: string;
 decimals?: number;
 className?: string;
}

export function AnimatedCounter({
 value,
 duration = 1200,
 prefix ="",
 suffix ="",
 decimals = 0,
 className ="",
}: AnimatedCounterProps) {
 const [displayValue, setDisplayValue] = useState(0);
 const counterRef = useRef<{ count: number }>({ count: 0 });

 useEffect(() => {
 // Respect prefers-reduced-motion
 if (typeof window !=="undefined") {
 const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 if (prefersReduced) {
 setDisplayValue(value);
 return;
 }
 }

 counterRef.current.count = 0;
 const anim = animate(counterRef.current, {
 count: value,
 duration,
 ease:"outCubic",
 onUpdate: () => {
 setDisplayValue(counterRef.current.count);
 },
 });

 return () => {
 try {
 if (anim && typeof anim.pause ==="function") anim.pause();
 } catch {
 // cleanup safe
 }
 };
 }, [value, duration]);

 const formatted = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toString();

 return (
 <span className={className}>
 {prefix}
 {formatted}
 {suffix}
 </span>
 );
}
