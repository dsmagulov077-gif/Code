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

  const logout = () => { if (session) supabase.auth.signOut(); setGuest(false); setStarted(false); setIntro(false); };

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '16px 10px 48px' }}>
      {intro ? (
        <Cutscene onDone={() => { setIntro(false); setStarted(true); }} />
      ) : started ? (
        <HollowGame userEmail={session?.user.email ?? 'Гость'} onExit={() => setStarted(false)} />
      ) : (
        <StartScreen userEmail={session?.user.email ?? 'Гость'} onPlay={() => setIntro(true)} onExit={logout} />
      )}
    </main>
  );
}
