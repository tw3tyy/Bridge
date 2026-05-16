import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Award, Star, Info, User, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import '../../index.css';

const AuthScreen = () => {
  const { language, setAuthToken, setUserName, setXp, setLevel } = useSettings();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { email, password } 
      : { username: name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error?.message || 'Ошибка сервера');
      }

      // Success
      setAuthToken(data.token);
      setUserName(data.user.username);
      setXp(data.user.xp || 0);
      setLevel(data.user.level || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const t = {
    loginTitle: language === 'en' ? 'Welcome Back' : language === 'kk' ? 'Қайта оралуыңызбен' : 'С возвращением',
    regTitle: language === 'en' ? 'Create Account' : language === 'kk' ? 'Тіркелу' : 'Создать аккаунт',
    nameLabel: language === 'en' ? 'Username' : language === 'kk' ? 'Пайдаланушы аты' : 'Имя пользователя',
    emailLabel: language === 'en' ? 'Email' : language === 'kk' ? 'Электрондық пошта' : 'Email',
    passLabel: language === 'en' ? 'Password' : language === 'kk' ? 'Құпия сөз' : 'Пароль',
    loginBtn: language === 'en' ? 'Log In' : language === 'kk' ? 'Кіру' : 'Войти',
    regBtn: language === 'en' ? 'Register' : language === 'kk' ? 'Тіркелу' : 'Зарегистрироваться',
    switchReg: language === 'en' ? "Don't have an account? Sign up" : language === 'kk' ? 'Аккаунтыңыз жоқ па? Тіркеліңіз' : 'Нет аккаунта? Зарегистрируйтесь',
    switchLog: language === 'en' ? "Already have an account? Log in" : language === 'kk' ? 'Бұрын тіркелгенсіз бе? Кіріңіз' : 'Уже есть аккаунт? Войти',
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel" style={{ padding: '3rem 2rem', maxWidth: '400px', margin: '2rem auto', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={40} color="var(--primary)" />
        </div>
      </div>
      <h2 style={{ marginBottom: '2rem', fontSize: '1.8rem' }}>{isLogin ? t.loginTitle : t.regTitle}</h2>
      
      {error && (
        <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {!isLogin && (
          <input required type="text" placeholder={t.nameLabel} value={name} onChange={(e) => setName(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--glass-border)' }} />
        )}
        <input required type="email" placeholder={t.emailLabel} value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--glass-border)' }} />
        <input required type="password" placeholder={t.passLabel} value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--glass-border)' }} />
        
        <button type="submit" disabled={loading} className="glass-btn primary" style={{ marginTop: '1rem', padding: '1rem' }}>
          {loading ? <Loader2 className="animate-spin" /> : (isLogin ? <><LogIn size={20}/> {t.loginBtn}</> : <><UserPlus size={20}/> {t.regBtn}</>)}
        </button>
      </form>
      
      <button onClick={() => { setIsLogin(!isLogin); setError(''); }} style={{ marginTop: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
        {isLogin ? t.switchReg : t.switchLog}
      </button>
    </motion.div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { language, userName, setUserName, xp, level, authToken, setAuthToken } = useSettings();

  const handleLogout = () => {
    setUserName('');
    setAuthToken('');
    localStorage.removeItem('bridgeUserName');
    localStorage.removeItem('bridgeAuthToken');
  };

  const t = {
    title: language === 'en' ? 'PROFILE' : language === 'kk' ? 'ПРОФИЛЬ' : 'ПРОФИЛЬ',
    subtitle: language === 'en' ? 'Gamification & Progress' : language === 'kk' ? 'Ойындандыру және Жетістіктер' : 'Геймификация & Уровни',
    lvl: language === 'en' ? `Level ${level}` : language === 'kk' ? `${level}-ші деңгей` : `Уровень ${level}`,
    rank: language === 'en' ? 'Rank: Beginner' : language === 'kk' ? 'Дәреже: Үйренуші' : 'Ранг: Новичок',
    expTitle: language === 'en' ? 'How to earn XP?' : language === 'kk' ? 'Тәжірибе ұпайларын қалай жинауға болады?' : 'За что дают опыт? (Геймификация)',
    exp1: language === 'en' ? '+10 XP: For every specific AI description request in Vision Mode. Promotes spatial independence.' : language === 'kk' ? '+10 XP: Көру режимінде қоршаған ортаны әрбір сұрағаныңыз үшін. Кеңістікте өз бетінше жүруді дамытады.' : '+10 XP: За каждый запрос ИИ на описание окружения (Зрение). Тренирует самостоятельность в пространстве.',
    exp2: language === 'en' ? '+5 XP: For analyzing environmental sounds in Hearing Mode. Improves safety awareness.' : language === 'kk' ? '+5 XP: Есту режимінде қоршаған орта дыбыстарын әрбір талдағаныңыз үшін. Қауіпсіздікті арттырады.' : '+5 XP: За каждое обработанное звуковое предупреждение среды (Слух). Улучшает безопасность.',
    exp3: language === 'en' ? '+10 XP: For generating correct speech options. Develops social skills.' : language === 'kk' ? '+10 XP: Әрбір дұрыс сұхбат фразасын құрастырғаныңыз үшін. Әлеуметтік дағдыларды дамытады.' : '+10 XP: За каждую сгенерированную правильную фразу общения (Речь). Развивает социальные навыки.',
    expGoal: language === 'en' ? 'Goal: Motivate users to interact actively with AI, navigate outside, and communicate, raising their "Independence Rank".' : language === 'kk' ? 'Мақсаты: Пайдаланушыларды ИИ-мен белсенді әрекеттесуге, далаға шығуға және қарым-қатынас жасауға ынталандыру, сол арқылы "Тәуелсіздік дәрежесін" көтеру.' : 'Цель системы: мотивировать пользователей активно взаимодействовать с ИИ, выходить на улицу и общаться, повышая свой "Ранг независимости".',
    achvTitle: language === 'en' ? 'Your Achievements' : language === 'kk' ? 'Сіздің жетістіктеріңіз' : 'Ваши достижения',
    achvEmpty: language === 'en' ? 'You have no achievements yet. Start using Bridge to unlock them!' : language === 'kk' ? 'Сізде әлі жетістіктер жоқ. Оларды ашу үшін Bridge қолданбасын пайдалануды бастаңыз!' : 'Вы пока не получили достижений. Начните использовать Bridge, чтобы открыть их!',
    welcome: language === 'en' ? 'Welcome' : language === 'kk' ? 'Қош келдіңіз' : 'Добро пожаловать',
    logout: language === 'en' ? 'Log out' : language === 'kk' ? 'Шығу' : 'Выйти'
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/')} className="glass-btn" style={{ padding: '0.5rem 1rem' }}>
          <ArrowLeft size={24} /> {language === 'en' ? 'Back' : language === 'kk' ? 'Артқа' : 'Назад'}
        </button>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{t.title}</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t.subtitle}</div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {(!authToken || !userName) ? (
          <AuthScreen key="auth" />
        ) : (
          <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: '1.5rem', alignItems: 'start' }}>
            
            {/* Profile Stats */}
            <motion.div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--bg-dark), var(--primary-glow))', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Star size={48} color="white" className="animate-pulse-glow" style={{ borderRadius: '50%' }} />
              </div>
              <h2 style={{ fontSize: '1.8rem', marginTop: '1rem', textAlign: 'center' }}>
                 {t.lvl}
              </h2>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent)' }}>{t.welcome}, {userName}!</div>
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                {t.rank}
              </p>
              
              <div style={{ width: '100%', marginTop: '1rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
                   <span>XP</span>
                   <span>{xp} / 100 XP</span>
                 </div>
                 <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
                   <div style={{ width: `${Math.min(xp, 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent))', transition: 'width 0.5s ease' }}></div>
                 </div>
              </div>

              <button onClick={handleLogout} className="glass-btn" style={{ marginTop: '1rem', width: '100%', fontSize: '0.9rem', padding: '0.5rem' }}>
                 {t.logout}
              </button>
            </motion.div>

            {/* Explainers & Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <motion.div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Info color="var(--accent)" size={20} /> {t.expTitle}
                </h3>
                <ul style={{ color: 'var(--text-muted)', lineHeight: '1.6', paddingLeft: '1.5rem' }}>
                  <li style={{ marginBottom: '0.5rem' }}><b>+10 XP:</b> {t.exp1}</li>
                  <li style={{ marginBottom: '0.5rem' }}><b>+5 XP:</b> {t.exp2}</li>
                  <li><b>+10 XP:</b> {t.exp3}</li>
                </ul>
                <p style={{ color: 'white', marginTop: '1rem', fontStyle: 'italic', borderLeft: '3px solid var(--accent)', paddingLeft: '1rem' }}>
                  {t.expGoal}
                </p>
              </motion.div>

              <motion.div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Award color="var(--secondary)" /> {t.achvTitle}
                </h3>
                
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                   <p>{t.achvEmpty}</p>
                   <br />
                   <div className="animate-float" style={{ display: 'inline-block', opacity: 0.5, border: '1px dashed var(--glass-border)', padding: '1rem', borderRadius: '1rem' }}>
                      <Award size={32} />
                   </div>
                </div>
              </motion.div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
