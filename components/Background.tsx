"use client";

import { useEffect, useRef } from "react";

export default function Background() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let dots: { x: number; y: number; vx: number; vy: number }[] = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        };

        const init = () => {
            dots = [];
            const count = (canvas.width * canvas.height) / 15000;
            for (let i = 0; i < count; i++) {
                dots.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                });
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(0, 217, 255, 0.4)";
            ctx.strokeStyle = "rgba(0, 217, 255, 0.08)";

            dots.forEach((dot, i) => {
                dot.x += dot.vx;
                dot.y += dot.vy;
                if (dot.x < 0 || dot.x > canvas.width) dot.vx *= -1;
                if (dot.y < 0 || dot.y > canvas.height) dot.vy *= -1;

                ctx.beginPath();
                ctx.arc(dot.x, dot.y, 1.5, 0, Math.PI * 2);
                ctx.fill();

                for (let j = i + 1; j < dots.length; j++) {
                    const d2 = dots[j];
                    const dist = Math.hypot(dot.x - d2.x, dot.y - d2.y);
                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(dot.x, dot.y);
                        ctx.lineTo(d2.x, d2.y);
                        ctx.stroke();
                    }
                }
            });
            requestAnimationFrame(animate);
        };

        window.addEventListener("resize", resize);
        resize();
        animate();

        return () => {
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <>
            <div className="gradient-orb orb-1"></div>
            <div className="gradient-orb orb-2"></div>
            <canvas id="hero-canvas" ref={canvasRef}></canvas>
        </>
    );
}
