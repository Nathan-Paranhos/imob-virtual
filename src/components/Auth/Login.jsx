// src/components/Auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaLock, FaUserPlus, FaUser, FaSpinner } from 'react-icons/fa';
import { loginUser, registerUser } from '../../services/firebase';
import Logo from '../UI/Logo';
import './Login.css';
import { useHistory } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const history = useHistory();

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedBefore');
    if (!hasVisited) {
      setShowWelcome(true);
      localStorage.setItem('hasVisitedBefore', 'true');
    }
  }, []);

  const closeWelcome = () => {
    setShowWelcome(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email.includes('@') || !email.includes('.')) {
      setError('Por favor, insira um e-mail válido.');
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const user = await loginUser(email, password);
        console.log('Login bem-sucedido:', user.uid);
        onLogin({ 
          uid: user.uid,
          email: user.email, 
          name: user.displayName || 'Usuário' 
        });
        history.push('/dashboard'); // Redirect to dashboard on successful login
      } else {
        const user = await registerUser(email, password, name);
        console.log('Registro bem-sucedido:', user.uid);
        onLogin({ 
          uid: user.uid,
          email: user.email, 
          name: user.displayName || name 
        });
        history.push('/dashboard'); // Redirect to dashboard on successful registration
      }
    } catch (err) {
      console.error("Erro de autenticação:", err);
      
      // Tratamento de erros mais robusto
      if (err.code) {
        switch (err.code) {
          case 'auth/configuration-not-found':
            setError('Erro de configuração. Por favor, tente novamente mais tarde.');
            break;
          case 'auth/email-already-in-use':
            setError('Este e-mail já está sendo usado. Tente fazer login.');
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            setError('E-mail ou senha incorretos.');
            break;
          case 'auth/too-many-requests':
            setError('Muitas tentativas. Tente novamente mais tarde.');
            break;
          case 'auth/network-request-failed':
            setError('Erro de conexão. Verifique sua internet.');
            break;
          default:
            setError('Ocorreu um erro. Tente novamente.');
        }
      } else {
        setError('Ocorreu um erro desconhecido. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {showWelcome && (
        <div className="welcome-modal">
          <div className="welcome-content">
            <h2>Bem-vindo ao ImmoVision!</h2>
            <p>A plataforma completa para visualização e gestão de imóveis em 3D.</p>
            <p>Crie sua conta para começar a explorar todas as funcionalidades.</p>
            <button className="btn primary" onClick={closeWelcome}>Começar</button>
          </div>
        </div>
      )}
      
      <div className="login-card">
        <div className="login-logo">
          <Logo />
        </div>
        <h2>{isLogin ? 'Acesso à Plataforma' : 'Criar Nova Conta'}</h2>
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Nome Completo</label>
              <div className="input-with-icon">
                <FaUser className="input-icon" aria-hidden="true" />
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digite seu nome completo"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <div className="input-with-icon">
              <FaEnvelope className="input-icon" aria-hidden="true" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <div className="input-with-icon">
              <FaLock className="input-icon" aria-hidden="true" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
                disabled={loading}
              />
            </div>
            <small className="password-hint">Mínimo de 6 caracteres</small>
          </div>
          
          {error && <p className="error-message">{error}</p>}
          
          <button type="submit" className="btn primary login-btn" disabled={loading}>
            {loading ? (
              <>
                <FaSpinner className="spinner-icon" /> Processando...
              </>
            ) : (
              isLogin ? 'Entrar' : 'Criar Conta'
            )}
          </button>
        </form>
        
        <div className="login-footer">
          <button
            className="toggle-auth"
            onClick={() => setIsLogin(!isLogin)}
            disabled={loading}
          >
            {isLogin ? (
              <>
                <FaUserPlus aria-hidden="true" /> Não tem uma conta? Registre-se
              </>
            ) : (
              'Já tem uma conta? Faça login'
            )}
          </button>
        </div>
        
        <div className="login-credits">
          <p>Desenvolvido por Nathan Silva</p>
        </div>
      </div>
    </div>
  );
};

export default Login;