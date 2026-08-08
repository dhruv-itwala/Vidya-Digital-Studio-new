import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clientApi from '../../api/clientAxios';
import toast from 'react-hot-toast';
import styles from './ClientLogin.module.css';

const ClientLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await clientApi.post('/client-portal/login', { email, password });
      localStorage.setItem('clientToken', res.data.token);
      localStorage.setItem('clientData', JSON.stringify(res.data.data));
      navigate('/client-portal');
      toast.success('Login successful');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logoSection}>
          <h2>Client Portal</h2>
          <p>Sign in to your account</p>
        </div>
        <form onSubmit={handleLogin} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <label>Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" className={styles.loginButton}>Sign In</button>
        </form>
      </div>
    </div>
  );
};

export default ClientLogin;
