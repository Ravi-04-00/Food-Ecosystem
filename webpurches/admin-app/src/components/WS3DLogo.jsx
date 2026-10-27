import React, { useEffect, useRef, useState } from 'react';

/**
 * Legacy-compatible export name. The visual identity is now the original FD Foods
 * monogram; the component name is retained to avoid breaking existing imports.
 */
export const WS3DLogo = ({
  app = 'customer', size = 52, showLabel = true, interactive = true,
  className = '', onClick
}) => {
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    let raf = 0;
    let start = performance.now();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const render = (now) => {
      const elapsed = (now - start) / 1000;
      const w = size * 1.7;
      const h = size * 1.7;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
        canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2 + Math.sin(elapsed * 1.7) * 2;
      const green = '#1B4332', leaf = '#52B788', mint = '#D8F3DC';
      const aura = ctx.createRadialGradient(cx, cy, size * .08, cx, cy, size * .78);
      aura.addColorStop(0, 'rgba(82,183,136,.25)'); aura.addColorStop(1, 'rgba(82,183,136,0)');
      ctx.fillStyle = aura; ctx.fillRect(0, 0, w, h);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.sin(elapsed * .7) * .035);
      const rx = size * .62;
      const ring = ctx.createLinearGradient(-rx, -rx, rx, rx);
      ring.addColorStop(0, '#FFFFFF'); ring.addColorStop(.35, leaf); ring.addColorStop(.7, green); ring.addColorStop(1, '#FFFFFF');
      ctx.beginPath(); ctx.arc(0, 0, rx * .78, 0, Math.PI * 2); ctx.strokeStyle = ring; ctx.lineWidth = 2.2; ctx.shadowColor = 'rgba(27,67,50,.24)'; ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;
      const squash = spinning ? Math.cos(elapsed * 8) * .12 : hovered ? Math.sin(elapsed * 2) * .025 : Math.sin(elapsed) * .012;
      ctx.scale(Math.max(.76, 1 + squash), 1);
      ctx.font = `900 ${Math.round(size * .57)}px 'Plus Jakarta Sans', system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      // Extrusion layers create a lightweight 3D depth effect.
      for (let depth = 7; depth >= 1; depth--) {
        ctx.fillStyle = depth > 4 ? '#123525' : '#286B4B';
        ctx.fillText('FD', depth * .65, depth * .8 + 1);
      }
      const face = ctx.createLinearGradient(-size * .35, -size * .3, size * .35, size * .35);
      face.addColorStop(0, '#FFFFFF'); face.addColorStop(.25, mint); face.addColorStop(.65, leaf); face.addColorStop(1, green);
      ctx.fillStyle = face; ctx.shadowColor = 'rgba(27,67,50,.25)'; ctx.shadowBlur = 5; ctx.fillText('FD', 0, 0); ctx.shadowBlur = 0;
      // Small leaf glint, consistent with the FD Foods organic identity.
      ctx.save(); ctx.translate(size * .28, -size * .39); ctx.rotate(-.55); ctx.beginPath(); ctx.ellipse(0, 0, size * .095, size * .045, 0, 0, Math.PI * 2); ctx.fillStyle = '#52B788'; ctx.fill(); ctx.restore();
      ctx.restore();
      frame += 1;
      raf = window.requestAnimationFrame(render);
    };
    raf = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(raf);
  }, [size, hovered, spinning]);

  return (
    <button
      type="button"
      className={`fd-logo-3d inline-flex flex-col items-center justify-center border-0 bg-transparent p-0 ${className}`}
      style={{ cursor: onClick ? 'pointer' : 'default', color: '#1B4332', minWidth: size }}
      onClick={onClick}
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => { setHovered(false); setSpinning(false); }}
      onFocus={() => interactive && setHovered(true)}
      onBlur={() => { setHovered(false); setSpinning(false); }}
      onDoubleClick={() => interactive && setSpinning(v => !v)}
      aria-label={`FD Foods ${app} logo`}
    >
      <canvas ref={canvasRef} aria-hidden="true" style={{ display: 'block', margin: '-8px 0 -7px', maxWidth: '100%' }} />
      {showLabel && <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.18em', color: '#1B4332', lineHeight: 1.2 }}>FD FOODS</span>}
    </button>
  );
};
export default WS3DLogo;
