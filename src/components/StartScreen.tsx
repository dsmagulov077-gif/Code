// Главный экран игры — показывается перед запуском, чтобы игра не стартовала сразу.
import { useEffect } from 'react';
import { sfx } from '../lib/sfx';

interface Props {
  userEmail: string;
  onPlay: () => void;
  onExit?: () => void;
}

const controls = [
  ['A / D', 'Движение'],
  ['W / Пробел', 'Прыжок'],
  ['ЛКМ', 'Атака'],
  ['ПКМ', 'Щит'],
  ['K', 'Рывок'],
  ['Q', 'Уворот'],
];

export function StartScreen({ userEmail, onPlay, onExit }: Props) {
  useEffect(() => {
    sfx.stopMusic();
  }, []);

  const handlePlay = () => {
    sfx.init();
    sfx.resume();
    sfx.startMusic('cave');
    onPlay();
  };
  const name = userEmail.split('@')[0] || 'Гость';
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        overflow: 'hidden',
        background: 'radial-gradient(120% 120% at 50% 0%, #0c0c24 0%, #050510 60%, #020208 100%)',
        color: '#cfe2ff',
        fontFamily: 'monospace',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        boxSizing: 'border-box',
      }}
    >
      {/* лёгкое свечение за заголовком */}
      <div
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 460,
          height: 220,
          maxWidth: '90%',
          background: 'radial-gradient(circle, rgba(102,136,255,0.22) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative' }}>
        <h1
          style={{
            fontSize: 46,
            fontWeight: 900,
            letterSpacing: 4,
            color: '#6688ff',
            textShadow: '0 0 18px rgba(102,136,255,0.7), 0 3px 0 #1a1a38',
            marginBottom: 6,
          }}
        >
          VOID KNIGHT
        </h1>
        <p style={{ color: '#5b6a99', fontSize: 13, letterSpacing: 2, marginBottom: 28 }}>
          СОЙДИ В ПЕЩЕРУ · СРАЗИ ВЛАДЫКУ ПУСТОТЫ
        </p>

        <button
          onClick={handlePlay}
          style={{
            background: 'linear-gradient(180deg, #3a5cff 0%, #2f6fe0 100%)',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 3,
            padding: '14px 48px',
            borderRadius: 10,
            border: '1px solid #6688ff',
            boxShadow: '0 0 24px rgba(102,136,255,0.45)',
            cursor: 'pointer',
          }}
        >
          ИГРАТЬ
        </button>

        <div
          style={{
            margin: '34px auto 0',
            maxWidth: 360,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px 22px',
            textAlign: 'left',
            fontSize: 12,
          }}
        >
          {controls.map(([key, action]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ color: '#8fb4ff', fontWeight: 700 }}>{key}</span>
              <span style={{ color: '#5b6a99' }}>{action}</span>
            </div>
          ))}
        </div>

        <p style={{ marginTop: 30, fontSize: 12, color: '#3f4a6b' }}>
          Игрок: <span style={{ color: '#8fb4ff' }}>{name}</span>
        </p>

        {onExit && (
          <button
            onClick={onExit}
            style={{
              marginTop: 14,
              background: 'transparent',
              color: '#8fb4ff',
              fontFamily: 'monospace',
              fontSize: 13,
              letterSpacing: 2,
              padding: '8px 26px',
              borderRadius: 8,
              border: '1px solid #2244aa',
              cursor: 'pointer',
            }}
          >
            ВЫХОД
          </button>
        )}
      </div>
    </div>
  );
}
