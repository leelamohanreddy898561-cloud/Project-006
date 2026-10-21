import { useEffect, useRef } from "react";
import "./NetworkBackground.css";

/**
 * R1.2 — AI network effect behind the hero.
 *
 * A canvas of slowly drifting nodes connected by lines when they are close.
 * Motion is skipped entirely under `prefers-reduced-motion` (a single static
 * frame is drawn instead), and the accent colour is read from the CSS custom
 * property on every frame so it follows the active theme.
 */

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const LINK_DISTANCE = 130;
const MAX_NODES = 60;

export function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    // Local alias so the nested helpers keep TypeScript's non-null narrowing.
    const ctx = context;
    const el = canvas;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let frame = 0;
    const nodes: Node[] = [];

    function accentColor(): string {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-accent")
        .trim();
      return value || "#4f46e5";
    }

    function resize() {
      const rect = el.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      el.width = Math.max(1, Math.floor(width * dpr));
      el.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      nodes.length = 0;
      const count = Math.min(
        MAX_NODES,
        Math.max(18, Math.floor((width * height) / 24000)),
      );
      for (let i = 0; i < count; i += 1) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
        });
      }
    }

    function draw() {
      const color = accentColor();
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.hypot(dx, dy);
          if (distance >= LINK_DISTANCE) continue;
          ctx.globalAlpha = (1 - distance / LINK_DISTANCE) * 0.16;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 0.32;
      ctx.fillStyle = color;
      for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function step() {
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
      }
      draw();
      frame = requestAnimationFrame(step);
    }

    resize();
    if (reduceMotion) {
      draw();
    } else {
      frame = requestAnimationFrame(step);
    }

    const onResize = () => {
      resize();
      if (reduceMotion) draw();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="network-bg" aria-hidden="true" />;
}
