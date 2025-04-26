    // src/components/Dashboard/Dashboard.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser } = useAuth();

  return (
    <div className="dashboard-container">
      <h1>Bem-vindo, {currentUser?.displayName}</h1>
      <p>Email: {currentUser?.email}</p>
      {/* Adicione mais conteúdo conforme necessário */}
    </div>
  );
};

export default Dashboard;