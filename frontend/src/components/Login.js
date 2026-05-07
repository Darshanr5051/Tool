import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false });
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const cardRef = useRef(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation (-10 to 10 degrees)
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    card.style.transition = 'none';
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
  };

  /* ── Canvas circuit board ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const CELL = 55;
    let nodes = [], traces = [], pulses = [];
    
    let mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const initCircuit = () => {
      nodes = []; traces = []; pulses = [];
      const cols = Math.ceil(canvas.width / CELL) + 2;
      const rows = Math.ceil(canvas.height / CELL) + 2;
      const map = new Map();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const active = Math.random() > 0.48;
          const node = { 
            baseX: c * CELL, baseY: r * CELL, 
            x: c * CELL, y: r * CELL, 
            active, 
            pulse: Math.random() * Math.PI * 2, 
            speed: 0.016 + Math.random() * 0.014 
          };
          map.set(`${c},${r}`, node);
          if (active) nodes.push(node);
        }
      }
      map.forEach((node, key) => {
        if (!node.active) return;
        const [c, r] = key.split(',').map(Number);
        const right = map.get(`${c + 1},${r}`);
        const down = map.get(`${c},${r + 1}`);
        if (right?.active && Math.random() > 0.28) traces.push({ n1: node, n2: right });
        if (down?.active && Math.random() > 0.28) traces.push({ n1: node, n2: down });
      });
      const n = Math.max(10, Math.floor(traces.length * 0.13));
      for (let i = 0; i < n; i++) {
        const t = traces[Math.floor(Math.random() * traces.length)];
        if (t) pulses.push({ trace: t, progress: Math.random(), speed: 0.003 + Math.random() * 0.004 });
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initCircuit();
    };

    const draw = () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const nodeR      = isLight ? '85,109,247'             : '0,229,255';
      const pulseCore  = isLight ? '#556df7'                : '#00e5ff';
      const pulseStop0 = isLight ? 'rgba(85,109,247,0.75)' : 'rgba(0,229,255,0.85)';
      const pulseStop1 = isLight ? 'rgba(85,109,247,0.25)' : 'rgba(0,229,255,0.30)';

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      /* interact nodes with mouse */
      nodes.forEach(node => {
        const dx = mouse.x - node.baseX;
        const dy = mouse.y - node.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 120;
        
        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist;
          node.x = node.baseX - (dx * force * 0.4);
          node.y = node.baseY - (dy * force * 0.4);
        } else {
          node.x += (node.baseX - node.x) * 0.1;
          node.y += (node.baseY - node.y) * 0.1;
        }
      });

      /* traces */
      ctx.strokeStyle = isLight ? 'rgba(85,109,247,0.15)' : 'rgba(0,229,255,0.15)';
      ctx.lineWidth = 1;
      traces.forEach(t => { 
        ctx.beginPath(); 
        ctx.moveTo(t.n1.x, t.n1.y); 
        ctx.lineTo(t.n2.x, t.n2.y); 
        ctx.stroke(); 
      });

      /* nodes */
      nodes.forEach(node => {
        node.pulse += node.speed;
        const a = 0.22 + Math.sin(node.pulse) * 0.18;
        const g = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 7);
        g.addColorStop(0, `rgba(${nodeR},${a})`); g.addColorStop(1, `rgba(${nodeR},0)`);
        ctx.beginPath(); ctx.arc(node.x, node.y, 7, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(node.x, node.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${nodeR},${0.5 + Math.sin(node.pulse) * 0.3})`; ctx.fill();
      });

      /* signal pulses */
      pulses.forEach(p => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        const x = p.trace.n1.x + (p.trace.n2.x - p.trace.n1.x) * p.progress;
        const y = p.trace.n1.y + (p.trace.n2.y - p.trace.n1.y) * p.progress;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 12);
        g.addColorStop(0, pulseStop0); g.addColorStop(0.35, pulseStop1); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fillStyle = pulseCore; ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => { 
      cancelAnimationFrame(animId); 
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => { if (user) navigate('/dashboard'); }, [user, navigate]);

  const errors = {
    username: username.trim() ? '' : 'Required',
    password: password.trim() ? '' : 'Required',
  };

  const hasErrors = Boolean(errors.username || errors.password);

  const submitLogin = async (u, p) => {
    setLoading(true);
    try {
      const result = await login(u, p);
      if (result.success) {
        toast.success('Welcome back');
        navigate('/dashboard');
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ username: true, password: true });
    if (hasErrors) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    await submitLogin(username, password);
  };

  const handleForgotPassword = () => {
    toast.info('Please contact admin to reset your password');
  };

  return (
    <div className="login-page">
      <canvas ref={canvasRef} className="login-canvas" />
      <div className="login-theme-pos">
        <ThemeToggle />
      </div>

      <div 
        className="login-box" 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        {/* System tag */}

        {/* Logo */}
        <div className="login-logo-section">
          {logoOk ? (
            <img
              className="login-logo-img"
              src={`${process.env.PUBLIC_URL}/logo.png`}
              alt="Logo"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <div className="login-logo-mark">S</div>
          )}
          <h1 className="login-logo-text" style={{ transform: 'translateZ(30px)' }}>{getGreeting()}</h1>
          <p className="login-logo-sub" style={{ transform: 'translateZ(20px)' }}>Hardware Inventory Portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="field">
            <label className="field-label">Email or Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, username: true }))}
              className={`field-input${touched.username && errors.username ? ' has-error' : ''}`}
              placeholder="Darshan@siqol.com"
              autoComplete="username"
              disabled={loading}
              autoFocus
            />
            {touched.username && errors.username ? (
              <div className="field-error">{errors.username}</div>
            ) : null}
          </div>

          <div className="field">
            <label className="field-label">Password</label>
            <div className="field-input-wrap">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                onKeyUp={(e) => setCapsLockOn(Boolean(e.getModifierState && e.getModifierState('CapsLock')))}
                className={`field-input has-action${touched.password && errors.password ? ' has-error' : ''}`}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="field-action"
                onClick={() => setShowPwd(!showPwd)}
                tabIndex={-1}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
                disabled={loading}
              >
                {showPwd ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {capsLockOn ? <div className="field-warn">Caps Lock is on</div> : null}
            {touched.password && errors.password ? (
              <div className="field-error">{errors.password}</div>
            ) : null}
          </div>

          <div className="login-row">
            <label className="login-check">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span>Remember me</span>
            </label>
            <button type="button" className="login-link" onClick={handleForgotPassword} disabled={loading}>
              Forgot password?
            </button>
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? <span className="btn-spinner"></span> : <><span>Sign in</span><FiArrowRight /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;