import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lock, Star, MessageSquare, Sparkles, ChevronRight } from 'lucide-react';
import GradientBackground from '@/components/GradientBackground';
import Logo from '@/components/Logo';
import { FloatingEmojiGroup } from '@/components/FloatingEmoji';
import AdBanner from '@/components/AdBanner';

const WelcomePage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/instructions');
  };

  // Features data
  const features = [
    {
      icon: <MessageSquare className="h-8 w-8 text-indigo-300" />,
      title: "Análise de Conversas",
      description: "Descubra quem fala mais, os horários de maior atividade e os emojis favoritos."
    },
    {
      icon: <Sparkles className="h-8 w-8 text-pink-300" />,
      title: "Horóscopo Personalizado",
      description: "Receba previsões baseadas no seu estilo único de comunicação."
    },
    {
      icon: <Star className="h-8 w-8 text-amber-300" />,
      title: "Insights Divertidos",
      description: "Descubra curiosidades sobre suas mensagens de forma descontraída."
    }
  ];

  return (
    <GradientBackground variant="purple">
      <FloatingEmojiGroup />
      
      <div className="flex flex-col justify-center items-center min-h-screen py-12 px-4 relative z-10">
        {/* Logo Animation */}
        <div className="mb-8 mt-12 md:mt-20 animate-fade-in">
          <Logo />
        </div>
        
        {/* Main Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4 animate-fade-in">
          Horóscopo das Mensagens
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl text-white/90 text-center mb-10 max-w-md animate-fade-in">
          Descubra a magia escondida nas suas conversas do WhatsApp!
        </p>
        
        {/* Stylized Illustration */}
        <div className="w-full max-w-sm mb-10 p-4 transform hover:scale-105 transition-transform duration-300">
          <div className="cosmic-card bg-white bg-opacity-20 py-8 animate-fade-in">
            <div className="flex justify-center space-x-4">
              <div className="w-20 h-36 bg-white/30 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-4xl">💬</span>
              </div>
              <div className="flex flex-col justify-center items-center">
                <div className="w-16 h-0.5 bg-white/50 mb-2"></div>
                <div className="w-16 h-0.5 bg-white/50 mb-2"></div>
                <div className="w-16 h-0.5 bg-white/50"></div>
              </div>
              <div className="w-20 h-36 bg-white/30 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-4xl">✨</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 w-full max-w-4xl animate-fade-in">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="cosmic-card flex flex-col items-center text-center p-6 hover:bg-white/30 transition-all duration-300"
            >
              <div className="mb-4 p-3 bg-white/20 rounded-full">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-white/80">{feature.description}</p>
            </div>
          ))}
        </div>
        
        {/* How It Works - Simplified */}
        <div className="mb-10 w-full max-w-3xl bg-white/10 rounded-2xl p-6 backdrop-blur-sm animate-fade-in">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Como Funciona?</h2>
          
          <div className="flex flex-col space-y-4">
            <div className="flex items-center">
              <div className="bg-white/20 p-3 rounded-full mr-4">
                <span className="text-xl">📱</span>
              </div>
              <div>
                <p className="text-white font-medium">Exporte seu chat do WhatsApp (formato .txt ou .zip)</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="bg-white/20 p-3 rounded-full mr-4">
                <span className="text-xl">⬆️</span>
              </div>
              <div>
                <p className="text-white font-medium">Faça upload aqui (tudo processado localmente no seu dispositivo)</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="bg-white/20 p-3 rounded-full mr-4">
                <span className="text-xl">✨</span>
              </div>
              <div>
                <p className="text-white font-medium">Receba sua análise completa com insights personalizados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Banner de Anúncio */}
        <div className="w-full flex justify-center mb-8">
          <AdBanner slot="1234567890" />
        </div>
        
        {/* Privacy Notice */}
        <div className="flex items-center justify-center mb-10 bg-white/20 rounded-lg p-3 max-w-md animate-fade-in">
          <Lock className="h-5 w-5 text-white mr-2" />
          <p className="text-sm text-white/90">
            <strong>Sua privacidade é prioridade!</strong> As mensagens são analisadas direto no seu celular e nunca saem dele.
          </p>
        </div>
        
        {/* CTA Button */}
        <Button 
          onClick={handleStart} 
          className="cosmic-btn text-lg w-4/5 max-w-md mb-8 group"
        >
          <span>Revelar meu Horóscopo!</span>
          <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </GradientBackground>
  );
};

export default WelcomePage;