
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ParsedMessage } from '../lib/parseChat'; // Correct: ParsedMessage comes from parseChat
// Import the full type definition from the source file
import type { AnalysisResults } from '../lib/analyzeChat'; // Correct: AnalysisResults comes from analyzeChat. REMOVED ParsedMessage import from here.

interface ChatAnalysisContextType {
  rawChatText: string | null;
  setRawChatText: (text: string | null) => void;
  parsedMessages: ParsedMessage[] | null; // Use ParsedMessage from parseChat
  setParsedMessages: (messages: ParsedMessage[] | null) => void;
  analysisResults: AnalysisResults | null; // Use AnalysisResults from analyzeChat
  setAnalysisResults: (results: AnalysisResults | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  selectedChartView: 'daily' | 'weekly'; // Removed 'hourly'
  setSelectedChartView: (view: 'daily' | 'weekly') => void; // Removed 'hourly'
  focusedSender: string | null;
  setFocusedSender: (sender: string | null) => void;
  isPremium: boolean; // Added isPremium flag
  setIsPremium: (isPremium: boolean) => void; // Added setter for premium status
  aiPrediction: string | null;
  setAiPrediction: (prediction: string | null) => void;
  aiPoem: string | null; // Add state for AI Poem
  setAiPoem: (poem: string | null) => void; // Add setter for AI Poem
  aiStyleAnalysis: string | null;
  setAiStyleAnalysis: (analysis: string | null) => void;
  resetAnalysis: () => void; // Add the reset function type
  lastAiCallTime: number;
  setLastAiCallTime: (time: number) => void;
  aiCallCount: number;
  setAiCallCount: (count: number) => void;
  generatedSign: string | null; // Add state for the generated sign
  setGeneratedSign: (sign: string | null) => void; // Add setter for the sign
  selectedSender: string | null; // Add state for the user-selected sender
  setSelectedSender: (sender: string | null) => void; // Add setter for the selected sender
  aiFlagPersonalityAnalysis: Record<string, string> | null; // Add state for AI flag personality analysis
  setAiFlagPersonalityAnalysis: (analysis: Record<string, string> | null) => void; // Add setter

  localAnalysisId: string | null;
  setLocalAnalysisId: (id: string | null) => void;
}

const ChatAnalysisContext = createContext<ChatAnalysisContextType | undefined>(undefined);

interface ChatAnalysisProviderProps {
  children: ReactNode;
}

export const ChatAnalysisProvider: React.FC<ChatAnalysisProviderProps> = ({ children }) => {
  const [rawChatText, setRawChatText] = useState<string | null>(null);
  const [parsedMessages, setParsedMessages] = useState<ParsedMessage[] | null>(null); // Use ParsedMessage from parseChat
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null); // Use AnalysisResults from analyzeChat
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChartView, setSelectedChartView] = useState<'daily' | 'weekly'>('daily'); // Changed default to 'daily'
  const [focusedSender, setFocusedSender] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(false); // Initialize premium as false
  const [aiPrediction, setAiPrediction] = useState<string | null>(null);
  const [aiPoem, setAiPoem] = useState<string | null>(null); // Initialize AI Poem state
  const [aiStyleAnalysis, setAiStyleAnalysis] = useState<string | null>(null);
  const [lastAiCallTime, setLastAiCallTime] = useState<number>(0);
  const [aiCallCount, setAiCallCount] = useState<number>(0);
  const [generatedSign, setGeneratedSign] = useState<string | null>(null); // Initialize generated sign state
  const [selectedSender, setSelectedSender] = useState<string | null>(null); // Initialize selected sender state
  const [aiFlagPersonalityAnalysis, setAiFlagPersonalityAnalysis] = useState<Record<string, string> | null>(null); // Initialize AI flag analysis state

  const [localAnalysisId, setLocalAnalysisId] = useState<string | null>(null);

  // Function to reset the analysis state
  const resetAnalysis = () => {
    setRawChatText(null);
    setParsedMessages(null);
    setAnalysisResults(null);
    setIsLoading(false); // Ensure loading is reset
    setError(null);
    setSelectedChartView('daily'); // Reset view to default
    setFocusedSender(null);
    // Keep premium status as is, or reset if desired: setIsPremium(false);
    setAiPrediction(null); // Reset AI results
    setAiPoem(null); // Reset AI Poem
    setAiStyleAnalysis(null);
    setGeneratedSign(null); // Reset generated sign
    setSelectedSender(null); // Reset selected sender
    setAiFlagPersonalityAnalysis(null); // Reset AI flag analysis
    setLastAiCallTime(0);
    setAiCallCount(0);
  };

  const value = {
    rawChatText,
    setRawChatText,
    parsedMessages,
    setParsedMessages,
    analysisResults,
    setAnalysisResults,
    isLoading,
    setIsLoading,
    error,
    setError,
    selectedChartView,
    setSelectedChartView,
    focusedSender,
    setFocusedSender,
    isPremium,
    setIsPremium,
    aiPrediction,
    setAiPrediction,
    aiPoem, // Provide AI Poem state
    setAiPoem, // Provide AI Poem setter
    aiStyleAnalysis,
    setAiStyleAnalysis,
    resetAnalysis, // Provide the reset function in the context value
    lastAiCallTime,
    setLastAiCallTime,
    aiCallCount,
    setAiCallCount,
    generatedSign, // Provide generated sign state
    setGeneratedSign, // Provide generated sign setter
    selectedSender, // Provide selected sender state
    setSelectedSender, // Provide selected sender setter
    aiFlagPersonalityAnalysis, // Provide AI flag analysis state
    setAiFlagPersonalityAnalysis, // Provide AI flag analysis setter
   localAnalysisId,
   setLocalAnalysisId,
 };

  return (
    <ChatAnalysisContext.Provider value={value}>
      {children}
    </ChatAnalysisContext.Provider>
  );
};

export const useChatAnalysis = (): ChatAnalysisContextType => {
  const context = useContext(ChatAnalysisContext);
  if (context === undefined) {
    throw new Error('useChatAnalysis must be used within a ChatAnalysisProvider');
  }
  return context;
};
