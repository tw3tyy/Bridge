import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, Flame, Star, Zap, Activity, Info } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import '../../index.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { language } = useSettings();

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/')} className="glass-btn" style={{ padding: '0.5rem 1rem' }}>
          <ArrowLeft size={24} /> {language === 'en' ? 'Back' : 'Назад'}
        </button>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
            {language === 'en' ? 'PROFILE' : language === 'kk' ? 'ПРОФИЛЬ' : 'ПРОФИЛЬ'}
          </h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {language === 'en' ? 'Gamification & Progress' : 'Геймификация & Уровни'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Profile Stats */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--bg-dark), var(--primary-glow))', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Star size={48} color="white" />
          </div>
          <h2 style={{ fontSize: '1.8rem', marginTop: '1rem' }}>
             {language === 'en' ? 'Level 1' : language === 'kk' ? '1 Деңгей' : 'Уровень 1'}
          </h2>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
            {language === 'en' ? 'Rank: Beginner' : language === 'kk' ? 'Дәреже: Жаңадан бастаушы' : 'Ранг: Новичок'}
          </p>
          
          <div style={{ width: '100%', marginTop: '1rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
               <span>XP</span>
               <span>0 / 100 XP</span>
             </div>
             <div style={{ width: '100%', height: '8px', background: 'var(--bg-dark)', borderRadius: '4px', overflow: 'hidden' }}>
               <div style={{ width: '0%', height: '100%', background: 'var(--primary)' }}></div>
             </div>
          </div>
        </motion.div>

        {/* Explainers & Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Info color="var(--accent)" size={20} /> За что дают опыт? (Геймификация)
            </h3>
            <ul style={{ color: 'var(--text-muted)', lineHeight: '1.6', paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.5rem' }}><b>+10 XP:</b> За каждый запрос ИИ на описание окружения (Зрение). Тренирует самостоятельность в пространстве.</li>
              <li style={{ marginBottom: '0.5rem' }}><b>+5 XP:</b> За каждое обработанное звуковое предупреждение среды (Слух). Улучшает безопасность.</li>
              <li><b>+10 XP:</b> За каждую сгенерированную правильную фразу общения (Речь). Развивает социальные навыки.</li>
            </ul>
            <p style={{ color: 'var(--text-main)', marginTop: '1rem', fontStyle: 'italic' }}>
              Цель системы: мотивировать пользователей активно взаимодействовать с ИИ, выходить на улицу и общаться, повышая свой "Ранг независимости".
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award color="var(--secondary)" /> Ваши достижения
            </h3>
            
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
               <p>Вы пока не получили достижений. Начните использовать Bridge, чтобы открыть их!</p>
               <br />
               <div style={{ display: 'inline-block', opacity: 0.5, border: '1px dashed var(--glass-border)', padding: '1rem', borderRadius: '1rem' }}>
                  <Award size={32} />
               </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
