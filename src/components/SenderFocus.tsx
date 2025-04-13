
import React from 'react';
import { X, Clock, User, Activity, MessageSquare, Calendar, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChatAnalysis } from '@/context/ChatAnalysisContext';
import EmojiCloud from './EmojiCloud';
import FloatingEmoji from './FloatingEmoji';
import { Separator } from '@/components/ui/separator';
import type { SenderStats } from '../lib/analyzeChat';

interface SenderFocusProps {
  sender: string;
  stats: SenderStats;
  onClose: () => void;
}

const SenderFocus: React.FC<SenderFocusProps> = ({ sender, stats, onClose }) => {
  const positiveRatio = stats.keywordCounts.positive / (stats.keywordCounts.positive + stats.keywordCounts.negative || 1);
  const questionRatio = stats.keywordCounts.questions / stats.messageCount;
  const laughRatio = stats.keywordCounts.laughter / stats.messageCount;
  
  const emojiData = Object.entries(stats.emojiCounts).map(([emoji, count]) => ({ emoji, count }));
  
  // Calculate a "personality trait" based on message patterns
  const getPersonalityTraits = () => {
    const traits = [];
    
    if (stats.averageLength > 100) traits.push("Detalhista 📝");
    else if (stats.averageLength < 20) traits.push("Direto ao Ponto ⚡");
    
    if (positiveRatio > 0.7) traits.push("Otimista ☀️");
    else if (positiveRatio < 0.3) traits.push("Realista 🔍");
    
    if (questionRatio > 0.2) traits.push("Curioso 🤔");
    if (laughRatio > 0.3) traits.push("Bem Humorado 😄");
    
    if (stats.punctuationEmphasisCount > stats.messageCount * 0.1) 
      traits.push("Expressivo!!!");
    
    if (stats.capsWordCount > stats.messageCount * 0.1)
      traits.push("ENFÁTICO");
      
    if (traits.length === 0) traits.push("Equilibrado ⚖️");
    
    return traits;
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-purple-600/90 to-indigo-800/90 rounded-xl w-full max-w-md max-h-[80vh] overflow-auto">
        <div className="p-4 sticky top-0 bg-inherit z-10 flex items-center justify-between border-b border-white/20">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <h2 className="text-xl font-bold">{sender}</h2>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-4">
          <Tabs defaultValue="profile">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="stats">Estatísticas</TabsTrigger>
              <TabsTrigger value="emojis">Emojis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="pt-4 space-y-4">
              <div className="text-center">
                <div className="inline-block bg-white/20 rounded-full p-6 mb-2">
                  <User className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-bold">{sender}</h3>
                <p className="text-sm opacity-70">{stats.messageCount} mensagens</p>
              </div>
              
              <Separator className="bg-white/20" />
              
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Traços da Personalidade
                </h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {getPersonalityTraits().map((trait, i) => (
                    <span key={i} className="bg-white/20 rounded-full px-3 py-1 text-sm">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
              
              <Separator className="bg-white/20" />
              
              <div>
                <h4 className="font-semibold mb-2">Visão Cósmica</h4>
                <p className="text-sm bg-white/10 rounded-lg p-3">
                  {positiveRatio > 0.7 ? 
                    `${sender} traz luz para a conversa com sua energia positiva radiante. Uma presença acolhedora!` : 
                    positiveRatio < 0.3 ? 
                    `${sender} traz profundidade para as conversas, com uma intensidade que equilibra o grupo.` : 
                    `${sender} traz um equilíbrio perfeito de leveza e profundidade para o chat.`
                  }
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="stats" className="pt-4 space-y-4">
              <div className="space-y-3">
                <div className="bg-white/10 rounded-lg p-3 flex justify-between">
                  <span className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Mensagens
                  </span>
                  <span className="font-bold">{stats.messageCount}</span>
                </div>
                
                <div className="bg-white/10 rounded-lg p-3 flex justify-between">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Tamanho Médio
                  </span>
                  <span className="font-bold">{stats.averageLength} caracteres</span>
                </div>
                
                {stats.averageResponseTimeMinutes !== null && (
                  <div className="bg-white/10 rounded-lg p-3 flex justify-between">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Tempo de Resposta
                    </span>
                    <span className="font-bold">{stats.averageResponseTimeMinutes} min</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-xs opacity-70 mb-1">Risadas</div>
                    <div className="text-lg font-bold">{stats.keywordCounts.laughter || 0}</div>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-xs opacity-70 mb-1">Perguntas</div>
                    <div className="text-lg font-bold">{stats.keywordCounts.questions || 0}</div>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-xs opacity-70 mb-1">Palavras Positivas</div>
                    <div className="text-lg font-bold">{stats.keywordCounts.positive || 0}</div>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-xs opacity-70 mb-1">Palavras Negativas</div>
                    <div className="text-lg font-bold">{stats.keywordCounts.negative || 0}</div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="emojis" className="pt-4">
              {emojiData.length > 0 ? (
                <>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Smile className="h-4 w-4 mr-2" />
                    Universo de Emojis
                  </h4>
                  <EmojiCloud emojis={emojiData} />
                </>
              ) : (
                <div className="text-center py-8 opacity-70">
                  <FloatingEmoji emoji="🔍" size="lg" animated={false} />
                  <p className="mt-2">Nenhum emoji encontrado nas mensagens</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SenderFocus;
