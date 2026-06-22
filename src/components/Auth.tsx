import { useState } from 'react';
import { supabase } from '../lib/supabase';

// Вход и регистрация по email + паролю — чёрно-синее неоновое оформление.
export function Auth({ onGuest }: { onGuest?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleGoogle() {
    setBusy(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) setMessage(error.message);
      // при успехе браузер уходит на страницу Google — дальнейшее не выполнится
    } catch {
      setMessage('Не удалось открыть вход через Google.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const fn =
        mode === 'signup'
          ? supabase.auth.signUp({ email, password })
          : supabase.auth.signInWithPassword({ email, password });
      const { error } = await fn;
      if (error) setMessage(error.message);
      else if (mode === 'signup') setMessage('Готово! Проверь почту, если нужна подтверждалка.');
    } catch {
      setMessage('Что-то пошло не так. Попробуй ещё раз.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="neon-auth">
      <style>{NEON_CSS}</style>
      <div className="neon-card">
        <h2 className="neon-title" data-text={mode === 'signin' ? 'ВХОД' : 'РЕГИСТРАЦИЯ'}>
          {mode === 'signin' ? 'ВХОД' : 'РЕГИСТРАЦИЯ'}
        </h2>

        <form onSubmit={handleSubmit} className="neon-form">
          <input
            className="neon-input"
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="neon-input"
            type="password"
            placeholder="пароль (6+ символов)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <button className="neon-btn" type="submit" disabled={busy}>
            {busy ? '…' : mode === 'signin' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>

        <div className="neon-divider"><span>или</span></div>

        <button className="neon-google" onClick={handleGoogle} disabled={busy}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"/>
            <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33Z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"/>
          </svg>
          {mode === 'signin' ? 'Войти через Google' : 'Регистрация через Google'}
        </button>

        {message && <p className="neon-msg">{message}</p>}

        <button
          className="neon-link"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          {mode === 'signin' ? 'Нет аккаунта? Зарегистрируйся' : 'Уже есть аккаунт? Войти'}
        </button>

        {onGuest && (
          <button className="neon-link" onClick={onGuest} disabled={busy}>
            Зайти как гость
          </button>
        )}
      </div>
    </section>
  );
}

const NEON_CSS = `
.neon-auth{
  position:fixed; inset:0; z-index:50;
  display:flex; align-items:center; justify-content:center;
  padding:24px; box-sizing:border-box;
  background:#000;
  font-family:'Segoe UI',system-ui,sans-serif;
}
.neon-card{
  width:100%; max-width:360px;
  display:flex; flex-direction:column; gap:16px;
  padding:28px 24px;
  background:linear-gradient(160deg,#04060f 0%,#070b1f 60%,#020308 100%);
  border:1px solid #1b3a8f;
  border-radius:16px;
  box-shadow:
    0 0 0 1px rgba(0,170,255,.18),
    0 0 18px rgba(0,140,255,.35),
    0 0 48px rgba(0,90,255,.25),
    inset 0 0 28px rgba(0,80,200,.12);
}
.neon-title{
  margin:0 0 4px; text-align:center;
  font-weight:800; letter-spacing:3px; font-size:26px;
  color:#bfeaff;
  text-shadow:0 0 6px #2bb8ff, 0 0 14px #1184ff, 0 0 28px #0a5bff;
  animation:neonPulse 2.4s ease-in-out infinite;
}
@keyframes neonPulse{
  0%,100%{ text-shadow:0 0 6px #2bb8ff,0 0 14px #1184ff,0 0 28px #0a5bff; }
  50%{ text-shadow:0 0 10px #6fd6ff,0 0 22px #2ba0ff,0 0 40px #1466ff; }
}
.neon-form{ display:flex; flex-direction:column; gap:14px; }
.neon-input{
  width:100%; box-sizing:border-box;
  padding:12px 14px;
  background:rgba(3,8,22,.85);
  color:#dff3ff;
  border:1px solid #234aa0;
  border-radius:10px;
  font-size:15px;
  outline:none;
  transition:border-color .15s, box-shadow .15s;
}
.neon-input::placeholder{ color:#5d7bb5; }
.neon-input:focus{
  border-color:#2bb8ff;
  box-shadow:0 0 8px rgba(43,184,255,.6), inset 0 0 10px rgba(43,184,255,.18);
}
.neon-btn{
  margin-top:2px; padding:12px 14px;
  background:linear-gradient(180deg,#0a2a66,#06163a);
  color:#eaf7ff;
  border:1px solid #2bb8ff;
  border-radius:10px;
  font-weight:700; letter-spacing:1px; font-size:15px;
  cursor:pointer;
  text-shadow:0 0 6px rgba(120,210,255,.8);
  box-shadow:0 0 10px rgba(43,140,255,.5), inset 0 0 12px rgba(43,140,255,.2);
  transition:transform .08s, box-shadow .15s, background .15s;
}
.neon-btn:hover:not(:disabled){
  background:linear-gradient(180deg,#0e3a8c,#08204f);
  box-shadow:0 0 16px rgba(70,180,255,.8), inset 0 0 16px rgba(70,180,255,.3);
}
.neon-btn:active:not(:disabled){ transform:translateY(1px); }
.neon-btn:disabled{ opacity:.55; cursor:default; }
.neon-link{
  background:none; border:none;
  color:#5fb6ff; font-size:13px; cursor:pointer;
  padding:4px; text-align:center;
  text-shadow:0 0 6px rgba(60,150,255,.5);
  transition:color .15s, text-shadow .15s;
}
.neon-link:hover:not(:disabled){
  color:#9fd8ff; text-shadow:0 0 10px rgba(120,200,255,.9);
}
.neon-link:disabled{ opacity:.5; cursor:default; }
.neon-msg{
  margin:0; text-align:center; font-size:13px;
  color:#9fd0ff; text-shadow:0 0 8px rgba(60,150,255,.5);
}
.neon-divider{
  display:flex; align-items:center; gap:10px;
  color:#3f5d99; font-size:12px; letter-spacing:2px;
}
.neon-divider::before,.neon-divider::after{
  content:''; flex:1; height:1px;
  background:linear-gradient(90deg,transparent,#234aa0,transparent);
}
.neon-google{
  display:flex; align-items:center; justify-content:center; gap:10px;
  width:100%; box-sizing:border-box;
  padding:11px 14px;
  background:rgba(6,12,30,.9);
  color:#eaf7ff;
  border:1px solid #2bb8ff;
  border-radius:10px;
  font-weight:700; font-size:14px; letter-spacing:.5px;
  cursor:pointer;
  box-shadow:0 0 10px rgba(43,140,255,.45), inset 0 0 12px rgba(43,140,255,.15);
  transition:box-shadow .15s, background .15s, transform .08s;
}
.neon-google svg{ background:#fff; border-radius:3px; padding:1px; }
.neon-google:hover:not(:disabled){
  background:rgba(10,22,55,.95);
  box-shadow:0 0 16px rgba(70,180,255,.75), inset 0 0 16px rgba(70,180,255,.25);
}
.neon-google:active:not(:disabled){ transform:translateY(1px); }
.neon-google:disabled{ opacity:.55; cursor:default; }
`;
