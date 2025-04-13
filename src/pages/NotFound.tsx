
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import GradientBackground from '@/components/GradientBackground';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <GradientBackground variant="default">
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="cosmic-card text-center mb-6">
          <h1 className="text-6xl font-bold mb-4 gradient-text">404</h1>
          <p className="text-xl font-medium mb-6">Ops! Página não encontrada</p>
          <Button 
            onClick={() => navigate('/')}
            className="cosmic-btn"
          >
            Voltar à Página Inicial
          </Button>
        </div>
      </div>
    </GradientBackground>
  );
};

export default NotFound;
