import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { sfx } from '../lib/sfx';

interface Props {
  userEmail: string;
  userId?: string | null;
  onPlay: () => void;
  onExit?: () => void;
}

type ReviewStatus = 'idle' | 'saving' | 'saved' | 'error';

interface Review {
  id: string;
  body: string;
  created_at: string;
}

const controls = [
  ['A / D', 'Движение'],
  ['W / Пробел', 'Прыжок'],
  ['ЛКМ', 'Атака'],
  ['ПКМ', 'Щит'],
  ['K', 'Рывок'],
  ['Q', 'Уворот'],
];

export function StartScreen({ userEmail, userId, onPlay, onExit }: Props) {
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('idle');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');

  useEffect(() => {
    sfx.stopMusic();
  }, []);

  const handlePlay = () => {
    sfx.init();
    sfx.resume();
    sfx.startMusic('cave');
    onPlay();
  };

  useEffect(() => {
    if (!reviewsOpen || !userId) {
      setReviews([]);
      setReviewsError('');
      return;
    }

    let cancelled = false;

    const loadReviews = async () => {
      setReviewsLoading(true);
      setReviewsError('');

      const { data, error } = await supabase
        .from('reviews')
        .select('id, body, created_at')
        .order('created_at', { ascending: false });

      if (cancelled) return;

      setReviewsLoading(false);
      if (error) {
        setReviewsError(error.message);
        return;
      }

      setReviews(data ?? []);
    };

    void loadReviews();

    return () => {
      cancelled = true;
    };
  }, [reviewsOpen, userId]);

  const submitReview = async () => {
    const body = reviewText.trim();
    if (!userId || body.length < 3 || reviewStatus === 'saving') return;

    setReviewStatus('saving');
    setReviewsError('');

    const { data, error } = await supabase
      .from('reviews')
      .insert({ body })
      .select('id, body, created_at')
      .single();

    if (error || !data) {
      setReviewsError(error?.message ?? 'Отзыв не сохранился.');
      setReviewStatus('error');
      return;
    }

    setReviews((current) => [data, ...current]);
    setReviewText('');
    setReviewStatus('saved');
  };

  const name = userEmail.split('@')[0] || 'Гость';
  const canSubmitReview = Boolean(userId && reviewText.trim().length >= 3 && reviewStatus !== 'saving');

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

        <button
          onClick={() => setReviewsOpen(true)}
          style={{
            display: 'block',
            margin: '16px auto 0',
            background: 'rgba(9, 18, 46, 0.72)',
            color: '#8fb4ff',
            fontFamily: 'monospace',
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: 2,
            padding: '11px 34px',
            borderRadius: 8,
            border: '1px solid #3157d6',
            boxShadow: '0 0 16px rgba(49,87,214,0.22)',
            cursor: 'pointer',
          }}
        >
          ОТЗЫВЫ
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

      {reviewsOpen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            background: 'rgba(1, 2, 10, 0.74)',
          }}
        >
          <div
            style={{
              width: 'min(430px, 100%)',
              borderRadius: 10,
              border: '1px solid #3157d6',
              background: 'linear-gradient(180deg, #101735 0%, #070b1d 100%)',
              boxShadow: '0 0 34px rgba(49,87,214,0.34)',
              padding: '24px 22px',
              boxSizing: 'border-box',
              textAlign: 'left',
              maxHeight: 'calc(100vh - 40px)',
              overflowY: 'auto',
            }}
          >
            <h2 style={{ margin: '0 0 16px', color: '#8fb4ff', letterSpacing: 3, fontSize: 22 }}>
              ОТЗЫВЫ
            </h2>
            <textarea
              value={reviewText}
              onChange={(e) => {
                setReviewText(e.target.value);
                if (reviewStatus !== 'idle') setReviewStatus('idle');
              }}
              maxLength={500}
              placeholder={userId ? 'Напиши свой отзыв...' : 'Войди в аккаунт, чтобы написать отзыв'}
              disabled={!userId || reviewStatus === 'saving'}
              style={{
                width: '100%',
                minHeight: 140,
                resize: 'vertical',
                boxSizing: 'border-box',
                margin: '4px 0 12px',
                padding: '12px 13px',
                border: '1px solid rgba(143,180,255,0.28)',
                borderRadius: 8,
                color: '#cfe2ff',
                background: 'rgba(2,8,26,0.82)',
                fontFamily: 'monospace',
                fontSize: 14,
                lineHeight: 1.45,
                outline: 'none',
              }}
            />

            {reviewStatus === 'saved' && (
              <p style={{ margin: '0 0 12px', color: '#91f2b1', fontSize: 13 }}>
                Отзыв сохранён.
              </p>
            )}
            {reviewStatus === 'error' && (
              <p style={{ margin: '0 0 12px', color: '#ff8fa3', fontSize: 13 }}>
                Не получилось сохранить отзыв.
              </p>
            )}

            <button
              onClick={submitReview}
              disabled={!canSubmitReview}
              style={{
                width: '100%',
                background: canSubmitReview ? '#274bcc' : 'rgba(62,77,130,0.55)',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: 2,
                padding: '11px 18px',
                borderRadius: 8,
                border: '1px solid #6688ff',
                cursor: canSubmitReview ? 'pointer' : 'default',
              }}
            >
              {reviewStatus === 'saving' ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ'}
            </button>
            {reviewsError && (
              <p style={{ margin: '12px 0 0', color: '#ff8fa3', fontSize: 12, lineHeight: 1.45 }}>
                {reviewsError.includes('reviews')
                  ? 'Таблица отзывов ещё не применена. Запусти npm run db:link, потом npm run db:push.'
                  : reviewsError}
              </p>
            )}
            <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
              {reviewsLoading && (
                <p style={{ margin: 0, color: '#5b6a99', fontSize: 12 }}>
                  Загрузка отзывов...
                </p>
              )}
              {!reviewsLoading && userId && reviews.length === 0 && (
                <p style={{ margin: 0, color: '#5b6a99', fontSize: 12 }}>
                  Пока нет отзывов.
                </p>
              )}
              {reviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    border: '1px solid rgba(143,180,255,0.18)',
                    borderRadius: 8,
                    background: 'rgba(2,8,26,0.54)',
                    padding: '10px 11px',
                  }}
                >
                  <p style={{ margin: 0, color: '#cfe2ff', fontSize: 13, lineHeight: 1.45 }}>
                    {review.body}
                  </p>
                  <p style={{ margin: '6px 0 0', color: '#4f5e86', fontSize: 11 }}>
                    {new Date(review.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setReviewsOpen(false);
                setReviewStatus('idle');
              }}
              style={{
                marginTop: 10,
                width: '100%',
                background: 'transparent',
                color: '#8fb4ff',
                fontFamily: 'monospace',
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 2,
                padding: '10px 18px',
                borderRadius: 8,
                border: '1px solid #2244aa',
                cursor: 'pointer',
              }}
            >
              ЗАКРЫТЬ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
