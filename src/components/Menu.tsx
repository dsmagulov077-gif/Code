import { supabase } from '../lib/supabase';

interface Props {
  userEmail: string;
}

const items = [
  { icon: '🎮', label: 'Играть' },
  { icon: '👤', label: 'Профиль' },
  { icon: '🏆', label: 'Рейтинг' },
  { icon: '⚙️', label: 'Настройки' },
];

export function Menu({ userEmail }: Props) {
  return (
    <section className="card">
      <p className="hello">Привет, {userEmail} 👋</p>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
        {items.map((item) => (
          <li key={item.label}>
            <button
              style={{
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: 12,
                fontSize: 16,
                color: 'var(--ink)',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
      <button
        className="ghost"
        style={{ marginTop: 20 }}
        onClick={() => supabase.auth.signOut()}
      >
        Выйти из аккаунта
      </button>
    </section>
  );
}
