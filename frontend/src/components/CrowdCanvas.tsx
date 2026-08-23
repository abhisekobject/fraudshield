"use client";

import { gsap } from"gsap";
import React, { useEffect, useRef } from"react";

export interface CrowdCanvasProps {
 src?: string;
 rows?: number;
 cols?: number;
 className?: string;
 style?: React.CSSProperties;
 speedMultiplier?: number;
}

interface Peep {
 image: HTMLImageElement;
 rect: number[];
 width: number;
 height: number;
 drawArgs: (HTMLImageElement | number)[];
 x: number;
 y: number;
 anchorY: number;
 scaleX: number;
 walk: gsap.core.Timeline | null;
 setRect: (rect: number[]) => void;
 render: (ctx: CanvasRenderingContext2D) => void;
}

export function CrowdCanvas({
 src ="/images/peeps/all-peeps.png",
 rows = 15,
 cols = 7,
 className ="",
 style = {},
 speedMultiplier = 1,
}: CrowdCanvasProps) {
 const canvasRef = useRef<HTMLCanvasElement>(null);

 useEffect(() => {
 const canvas = canvasRef.current;
 if (!canvas) return;

 const ctx = canvas.getContext("2d");
 if (!ctx) return;

 let isDisposed = false;

 // Check reduced motion preference
 const prefersReducedMotion =
 typeof window !=="undefined"&&
 window.matchMedia &&
 window.matchMedia("(prefers-reduced-motion: reduce)").matches;

 // UTILS
 const randomRange = (min: number, max: number) =>
 min + Math.random() * (max - min);
 const randomIndex = (array: unknown[]) => Math.floor(randomRange(0, array.length));
 const removeFromArray = <T,>(array: T[], i: number): T => array.splice(i, 1)[0];
 const removeItemFromArray = <T,>(array: T[], item: T): T | undefined => {
 const idx = array.indexOf(item);
 return idx > -1 ? removeFromArray(array, idx) : undefined;
 };
 const removeRandomFromArray = <T,>(array: T[]): T =>
 removeFromArray(array, randomIndex(array));
 const getRandomFromArray = <T,>(array: T[]): T => array[randomIndex(array)];

 // TWEEN FACTORIES
 const resetPeep = ({
 stage,
 peep,
 }: {
 stage: { width: number; height: number };
 peep: Peep;
 }) => {
 const direction = Math.random() > 0.5 ? 1 : -1;
 const easeVal = gsap.parseEase("power2.in")(Math.random());
 const offsetY = 100 - 250 * easeVal;
 const startY = stage.height - peep.height + offsetY;
 let startX: number;
 let endX: number;

 if (direction === 1) {
 startX = -peep.width;
 endX = stage.width;
 peep.scaleX = 1;
 } else {
 startX = stage.width + peep.width;
 endX = 0;
 peep.scaleX = -1;
 }

 peep.x = startX;
 peep.y = startY;
 peep.anchorY = startY;

 return {
 startX,
 startY,
 endX,
 };
 };

 const normalWalk = ({
 peep,
 props,
 }: {
 peep: Peep;
 props: { startX: number; startY: number; endX: number };
 }) => {
 const { startX, startY, endX } = props;
 const baseDuration = prefersReducedMotion ? 25 : 12;
 const xDuration = baseDuration / (speedMultiplier || 1);
 const yDuration = (prefersReducedMotion ? 0.6 : 0.28) / (speedMultiplier || 1);

 const tl = gsap.timeline();
 tl.timeScale(prefersReducedMotion ? 0.35 : randomRange(0.65, 1.25));
 tl.to(
 peep,
 {
 duration: xDuration,
 x: endX,
 ease:"none",
 },
 0
 );

 if (!prefersReducedMotion) {
 tl.to(
 peep,
 {
 duration: yDuration,
 repeat: Math.floor(xDuration / yDuration),
 yoyo: true,
 y: startY - 8,
 },
 0
 );
 }

 return tl;
 };

 const walks = [normalWalk];

 // FACTORY FUNCTIONS
 const createPeep = ({
 image,
 rect,
 }: {
 image: HTMLImageElement;
 rect: number[];
 }): Peep => {
 const peep: Peep = {
 image,
 rect: [],
 width: 0,
 height: 0,
 drawArgs: [],
 x: 0,
 y: 0,
 anchorY: 0,
 scaleX: 1,
 walk: null,
 setRect: (r: number[]) => {
 peep.rect = r;
 peep.width = r[2];
 peep.height = r[3];
 peep.drawArgs = [peep.image, ...r, 0, 0, peep.width, peep.height];
 },
 render: (renderCtx: CanvasRenderingContext2D) => {
 renderCtx.save();
 renderCtx.translate(peep.x, peep.y);
 renderCtx.scale(peep.scaleX, 1);
 renderCtx.drawImage(
 peep.image,
 peep.rect[0],
 peep.rect[1],
 peep.rect[2],
 peep.rect[3],
 0,
 0,
 peep.width,
 peep.height
 );
 renderCtx.restore();
 },
 };

 peep.setRect(rect);
 return peep;
 };

 // STAGE & POOLS
 const img = new Image();
 const stage = {
 width: 0,
 height: 0,
 };

 const allPeeps: Peep[] = [];
 const availablePeeps: Peep[] = [];
 const crowd: Peep[] = [];

 const createPeeps = () => {
 const { naturalWidth: width, naturalHeight: height } = img;
 if (!width || !height) return;
 const total = rows * cols;
 const rectWidth = width / rows;
 const rectHeight = height / cols;

 for (let i = 0; i < total; i++) {
 allPeeps.push(
 createPeep({
 image: img,
 rect: [
 (i % rows) * rectWidth,
 Math.floor(i / rows) * rectHeight,
 rectWidth,
 rectHeight,
 ],
 })
 );
 }
 };

 const addPeepToCrowd = (): Peep | null => {
 if (isDisposed || !availablePeeps.length) return null;
 const peep = removeRandomFromArray(availablePeeps);
 const walk = getRandomFromArray(walks)({
 peep,
 props: resetPeep({
 peep,
 stage,
 }),
 }).eventCallback("onComplete", () => {
 if (!isDisposed) {
 removePeepFromCrowd(peep);
 addPeepToCrowd();
 }
 });

 peep.walk = walk;

 crowd.push(peep);
 crowd.sort((a, b) => a.anchorY - b.anchorY);

 return peep;
 };

 const removePeepFromCrowd = (peep: Peep) => {
 removeItemFromArray(crowd, peep);
 availablePeeps.push(peep);
 };

 const initCrowd = () => {
 while (availablePeeps.length > 0) {
 const added = addPeepToCrowd();
 if (added?.walk) {
 added.walk.progress(Math.random());
 }
 }
 };

 const render = () => {
 if (isDisposed || !canvas) return;
 const dpr = window.devicePixelRatio || 1;
 ctx.clearRect(0, 0, canvas.width, canvas.height);
 ctx.save();
 ctx.scale(dpr, dpr);

 for (let i = 0; i < crowd.length; i++) {
 crowd[i].render(ctx);
 }

 ctx.restore();
 };

 const resize = () => {
 if (isDisposed || !canvas) return;
 const dpr = window.devicePixelRatio || 1;
 const parent = canvas.parentElement;
 stage.width = parent ? parent.clientWidth : window.innerWidth;
 stage.height = parent ? parent.clientHeight : window.innerHeight;
 canvas.width = stage.width * dpr;
 canvas.height = stage.height * dpr;

 crowd.forEach((peep) => {
 if (peep.walk) peep.walk.kill();
 });

 crowd.length = 0;
 availablePeeps.length = 0;
 availablePeeps.push(...allPeeps);

 initCrowd();
 };

 const init = () => {
 if (isDisposed) return;
 createPeeps();
 resize();
 gsap.ticker.add(render);
 };

 img.crossOrigin ="anonymous";
 img.src = src;

 if (img.complete && img.naturalWidth > 0) {
 init();
 } else {
 img.onload = init;
 }

 const handleResize = () => {
 resize();
 };

 window.addEventListener("resize", handleResize);

 return () => {
 isDisposed = true;
 window.removeEventListener("resize", handleResize);
 gsap.ticker.remove(render);
 crowd.forEach((peep) => {
 if (peep.walk) peep.walk.kill();
 });
 crowd.length = 0;
 availablePeeps.length = 0;
 allPeeps.length = 0;
 img.onload = null;
 };
 }, [src, rows, cols, speedMultiplier]);

 return (
 <canvas
 ref={canvasRef}
 className={`pointer-events-none ${className}`}
 style={style}
 aria-hidden="true"
 />
 );
}

export const Skiper39 = () => {
 return (
 <div className="relative h-full w-full bg-white text-black">
 <div className="top-22 absolute left-1/2 grid -translate-x-1/2 content-start justify-items-center gap-6 text-center text-black">
 <span className="relative max-w-[12ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:from-white after:to-black after:content-['']">
 Crowd Canvas
 </span>
 </div>
 <div className="absolute bottom-0 h-full w-screen">
 <CrowdCanvas src="/images/peeps/all-peeps.png"rows={15} cols={7} />
 </div>
 </div>
 );
};

export default CrowdCanvas;
