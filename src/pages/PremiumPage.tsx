import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge"; // Import Badge
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { Label } from "@/components/ui/label"; // Import Label
import { ArrowLeft, BrainCircuit, Feather, Sparkles, Loader2, Users, Smile, HeartCrack, Percent, ThumbsUp, ThumbsDown, UserCheck } from 'lucide-react'; // Added UserCheck
import { useChatAnalysis } from '@/context/ChatAnalysisContext';
import { getFunctions, httpsCallable } from "firebase/functions";
import { firebaseApp } from '@/firebaseConfig';
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from 'sonner'; // Import toast
import AdBanner from '@/components/AdBanner';
import type { ParsedMessage } from '../lib/parseChat'; // Import ParsedMessage type

// Initialize Firebase Functions
const functions = getFunctions(firebaseApp);
const callGeminiFunction = httpsCallable(functions, 'callGemini');

// Constants for rate limiting (per feature)
const MIN_INTERVAL_MS = 30 * 1000; // 30 seconds minimum interval between calls for the SAME feature

// Type for AI feature keys
type AiFeatureType = 'prediction' | 'poem' | 'style' | 'flagPersonality';

// Helper to anonymize messages
const anonymizeMessages = (messages: ParsedMessage[]): string => {
  const senderMap: Record<string, string> = {};
  let senderCounter = 1;
  return messages
    .map(msg => {
      if (!msg.sender || msg.isSystemMessage) return null; // Skip system messages or messages without sender
      if (!senderMap[msg.sender]) {
        senderMap[msg.sender] = `Pessoa ${senderCounter++}`;
      }
      // Format: "Sender: Message"
      return `${senderMap[msg.sender]}: ${msg.message}`;
    })
    .filter(Boolean) // Remove null entries
    .join('\n'); // Join messages with newline
};

// Helper function to shuffle an array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
  }
  return shuffled;
}

// New component for rendering compatibility
interface RenderCompatibilityProps {
  analysisResults: ReturnType<typeof useChatAnalysis>['analysisResults'];
}

const RenderCompatibility: React.FC<RenderCompatibilityProps> = ({ analysisResults }) => {
  const compatibilityPairs = useMemo(() => {
    if (!analysisResults || !analysisResults.statsPerSender || Object.keys(analysisResults.statsPerSender).length < 2) {
      return { pairs: [], leftover: null };
    }

    const senders = Object.keys(analysisResults.statsPerSender);
    const shuffledSenders = shuffleArray(senders);
    const pairs: { p1: string; p2: string; score: number }[] = [];
    let leftover: string | null = null;

    for (let i = 0; i < shuffledSenders.length; i += 2) {
      if (i + 1 < shuffledSenders.length) {
        const score = Math.floor(Math.random() * 70) + 30; // Random % between 30 and 99
        pairs.push({ p1: shuffledSenders[i], p2: shuffledSenders[i + 1], score });
      } else {
        leftover = shuffledSenders[i]; // Odd one out
      }
    }
    return { pairs, leftover };
  }, [analysisResults]);

  if (!analysisResults || Object.keys(analysisResults.statsPerSender).length < 2) {
    return <p className="text-sm text-gray-500 italic">Compatibilidade aplicável apenas para 2 ou mais participantes.</p>;
  }

  return (
    <div className="space-y-2 text-sm">
      {compatibilityPairs.pairs.map((pair, index) => (
        <div key={index} className="flex items-center justify-between p-1 bg-pink-50 rounded-md">
          <span>{pair.p1} & {pair.p2}</span>
          <span className="font-semibold text-pink-700">{pair.score}% <Percent className="inline h-3 w-3" /></span>
        </div>
      ))}
      {compatibilityPairs.leftover && (
        <div className="flex items-center text-gray-600 italic mt-2">
          <HeartCrack className="w-4 h-4 mr-2 text-gray-500" />
          <span>{compatibilityPairs.leftover} ficou sem par... 😢</span>
        </div>
      )}
    </div>
  );
};


const PremiumPage: React.FC = () => {
  const {
    parsedMessages,
    setParsedMessages,
    analysisResults,
    setAnalysisResults,
    aiPrediction,
    setAiPrediction,
    aiPoem,
    setAiPoem,
    aiStyleAnalysis,
    setAiStyleAnalysis,
    generatedSign,
    selectedSender,
    aiFlagPersonalityAnalysis,
    setAiFlagPersonalityAnalysis
  } = useChatAnalysis();

  const { analysisId } = useParams();

  const [loadedAnalysis, setLoadedAnalysis] = useState<any | null>(null);

  const [isPredictionLoading, setIsPredictionLoading] = useState(false);
  const [isPoemLoading, setIsPoemLoading] = useState(false);
  const [isStyleLoading, setIsStyleLoading] = useState(false);
  const [isFlagPersonalityLoading, setIsFlagPersonalityLoading] = useState(false);

  const [aiConsentGiven, setAiConsentGiven] = useState<boolean>(() => {
    const saved = localStorage.getItem('aiConsentGiven');
    return saved === 'true';
  });

  const [lastCallTimestamps, setLastCallTimestamps] = useState<Record<AiFeatureType, number>>({
    prediction: 0,
    poem: 0,
    style: 0,
    flagPersonality: 0,
  });

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!analysisId) return;
      if (analysisResults) return; // Se já tem no contexto, não busca

      try {
        const db = getFirestore(firebaseApp);
        const docRef = doc(db, 'sharedAnalyses', analysisId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setLoadedAnalysis(data);

          // Carregar insights premium salvos, se existirem
          if (data.aiPrediction) setAiPrediction(data.aiPrediction);
          if (data.aiPoem) setAiPoem(data.aiPoem);
          if (data.aiStyleAnalysis) setAiStyleAnalysis(data.aiStyleAnalysis);
          if (data.aiFlagPersonalityAnalysis) setAiFlagPersonalityAnalysis(data.aiFlagPersonalityAnalysis);

          // Restaurar parsedMessages do Firestore se o contexto estiver vazio
          if ((!parsedMessages || parsedMessages.length === 0) && data.parsedMessages) {
            setParsedMessages(data.parsedMessages);
          }

          // Restaurar analysisResults do Firestore se o contexto estiver vazio
          if (!analysisResults && data.keywordCounts && data.statsPerSender) {
            setAnalysisResults({
              keywordCounts: data.keywordCounts ?? {},
              mostFrequentEmoji: data.mostFrequentEmoji ?? '',
              favoriteWord: data.favoriteWord ?? '',
              statsPerSender: data.statsPerSender ?? {},
              totalRedFlags: data.totalRedFlags ?? 0,
              totalGreenFlags: data.totalGreenFlags ?? 0,
              passiveAggressivePercentage: data.passiveAggressivePercentage ?? 0,
              flirtationPercentage: data.flirtationPercentage ?? 0,
              totalMessages: data.totalMessages ?? 0,
              messagesPerSender: data.messagesPerSender ?? {},
              emojiCounts: data.emojiCounts ?? {},
              peakHours: data.peakHours ?? {},
              messagesPerDate: data.messagesPerDate ?? {},
              messagesPerDayOfWeek: data.messagesPerDayOfWeek ?? {},
              averageMessageLength: data.averageMessageLength ?? 0,
              averageResponseTimesMinutes: data.averageResponseTimesMinutes ?? {},
              capsWordCount: data.capsWordCount ?? 0,
              punctuationEmphasisCount: data.punctuationEmphasisCount ?? 0,
              mostFrequentKeywordCategory: data.mostFrequentKeywordCategory ?? '',
              mostActiveHour: data.mostActiveHour ?? 0,
              totalMessageLength: data.totalMessageLength ?? 0,
              wordCounts: data.wordCounts ?? {},
              expressionCounts: data.expressionCounts ?? {},
              topExpressions: data.topExpressions ?? [],
              punctuationCounts: data.punctuationCounts ?? {},
            });
          }
        } else {
          console.error('Análise não encontrada no Firestore');
        }
      } catch (error) {
        console.error('Erro ao buscar análise do Firestore:', error);
      }
    };

    fetchAnalysis();
  }, [analysisId, analysisResults, parsedMessages, setParsedMessages, setAnalysisResults, setAiPrediction, setAiPoem, setAiStyleAnalysis, setAiFlagPersonalityAnalysis]);

  const callAIFeature = useCallback(async (featureType: AiFeatureType) => {
    const now = Date.now();
    const lastCallTime = lastCallTimestamps[featureType] || 0;


    // Per-Feature Rate Limiting Check
    if (now - lastCallTime < MIN_INTERVAL_MS) {
      const timeLeft = Math.ceil((MIN_INTERVAL_MS - (now - lastCallTime)) / 1000);
      toast.warning(`Por favor, aguarde ${timeLeft} segundo(s) antes de usar esta função novamente.`);
      return;
    }

    if (!parsedMessages || parsedMessages.length === 0) {
      toast.error("Não há mensagens para analisar.");
      return;
    }

    // Update timestamp immediately to prevent rapid clicks before API call finishes
    setLastCallTimestamps(prev => ({ ...prev, [featureType]: now }));

    // Set loading state based on feature type
    if (featureType === 'prediction') setIsPredictionLoading(true);
    else if (featureType === 'poem') setIsPoemLoading(true);
    else if (featureType === 'style') setIsStyleLoading(true);
    else if (featureType === 'flagPersonality') setIsFlagPersonalityLoading(true);

    try {
      // Prepare data for the Cloud Function
      const anonymizedChat = anonymizeMessages(parsedMessages);
      // Limit context size (e.g., last 500 lines or ~4k tokens) - adjust as needed
      const contextLimit = 500;
      const limitedChat = anonymizedChat.split('\n').slice(-contextLimit).join('\n');

      // Correct the type definition for taskType to include the new type
      let taskType: "generateCreativeText" | "analyzeCommunicationStyle" | "analyzeFlagsPersonality";
      let payload: any;

      switch (featureType) {
        case 'prediction':
        case 'poem': // Prediction and Poem use the same taskType and similar payload structure
          taskType = "generateCreativeText";
          if (!analysisResults) {
            toast.error("Resultados da análise não encontrados para gerar texto criativo.");
            throw new Error("Analysis results missing."); // Throw to exit and reset loading
          }
          const sentimentRatio = analysisResults.keywordCounts.positive / (analysisResults.keywordCounts.negative + 1);
          const sentimentMix = sentimentRatio > 1.5 ? 'Positivo' : sentimentRatio < 0.7 ? 'Negativo' : 'Equilibrado';
          payload = {
            mostFrequentEmoji: analysisResults.mostFrequentEmoji,
            favoriteWord: analysisResults.favoriteWord,
            sentimentMix: sentimentMix,
            chatSign: generatedSign || "Indefinido", // Pass the sign from context, with a fallback
            creativeType: featureType // Send 'prediction' or 'poem'
          };
          break;
        case 'style':
          taskType = "analyzeCommunicationStyle";
          payload = {
            anonymizedMessages: limitedChat,
            charLimit: contextLimit,
          };
          break;
        case 'flagPersonality':
          taskType = "analyzeFlagsPersonality";
          if (!analysisResults?.statsPerSender) {
            toast.error("Dados de análise por participante não encontrados.");
            throw new Error("Sender stats missing for flag personality analysis.");
          }
          payload = Object.entries(analysisResults.statsPerSender).reduce((acc, [sender, stats]) => {
            if (stats && (stats.redFlagKeywords?.length > 0 || stats.greenFlagKeywords?.length > 0)) {
              acc[sender] = {
                redFlagKeywords: stats.redFlagKeywords,
                greenFlagKeywords: stats.greenFlagKeywords,
              };
            }
            return acc;
          }, {} as Record<string, { redFlagKeywords: string[], greenFlagKeywords: string[] }>);

          if (Object.keys(payload).length === 0) {
             toast.info("Nenhum participante com Red/Green flags encontradas para análise de personalidade.");
             setIsFlagPersonalityLoading(false); // Reset loading state immediately
             // Revert timestamp update since we didn't actually make a call
             setLastCallTimestamps(prev => ({ ...prev, [featureType]: lastCallTime }));
             return; // Exit early
          }
          break;
        default:
           toast.error("Tipo de recurso de IA desconhecido.");
           // Revert timestamp update
           setLastCallTimestamps(prev => ({ ...prev, [featureType]: lastCallTime }));
           throw new Error("Unknown AI feature type."); // Throw to exit and reset loading
      }

      toast.info(`Solicitando ${featureType} da IA... Isso pode levar um momento.`);
      // console.log("Calling Cloud Function with:", { taskType, payload });

      const result = await callGeminiFunction({ taskType, payload });

      if (!(result?.data as any)?.success) {
        const errorMessage = (result?.data as any)?.error || "A IA não retornou um resultado válido ou indicou uma falha.";
        // Revert timestamp update on failure
        setLastCallTimestamps(prev => ({ ...prev, [featureType]: lastCallTime }));
        throw new Error(errorMessage);
      }

      // Process result based on feature type
      if (featureType === 'prediction' || featureType === 'poem' || featureType === 'style') {
        const textResult = (result?.data as any)?.result;
        if (typeof textResult === 'string') {
          const trimmedResult = textResult.trim();
          if (trimmedResult) {
            if (featureType === 'prediction') setAiPrediction(trimmedResult);
            else if (featureType === 'poem') setAiPoem(trimmedResult);
            else if (featureType === 'style') setAiStyleAnalysis(trimmedResult);
          } else {
             // Revert timestamp update on empty result
             setLastCallTimestamps(prev => ({ ...prev, [featureType]: lastCallTime }));
             throw new Error(`A IA retornou um texto vazio para ${featureType}.`);
          }
        } else {
          // Revert timestamp update on invalid format
          setLastCallTimestamps(prev => ({ ...prev, [featureType]: lastCallTime }));
          throw new Error(`A IA não retornou um texto válido para ${featureType}. Tipo recebido: ${typeof textResult}`);
        }
      }
      else if (featureType === 'flagPersonality') {
         const personalityResult = (result?.data as any)?.result; // Expecting an object
         if (typeof personalityResult === 'object' && personalityResult !== null) {
            if (Object.keys(personalityResult).length === 0) {
               toast.info("Nenhuma análise de personalidade gerada (sem flags suficientes?).");
               setAiFlagPersonalityAnalysis({}); // Set to empty object
            } else {
               setAiFlagPersonalityAnalysis(personalityResult as Record<string, string>);
            }
         } else {
            console.error("Received unexpected format for flag personality analysis:", personalityResult);
            toast.error("Formato inesperado recebido da análise de personalidade por flags.");
            setAiFlagPersonalityAnalysis(null); // Reset or handle error state
            // Revert timestamp update on invalid format
            setLastCallTimestamps(prev => ({ ...prev, [featureType]: lastCallTime }));
            // Optionally throw an error if this state is unexpected
            // throw new Error(`Formato inesperado para ${featureType}. Tipo recebido: ${typeof personalityResult}`);
         }
      }

      // Timestamp already updated at the start of the successful attempt
      toast.success(`${featureType.charAt(0).toUpperCase() + featureType.slice(1)} gerado com sucesso!`);

      // Salvar resultado no Firestore
      try {
        if (analysisId) {
          const db = getFirestore(firebaseApp);
          const analysisRef = doc(db, 'sharedAnalyses', analysisId);

          let updateData: Record<string, any> = {};

          if (featureType === 'prediction') updateData.aiPrediction = (result?.data as any)?.result?.trim();
          else if (featureType === 'poem') updateData.aiPoem = (result?.data as any)?.result?.trim();
          else if (featureType === 'style') updateData.aiStyleAnalysis = (result?.data as any)?.result?.trim();
          else if (featureType === 'flagPersonality') updateData.aiFlagPersonalityAnalysis = (result?.data as any)?.result;

          await updateDoc(analysisRef, updateData);
          // console.log(`Insight ${featureType} salvo no Firestore.`);
        }
      } catch (error) {
        console.error(`Erro ao salvar ${featureType} no Firestore:`, error);
      }

    } catch (error: any) {
       // Timestamp should have been reverted inside the try block for specific errors
       if (error.code && error.message) {
         console.error(`Erro da Cloud Function (${error.code}) ao chamar IA para ${featureType}:`, error.message);
         toast.error(`Falha ao gerar ${featureType}: ${error.message}`);
       } else {
         console.error(`Erro inesperado ao chamar IA para ${featureType}:`, error);
         toast.error(`Falha ao gerar ${featureType}. ${error.message || 'Tente novamente mais tarde.'}`);
       }
       // Ensure timestamp is reverted if not already done
       setLastCallTimestamps(prev => ({ ...prev, [featureType]: lastCallTime }));
    } finally {
      // Reset loading state based on feature type
      if (featureType === 'prediction') setIsPredictionLoading(false);
      else if (featureType === 'poem') setIsPoemLoading(false);
      else if (featureType === 'style') setIsStyleLoading(false);
      else if (featureType === 'flagPersonality') setIsFlagPersonalityLoading(false);
    }
  }, [parsedMessages, analysisResults, generatedSign, lastCallTimestamps, setAiPrediction, setAiPoem, setAiStyleAnalysis, setAiFlagPersonalityAnalysis]); // Updated dependencies


  // TODO: Fetch and display actual non-AI premium content based on context/state (analysisResults)

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col">
      <header className="mb-8 flex items-center justify-between">
        <Link to={`/results/${analysisId}`} className="flex items-center text-blue-600 hover:underline">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Voltar aos Resultados
        </Link>
        <h1 className="text-3xl font-bold text-center text-purple-700">✨ Área Premium ✨</h1>
        <div className="w-20"></div> {/* Spacer */}
      </header>

      <main className="flex-grow">
        {/* Banner de Anúncio Premium */}
        <div className="w-full flex justify-center mb-8">
          <AdBanner slot="1234567890" />
        </div>
        <Card className="mb-6 bg-gradient-to-br from-purple-100 to-indigo-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-purple-800">Análises Exclusivas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Aqui você encontrará insights mais profundos e análises avançadas sobre sua conversa.
            </p>

            {/* AI Consent Checkbox */}
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-3 rounded-md mb-6 text-sm">
              <p>
                Ao usar as funções de IA abaixo, você concorda que os dados anonimizados do chat (nomes substituídos por "Pessoa 1", "Pessoa 2", etc.) serão enviados para a API da Google (Gemini) para gerar as análises. Nenhum dado pessoal identificável é enviado.
              </p>
            </div>

            {/* AI Premium Content */}
            <div className="space-y-4 mb-6">
              {/* AI Prediction Card */}
              <Card className="bg-white p-4">
                <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
                   <CardTitle className="text-lg text-indigo-700 flex items-center"><Sparkles className="w-5 h-5 mr-2 text-yellow-500"/> Previsão do Chat (IA)</CardTitle>
                   <Button size="sm" onClick={() => callAIFeature('prediction')}>
                     {isPredictionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4"/>}
                     Gerar
                   </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {isPredictionLoading ? (
                    <p className="text-gray-500 italic">Gerando previsão...</p>
                  ) : aiPrediction ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{aiPrediction}</p>
                  ) : (
                    <p className="text-gray-500 italic">Clique em "Gerar" para obter uma previsão divertida sobre o chat.</p>
                  )}
                </CardContent>
              </Card>

              {/* AI Poem Card */}
              <Card className="bg-white p-4">
                 <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
                   <CardTitle className="text-lg text-indigo-700 flex items-center"><Feather className="w-5 h-5 mr-2 text-blue-500"/> Poema do Chat (IA)</CardTitle>
                   <Button size="sm" onClick={() => callAIFeature('poem')}>
                     {isPoemLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Feather className="mr-2 h-4 w-4"/>}
                     Gerar
                   </Button>
                 </CardHeader>
                 <CardContent className="p-0">
                   {isPoemLoading ? (
                     <p className="text-gray-500 italic">Gerando poema...</p>
                   ) : aiPoem ? (
                     <p className="text-gray-700 whitespace-pre-wrap">{aiPoem}</p>
                   ) : (
                     <p className="text-gray-500 italic">Clique em "Gerar" para criar um poema inspirado na conversa.</p>
                   )}
                 </CardContent>
              </Card>

              {/* AI Style Analysis Card */}
              <Card className="bg-white p-4">
                 <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
                   <CardTitle className="text-lg text-indigo-700 flex items-center"><BrainCircuit className="w-5 h-5 mr-2 text-green-500"/> Estilo de Comunicação (IA)</CardTitle>
                    <Button size="sm" onClick={() => callAIFeature('style')}>
                      {isStyleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4"/>}
                      Analisar
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isStyleLoading ? (
                      <p className="text-gray-500 italic">Analisando estilo...</p>
                    ) : aiStyleAnalysis ? (
                      <p className="text-gray-700 whitespace-pre-wrap">{aiStyleAnalysis}</p>
                    ) : (
                      <p className="text-gray-500 italic">Clique em "Analisar" para um resumo do estilo de comunicação.</p>
                    )}
                  </CardContent>
               </Card>
             </div>

             {/* Non-AI Premium Content */}
             <h3 className="text-xl font-semibold text-purple-800 mb-3 mt-6">Outras Análises Premium</h3>
             <div className="space-y-4">
               {/* Passive-Aggressive Analysis Card */}
               <Card className="bg-white p-4">
                 <CardHeader className="p-0 pb-2">
                   <CardTitle className="text-lg text-indigo-700 flex items-center"><Users className="w-5 h-5 mr-2 text-orange-600"/> Análise Passivo-Agressiva</CardTitle>
                 </CardHeader>
                 <CardContent className="p-0">
                   {(analysisResults || loadedAnalysis) ? (
                     <div className="space-y-3">
                       <div className="flex justify-between items-center text-base">
                         <span className="font-medium">Geral (% msgs):</span>
                         <span className="font-bold text-orange-700">
                           {((analysisResults?.passiveAggressivePercentage ?? loadedAnalysis?.passiveAggressivePercentage) || 0).toFixed(1)}%
                         </span>
                       </div>
                       {Object.keys((analysisResults?.statsPerSender ?? loadedAnalysis?.statsPerSender) || {}).length > 1 && (
                         <div>
                           <h5 className="text-sm font-semibold mt-3 mb-1 text-gray-600">Por Participante:</h5>
                           <ul className="list-disc list-inside text-sm space-y-1">
                             {Object.entries(analysisResults?.statsPerSender ?? loadedAnalysis?.statsPerSender ?? {}).sort(([, a]: any, [, b]: any) => (b.passiveAggressivePercentage ?? 0) - (a.passiveAggressivePercentage ?? 0)).map(([sender, stats]: any) => (
                               <li key={sender}>
                                 <span className="font-medium">{sender}:</span> {(stats.passiveAggressivePercentage ?? 0).toFixed(1)}%
                               </li>
                             ))}
                           </ul>
                         </div>
                       )}
                     </div>
                   ) : (
                     <p className="text-gray-500 italic">Dados de análise não disponíveis.</p>
                   )}
                 </CardContent>
               </Card>

              {/* Flirtation Analysis Card */}
              <Card className="bg-white p-4">
                 <CardHeader className="p-0 pb-2">
                   <CardTitle className="text-lg text-indigo-700 flex items-center"><Smile className="w-5 h-5 mr-2 text-pink-500"/> Análise de Flerte</CardTitle>
                 </CardHeader>
                 <CardContent className="p-0">
                   {(analysisResults || loadedAnalysis) ? (
                     <div className="space-y-3">
                       <div className="flex justify-between items-center text-base">
                         <span className="font-medium">Geral (% msgs):</span>
                         <span className="font-bold text-pink-600">
                           {((analysisResults?.flirtationPercentage ?? loadedAnalysis?.flirtationPercentage) || 0).toFixed(1)}%
                         </span>
                       </div>
                       {Object.keys((analysisResults?.statsPerSender ?? loadedAnalysis?.statsPerSender) || {}).length > 1 && (
                         <div>
                           <h5 className="text-sm font-semibold mt-3 mb-1 text-gray-600">Por Participante:</h5>
                           <ul className="list-disc list-inside text-sm space-y-1">
                             {Object.entries(analysisResults?.statsPerSender ?? loadedAnalysis?.statsPerSender ?? {}).sort(([, a]: any, [, b]: any) => (b.flirtationPercentage ?? 0) - (a.flirtationPercentage ?? 0)).map(([sender, stats]: any) => (
                               <li key={sender}>
                                 <span className="font-medium">{sender}:</span> {(stats.flirtationPercentage ?? 0).toFixed(1)}%
                               </li>
                             ))}
                           </ul>
                         </div>
                       )}
                       {/* Compatibility Section */}
                       <div className="pt-3 mt-3 border-t border-gray-200">
                          <h5 className="text-sm font-semibold mb-2 text-gray-600">💘 Compatibilidade Amorosa:</h5>
                          <RenderCompatibility analysisResults={analysisResults ?? loadedAnalysis} />
                       </div>
                     </div>
                   ) : (
                     <p className="text-gray-500 italic">Dados de análise não disponíveis.</p>
                   )}
                 </CardContent>
              </Card>

              {/* Detailed Red/Green Flags Card */}
              {analysisResults && (analysisResults.totalRedFlags > 0 || analysisResults.totalGreenFlags > 0) && (
                <Card className="bg-white p-4">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-lg text-indigo-700 flex items-center">
                      🚩 Detalhes dos Sinais 💚
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-4">
                      {/* Overall Counts */}
                      <div className="flex justify-around text-center border-b pb-3 mb-3 border-gray-200">
                        <div>
                          <p className="text-2xl font-bold text-red-500">{analysisResults.totalRedFlags ?? 0}</p>
                          <p className="text-xs opacity-80">Total Red Flags 🚩</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-500">{analysisResults.totalGreenFlags ?? 0}</p>
                          <p className="text-xs opacity-80">Total Green Flags 💚</p>
                        </div>
                      </div>

                      {/* Per-Sender Details */}
                      <h5 className="text-sm font-semibold text-gray-600">Detalhes por Participante:</h5>
                      <div className="space-y-3">
                        {Object.entries(analysisResults.statsPerSender)
                          .filter(([, stats]) => (stats?.redFlagKeywords?.length ?? 0) > 0 || (stats?.greenFlagKeywords?.length ?? 0) > 0) // Only show senders with flag keywords
                          .sort(([, statsA], [, statsB]) => (statsB?.messageCount ?? 0) - (statsA?.messageCount ?? 0))
                          .map(([sender, stats]) => (
                            <div key={sender} className={`p-2 rounded ${sender === selectedSender ? 'bg-blue-50' : ''}`}>
                              <p className="font-semibold text-sm text-gray-800 mb-1">{sender}:</p>
                              {stats?.redFlagKeywords && stats.redFlagKeywords.length > 0 && (
                                <div className="mb-1">
                                  <p className="text-xs text-red-600 flex items-center font-medium">
                                    <ThumbsDown className="w-3 h-3 mr-1.5"/> Red Flags ({stats.redFlagCount ?? stats.redFlagKeywords.length}):
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {/* Count unique keywords */}
                                    {Object.entries(stats.redFlagKeywords.reduce((acc, kw) => { acc[kw] = (acc[kw] || 0) + 1; return acc; }, {} as Record<string, number>))
                                      .sort(([, countA], [, countB]) => countB - countA) // Sort by count desc
                                      .map(([keyword, count], idx) => (
                                        <Badge key={idx} variant="destructive" className="text-xs font-normal">
                                          {keyword} {count > 1 ? <span className="ml-1 opacity-75">({count}x)</span> : ''}
                                        </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {stats?.greenFlagKeywords && stats.greenFlagKeywords.length > 0 && (
                                <div>
                                  <p className="text-xs text-green-600 flex items-center font-medium">
                                    <ThumbsUp className="w-3 h-3 mr-1.5"/> Green Flags ({stats.greenFlagCount ?? stats.greenFlagKeywords.length}):
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {/* Count unique keywords */}
                                    {Object.entries(stats.greenFlagKeywords.reduce((acc, kw) => { acc[kw] = (acc[kw] || 0) + 1; return acc; }, {} as Record<string, number>))
                                      .sort(([, countA], [, countB]) => countB - countA) // Sort by count desc
                                      .map(([keyword, count], idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs font-normal border-green-500/50 bg-green-50 text-green-700">
                                          {keyword} {count > 1 ? <span className="ml-1 opacity-75">({count}x)</span> : ''}
                                        </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                       <p className="text-xs text-center opacity-70 pt-2">Lista de palavras/frases que acionaram os sinais. Lembre-se que o contexto é importante.</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Flag Personality Analysis Card */}
              <Card className="bg-white p-4">
                 <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
                   <CardTitle className="text-lg text-indigo-700 flex items-center"><UserCheck className="w-5 h-5 mr-2 text-teal-600"/> Personalidade por Sinais (IA)</CardTitle>
                   {/* Ensure callAIFeature type includes 'flagPersonality' */}
                   <Button size="sm" onClick={() => callAIFeature('flagPersonality')}>
                     {isFlagPersonalityLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4"/>}
                     Analisar Flags
                   </Button>
                 </CardHeader>
                 <CardContent className="p-0">
                   {isFlagPersonalityLoading ? (
                     <p className="text-gray-500 italic">Analisando personalidades com base nas flags...</p>
                   ) : aiFlagPersonalityAnalysis && Object.keys(aiFlagPersonalityAnalysis).length > 0 ? (
                     <div className="space-y-2 mt-2">
                       {Object.entries(aiFlagPersonalityAnalysis).map(([sender, analysis]) => (
                         // Corrected JSX structure for mapping
                         <div key={sender} className={`p-2 rounded ${sender === selectedSender ? 'bg-blue-50' : ''}`}>
                           <p className="font-semibold text-sm text-gray-800">{sender}:</p>
                           <p className="text-sm text-gray-600">{analysis}</p>
                         </div>
                       ))}
                     </div>
                   ) : aiFlagPersonalityAnalysis && Object.keys(aiFlagPersonalityAnalysis).length === 0 ? (
                      <p className="text-gray-500 italic">Nenhuma análise de personalidade gerada (sem flags suficientes?).</p>
                   ) : (
                     <p className="text-gray-500 italic">Clique em "Analisar Flags" para gerar uma análise de personalidade baseada nas Red/Green flags de cada participante.</p>
                   )}
                 </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="text-center mt-8 text-gray-500 text-sm">
        Horóscopo das Mensagens © {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default PremiumPage;
