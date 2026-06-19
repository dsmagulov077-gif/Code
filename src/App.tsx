import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { HollowGame } from './components/HollowGame';
import { StartScreen } from './components/StartScreen';
import { Cutscene } from './components/Cutscene';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [guest, setGuest] = useState(false);
  const [started, setStarted] = useState(false);
  const [intro, setIntro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return <main className="container"><p>Загрузка…</p></main>;

  if (!session && !guest) {
    return (
      <main className="container">
        <header className="header"><h1>Мой проект</h1></header>
        <Auth onGuest={() => setGuest(true)} />
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '16px 10px 48px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#6688ff' }}>VOID KNIGHT</span>
        <button className="ghost" style={{ fontFamily: 'monospace', fontSize: 12 }}
          onClick={() => { if (session) supabase.auth.signOut(); setGuest(false); setStarted(false); setIntro(false); }}>
          Выйти
        </button>
      </header>
      {intro ? (
        <Cutscene onDone={() => { setIntro(false); setStarted(true); }} />
      ) : started ? (
        <HollowGame userEmail={session?.user.email ?? 'Гость'} onExit={() => setStarted(false)} />
      ) : (
        <StartScreen userEmail={session?.user.email ?? 'Гость'} onPlay={() => setIntro(true)} />
      )}
    </main>
  );
}
