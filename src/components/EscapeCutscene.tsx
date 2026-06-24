import { useEffect, useRef, useState } from 'react';

const CW = 800, CH = 450;

const SCENES: { dur: number; sub: string }[] = [
  { dur: 3.8, sub: 'Рыцарь победил тьму. Сердце храма раскололось, и древние стены начали рушиться.' },
  { dur: 4.2, sub: 'Но победа еще не спасение. Храм просыпается в последний раз, чтобы похоронить героя внутри.' },
  { dur: 4.0, sub: 'Нужно бежать наверх, пока свет выхода не исчез под камнем и пеплом.' },
];
const TOTAL = SCENES.reduce((a, s) => a + s.dur, 0);

function drawKnight(ctx: CanvasRenderingContext2D, t: number, run: boolean) {
  const leg = run ? Math.sin(t * 16) * 0.36 : Math.sin(t * 3) * 0.08;
  ctx.save();
  const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, 38);
  aura.addColorStop(0, 'rgba(102,204,255,0.32)');
  aura.addColorStop(1, 'rgba(102,204,255,0)');
  ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, 0, 38, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#1d2a63';
  ctx.beginPath();
  ctx.moveTo(-9, -9); ctx.lineTo(7, -8);
  ctx.quadraticCurveTo(6, 7, -4 + Math.sin(t * 8) * 3, 18);
  ctx.quadraticCurveTo(-13, 16, -10, 0);
  ctx.closePath(); ctx.fill();

  for (const s of [-1, 1]) {
    const off = s < 0 ? leg * 7 : -leg * 7;
    ctx.fillStyle = '#2f6fe0';
    ctx.fillRect(s * 4 - 3, 4 + off, 6, 13);
  }

  const body = ctx.createLinearGradient(0, -12, 0, 12);
  body.addColorStop(0, '#cfe6ff');
  body.addColorStop(0.55, '#5aa9ff');
  body.addColorStop(1, '#2f6fe0');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-9, -8); ctx.lineTo(9, -8); ctx.lineTo(8, 8);
  ctx.quadraticCurveTo(0, 15, -8, 8);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#5aa9ff';
  ctx.beginPath(); ctx.ellipse(0, -17, 10, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#071126'; ctx.fillRect(-8, -18, 16, 5);
  ctx.save(); ctx.shadowColor = '#eaf4ff'; ctx.shadowBlur = 7;
  ctx.fillStyle = '#eaf4ff'; ctx.fillRect(-6, -17, 12, 2);
  ctx.restore();

  ctx.save();
  ctx.rotate(-0.55);
  ctx.shadowColor = '#8fb4ff'; ctx.shadowBlur = 12;
  ctx.fillStyle = '#cfe2ff';
  ctx.fillRect(10, -28, 4, 42);
  ctx.fillStyle = '#9a8444';
  ctx.fillRect(4, 10, 16, 4);
  ctx.restore();
  ctx.restore();
}

function drawScene(ctx: CanvasRenderingContext2D, idx: number, p: number, gt: number) {
  ctx.clearRect(0, 0, CW, CH);
  const bg = ctx.createLinearGradient(0, 0, 0, CH);
  bg.addColorStop(0, idx === 0 ? '#180805' : '#2b0d05');
  bg.addColorStop(0.5, '#241408');
  bg.addColorStop(1, '#060303');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, CW, CH);

  const pulse = 0.5 + Math.sin(gt * 5) * 0.5;
  const core = ctx.createRadialGradient(CW / 2, 210, 8, CW / 2, 210, 260);
  core.addColorStop(0, `rgba(255,230,160,${0.18 + pulse * 0.18})`);
  core.addColorStop(0.4, `rgba(255,80,22,${0.16 + pulse * 0.12})`);
  core.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = core; ctx.beginPath(); ctx.arc(CW / 2, 210, 260, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#120905';
  for (let x = 40; x < CW; x += 110) {
    const lean = Math.sin(x) * 10;
    ctx.save();
    ctx.translate(x + lean * p, 70 + (idx === 2 ? p * 50 : 0));
    ctx.rotate((idx === 0 ? 0.04 : 0.12) * Math.sin(gt + x));
    ctx.fillRect(-18, 0, 36, 330);
    ctx.fillStyle = '#3a2912';
    ctx.fillRect(-24, 0, 48, 10);
    ctx.restore();
    ctx.fillStyle = '#120905';
  }

  ctx.fillStyle = '#2e2110';
  ctx.fillRect(0, 360, CW, 90);
  ctx.fillStyle = '#d8b66a';
  ctx.fillRect(0, 358, CW, 3);

  for (let i = 0; i < 28; i++) {
    const fall = (gt * (42 + i % 7 * 9) + i * 31) % (CH + 80);
    const x = (i * 83 + Math.sin(gt + i) * 24) % CW;
    ctx.save();
    ctx.translate(x, fall - 60);
    ctx.rotate(gt * 2 + i);
    ctx.fillStyle = i % 3 === 0 ? '#d8b66a' : '#6a3a18';
    ctx.fillRect(-3, -3, 6 + i % 5, 6 + i % 4);
    ctx.restore();
  }

  if (idx === 0) {
    ctx.save();
    ctx.globalAlpha = 1 - Math.max(0, p - 0.55) / 0.45;
    ctx.translate(CW / 2, 300);
    ctx.scale(2.4, 2.4);
    drawKnight(ctx, gt, false);
    ctx.restore();
  } else if (idx === 1) {
    ctx.save();
    ctx.translate(190 + p * 170, 330);
    ctx.scale(1.9, 1.9);
    drawKnight(ctx, gt, true);
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(130 + p * 420, 330 - Math.sin(p * Math.PI) * 18);
    ctx.scale(1.8, 1.8);
    drawKnight(ctx, gt, true);
    ctx.restore();
    const exit = ctx.createRadialGradient(690, 230, 6, 690, 230, 120);
    exit.addColorStop(0, 'rgba(220,245,255,0.85)');
    exit.addColorStop(0.5, 'rgba(102,204,255,0.25)');
    exit.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = exit; ctx.beginPath(); ctx.arc(690, 230, 120, 0, Math.PI * 2); ctx.fill();
  }

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CW, 26);
  ctx.fillRect(0, CH - 26, CW, 26);
}

export function EscapeCutscene({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const idxRef = useRef(0);
  const [subIdx, setSubIdx] = useState(0);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let start: number | undefined;
    const frame = (now: number) => {
      if (start === undefined) start = now;
      const gt = (now - start) / 1000;
      if (gt >= TOTAL) { doneRef.current(); return; }
      let acc = 0, idx = 0, p = 0;
      for (let k = 0; k < SCENES.length; k++) {
        if (gt < acc + SCENES[k].dur) { idx = k; p = (gt - acc) / SCENES[k].dur; break; }
        acc += SCENES[k].dur;
      }
      if (idx !== idxRef.current) { idxRef.current = idx; setSubIdx(idx); }
      drawScene(ctx, idx, p, gt);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', borderRadius: 8, overflow: 'hidden', lineHeight: 0 }}>
      <canvas ref={canvasRef} width={CW} height={CH}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', background: '#000' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: '7%', display: 'flex', justifyContent: 'center', pointerEvents: 'none', padding: '0 24px' }}>
        <p key={subIdx} className="cutscene-line"
          style={{ maxWidth: 620, textAlign: 'center', fontFamily: 'monospace', fontSize: 15, lineHeight: 1.5,
            color: '#fff0c8', textShadow: '0 2px 6px #000', background: 'rgba(20,8,2,0.55)',
            padding: '8px 16px', borderRadius: 8 }}>
          {SCENES[subIdx].sub}
        </p>
      </div>
      <button onClick={() => doneRef.current()}
        style={{ position: 'absolute', bottom: 12, right: 14,
          background: 'rgba(40,18,4,.65)', color: '#ffcc88', fontFamily: 'monospace', fontSize: 12,
          padding: '5px 12px', border: '1px solid #a8842f', borderRadius: 6, cursor: 'pointer' }}>
        Пропустить
      </button>
    </div>
  );
}
