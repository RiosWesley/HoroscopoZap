import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { createPayment } from "./createPayment";
import { createPixPayment } from "./createPixPayment";
import { handlePixWebhook } from "./handlePixWebhook"; // Importa a nova função
export { createPayment, createPixPayment, handlePixWebhook }; // Exporta junto com as outras
 

// Initialize Firebase Admin SDK (only once)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Define safety settings for the Gemini model
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Define the expected structure for incoming data
interface RequestData {
  taskType: "generateCreativeText" | "analyzeCommunicationStyle" | "analyzeFlagsPersonality";
  payload: any;
}

// Define the HTTPS Callable Function (v1 syntax)
// Potentially remove the explicit ': Promise<any>' if TS can infer it, or specify a more concrete return type
export const callGemini = functions.https.onCall(async (data: unknown, context) => { // Line 25 - Error 'Not all code paths return' might resolve after fixes
  functions.logger.info("callGemini function started.", { structuredData: true });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
      functions.logger.error("Gemini API Key not found in environment variables (GEMINI_API_KEY).");
      throw new functions.https.HttpsError("internal", "Configuration error: Missing API Key on the server.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  const actualPayload = (data as any)?.data || data;
  functions.logger.info("Received data/payload:", { originalData: data, actualPayload: actualPayload });

  // Improved validation
  if (!actualPayload || typeof actualPayload !== 'object') {
    functions.logger.error("Invalid request data: not an object.", { originalData: data, actualPayload: actualPayload });
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid request structure. Expected { data: { taskType: '...', payload: {...} } } or { taskType: '...', payload: {...} }."
    );
  }

  const requestData = actualPayload as RequestData; // Cast after checking it's an object
  if (!requestData.taskType || !requestData.payload) {
    functions.logger.error("Invalid request data structure: missing taskType or payload.", { requestData: requestData });
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid request structure. Expected object with 'taskType' and 'payload' keys."
    );
  }


  // Destructure taskType and payload here, they are accessible within the function scope
  const { taskType, payload } = requestData;
  functions.logger.info(`Processing task: ${taskType}`, { taskType });

  try { // Start of main try block
    let prompt = ""; // Declare prompt within the try block, accessible by switch cases
    functions.logger.info("Initializing Gemini model...");
    // Ensure model name is correct, "gemini-1.5-flash-8b" seems unusual, maybe "gemini-1.5-flash"? check Gemini docs
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings });
    functions.logger.info("Gemini model initialized.");

    // --- Construct Prompt based on Task Type ---
    switch (taskType) {
      case "generateCreativeText": {
        const { mostFrequentEmoji, favoriteWord, sentimentMix, chatSign, creativeType } = payload;
        functions.logger.info(`Generating creative text prompt for type: ${creativeType}`, { payload });
        const baseContext = `
          Dados de análise de um chat do WhatsApp:
          - Emoji mais usado: ${mostFrequentEmoji || "Nenhum"}
          - Palavra favorita (ignorando comuns): ${favoriteWord || "Nenhuma"}
          - Mix de sentimento (positivo/negativo): ${sentimentMix || "Equilibrado"}
          - "Signo" do chat (baseado na hora mais ativa): ${chatSign || "Explorador do ZapVerso"}`;
        if (creativeType === 'prediction') {
          prompt = `
            ${baseContext}
            Com base nesses dados, especialmente o "Signo" (${chatSign || "Explorador"}) e o sentimento (${sentimentMix || "Equilibrado"}), crie uma previsão curta (2-3 frases), divertida e otimista no estilo 'horóscopo maluco' para este chat.
            Reflita o sentimento e o signo na sua previsão. Use português brasileiro.
            Não inclua introduções como "Aqui está sua previsão:", apenas o texto gerado.
          `;
        } else if (creativeType === 'poem') {
          prompt = `
            ${baseContext}
            Inspirado por esses dados, especialmente o sentimento (${sentimentMix || "Equilibrado"}) e o emoji (${mostFrequentEmoji || "Nenhum"}), escreva um pequeno poema ou haiku (3-5 linhas) sobre a vibe deste chat.
            Tente capturar o sentimento predominante. Use português brasileiro.
            Não inclua introduções como "Aqui está seu poema:", apenas o texto gerado.
          `;
        } else {
           functions.logger.error("Unknown creativeType received within generateCreativeText task:", { creativeType });
           throw new functions.https.HttpsError("invalid-argument", "Invalid 'creativeType' provided for generateCreativeText.");
        }
        break;
      }

      case "analyzeCommunicationStyle": {
        const { anonymizedMessages, charLimit } = payload;
        functions.logger.info("Generating style analysis prompt...", { payloadKeys: Object.keys(payload) });
        // Ensure charLimit is a number or provide a default
        const limit = typeof charLimit === 'number' && charLimit > 0 ? charLimit : 1000;
        prompt = `
          Analise o seguinte trecho de uma conversa de chat (em português brasileiro), respeitando o limite de caracteres de ${limit} usado para selecioná-lo.
          Avalie o estilo de comunicação geral predominante com base nestes aspectos:
          1.  **Complexidade da Linguagem:** As frases são geralmente curtas e diretas ou mais longas e elaboradas? O vocabulário é simples ou variado/complexo?
          2.  **Diretividade:** A comunicação tende a ser mais direta ao ponto ou mais indireta/sugestiva?
          3.  **Formalidade:** O tom geral é mais informal (gírias, abreviações) ou mais formal?
          Forneça um resumo conciso (3-4 frases) descrevendo o estilo de comunicação predominante observado no trecho fornecido. Não analise participantes individuais, apenas o estilo geral. Não inclua saudações ou despedidas na sua resposta.
          Trecho do Chat para Análise:
          """
          ${anonymizedMessages}
          """
        `;
        break;
      }

      case "analyzeFlagsPersonality": { // Line 124 starts here
        functions.logger.info("Generating flag personality analysis prompt...", { payloadKeys: Object.keys(payload) });
        const senderFlagData = payload as Record<string, { redFlagKeywords: string[], greenFlagKeywords: string[] }>;
        let flagPromptParts: string[] = [];
        for (const sender in senderFlagData) {
          // Ensure senderFlagData[sender] exists before accessing its properties
          if (senderFlagData.hasOwnProperty(sender) && senderFlagData[sender]) {
            const flags = senderFlagData[sender];
            if (flags && (flags.redFlagKeywords?.length > 0 || flags.greenFlagKeywords?.length > 0)) {
              const maxKeywords = 15;
              const redFlagsSample = flags.redFlagKeywords?.slice(0, maxKeywords).join(", ") || "Nenhuma";
              const greenFlagsSample = flags.greenFlagKeywords?.slice(0, maxKeywords).join(", ") || "Nenhuma";
              flagPromptParts.push(`- ${sender}:\n  - Red Flags (exemplos): ${redFlagsSample}\n  - Green Flags (exemplos): ${greenFlagsSample}`);
            }
          }
        }
        if (flagPromptParts.length === 0) {
          functions.logger.warn("No senders with flags provided for analyzeFlagsPersonality task.");
          // Ensure a consistent return structure
          return { success: true, result: "{}" }; // Return stringified JSON for consistency or adjust client
        }
        prompt = `
          Analise as seguintes palavras/frases associadas a "Red Flags" (sinais de alerta) e "Green Flags" (sinais positivos) para cada participante de uma conversa de WhatsApp (em português brasileiro).
          Dados por Participante:
          ${flagPromptParts.join("\n\n")}
          Com base EXCLUSIVAMENTE nessas palavras/frases fornecidas para cada pessoa, gere uma breve análise de personalidade (1-2 frases) para CADA participante listado. Foque em traços que podem ser inferidos a partir das flags (ex: direto, cuidadoso, impaciente, encorajador, etc.).

          Seja conciso e direto ao ponto.
          Retorne a análise como um objeto JSON onde as chaves são os nomes dos participantes e os valores são as strings da análise de personalidade correspondente.
          Exemplo de formato de saída esperado:
          {
            "Nome Participante 1": "Parece ser [análise breve].",
            "Nome Participante 2": "Demonstra ser [análise breve]."
          }
          IMPORTANTE: Sua resposta deve conter APENAS o objeto JSON válido, sem nenhum texto antes ou depois, e sem usar blocos de código markdown (\`\`\`json ... \`\`\`).
        `; // <--- *** CORRECTION HERE: Escaped backticks ***
        break; // Line 136 ends around here
      } // Line 137

      default: { // Line 139
        // This ensures exhaustive checking at compile time
        // If taskType could be other strings, this assignment will fail
        const exhaustiveCheck: never = taskType;
        functions.logger.error("Unhandled taskType in switch:", { taskType: exhaustiveCheck });
        throw new functions.https.HttpsError(
          "internal",
          `Unhandled task type received: ${taskType}` // Include the type for better debugging
        );
      } // Line 143 ends here
    } // End of switch

    // --- Call Gemini API ---
    functions.logger.info(`Calling Gemini API for task: ${taskType}`);
    functions.logger.debug("Final prompt for Gemini:", { prompt }); // Use debug for potentially long prompts
    const generationConfig = { // Added for Gemini 1.5 - ensure JSON output for the specific task
        responseMimeType: taskType === "analyzeFlagsPersonality" ? "application/json" : "text/plain",
    };
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig // Pass the config here
    });
    functions.logger.info("Gemini API call completed.");
    const response = result.response;

    if (!response) {
        functions.logger.error("Gemini API did not return a response object.");
        throw new functions.https.HttpsError("internal", "A API Gemini não retornou um objeto de resposta."); // More specific error
    }

     // Check for finishReason before accessing text()
    const finishReason = response.candidates?.[0]?.finishReason;
    const safetyRatings = response.candidates?.[0]?.safetyRatings;

    if (finishReason === "STOP") {
        // Continue processing
    } else if (finishReason === "MAX_TOKENS") {
        functions.logger.warn("Gemini response stopped due to MAX_TOKENS.");
        // Decide if partial response is acceptable or throw error
    } else if (finishReason === "SAFETY" || response.promptFeedback?.blockReason) {
        functions.logger.warn("Gemini API call blocked or response filtered:", {
            reason: finishReason || response.promptFeedback?.blockReason,
            safetyRatings: safetyRatings || response.promptFeedback?.safetyRatings,
         });
        throw new functions.https.HttpsError(
            "internal", // Or perhaps 'resource-exhausted' or 'permission-denied' depending on context
            `A solicitação/resposta foi bloqueada pela IA por motivos de segurança/política.`
        );
    } else {
         functions.logger.error("Gemini response finished with unexpected reason or was empty:", { finishReason, response });
         throw new functions.https.HttpsError("internal", "A resposta da API Gemini foi inesperada ou vazia.");
    }

    // Access text only if finishReason is acceptable
    const resultText = response.text().trim(); // Declare resultText here
    functions.logger.info(`Gemini response text received successfully for task: ${taskType}`);

    // --- Process Response ---
    if (taskType === "analyzeFlagsPersonality") {
      // With responseMimeType: "application/json", Gemini should return valid JSON directly
      try {
         // Gemini 1.5 with application/json might already parse it, check response structure
         // Let's assume response.text() still returns the JSON string for now
         const jsonResult = JSON.parse(resultText);
         functions.logger.info("Parsed JSON result for analyzeFlagsPersonality:", { jsonResult });
         return { success: true, result: jsonResult }; // Return the parsed object
      } catch (parseError) {
         functions.logger.error("Failed to parse JSON from Gemini response even when application/json was requested.", { responseText: resultText, error: parseError });
         throw new functions.https.HttpsError("internal", "A IA retornou uma resposta inválida (JSON esperado falhou ao analisar).");
      }
    } else {
      // For other tasks, return plain text
      return { success: true, result: resultText };
    }

  } catch (error) { // Catch block for the main try
    functions.logger.error(`Error processing task ${taskType}:`, error); // taskType is accessible here
    if (error instanceof functions.https.HttpsError) {
        throw error; // Re-throw HttpsError directly
    }
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao chamar a API de IA.";
    throw new functions.https.HttpsError(
      "internal",
      `Falha ao processar a solicitação de IA: ${errorMessage}`
    );
  }
}); // End of callGemini function


// --- REMOVED STRAY CODE THAT WAS HERE ---
// Removed: Stray '}' (was line 150)
// Removed: Stray 'catch' block and its content (was lines 206-213)
// Removed: Stray '}' (was line 214)
// Removed: Invalid references to 'taskType'/'model' if they existed within saveAnalysisResults's intended logic


// --- Function to Save Analysis Results ---
// Interface expanded to match frontend more closely for a perfect mirror
export interface AnalysisResultsToSave {
  totalMessages: number;
  messagesPerSender: Record<string, number>; // Simple count per sender
  emojiCounts: Record<string, number>; // Overall emoji counts
  mostFrequentEmoji: string | null;
  mostFrequentKeywordCategory: string | null; // Added: Category with most keywords
  peakHours: Record<number, number>; // Added: Messages per hour (0-23)
  mostActiveHour: number | null; // Added: Hour with most messages
  keywordCounts: {
    laughter: number;
    questions: number;
    positive: number;
    negative: number;
    // Add other categories if they exist in the frontend analysis
  };
  averageMessageLength: number;
  totalMessageLength: number; // Added: Total characters for consistency if needed elsewhere
  favoriteWord: string | null; // Most frequent significant word
  wordCounts: Record<string, number>; // Added: Counts for significant words (can be large)
  expressionCounts: Record<string, number>; // Added: Counts for common expressions (bigrams)
  punctuationEmphasisCount: number; // Overall count of !!! or ???
  capsWordCount: number; // Overall count of CAPS words
  topExpressions: { text: string; count: number }[]; // Top N expressions
  averageResponseTimesMinutes: Record<string, number | null>; // Added: Avg response time per sender
  messagesPerDayOfWeek: Record<number, number>; // Added: Messages per day of week (0=Sun)
  messagesPerDate: Record<string, number>; // Added: Messages per date ('YYYY-MM-DD')
  statsPerSender: Record<string, { // Detailed stats per sender
    messageCount: number;
    totalLength: number; // Added: Total characters sent by sender
    averageLength: number;
    emojiCounts: Record<string, number>; // Emojis used by sender
    keywordCounts: {
      laughter: number;
      questions: number;
      positive: number;
      negative: number;
      // Add other categories if they exist in the frontend analysis
    };
    punctuationEmphasisCount: number; // Added: Emphasis count per sender
    capsWordCount: number; // Added: CAPS count per sender
    totalResponseTimeMs: number; // Added: Sum of response times in ms
    responseCount: number; // Added: Number of responses tracked
    averageResponseTimeMinutes: number | null; // Added: Average response time in minutes
    passiveAggressiveCount: number; // Added: Raw count
    flirtationCount: number; // Added: Raw count
    passiveAggressivePercentage: number | null;
    flirtationPercentage: number | null;
    redFlagCount: number; // Added: Raw count
    greenFlagCount: number; // Added: Raw count
    redFlagKeywords: string[]; // Added: Store actual matched keywords/phrases
    greenFlagKeywords: string[]; // Added: Store actual matched keywords/phrases
  }>;
  // Overall Premium Percentages (calculated from counts)
  passiveAggressivePercentage: number | null;
  flirtationPercentage: number | null;
  // Overall AI results
  aiPrediction: string | null;
  aiPoem: string | null;
  aiStyleAnalysis: string | null;
  generatedSign: string | null;
  isPremiumAnalysis: boolean;
  totalRedFlags: number;
  totalGreenFlags: number;
  aiFlagPersonalityAnalysis: Record<string, string> | null; // This should be object, not JSON string

  // --- Novos campos para espelhar datas ---
  firstMessageTimestamp: admin.firestore.Timestamp | string | null;
  lastMessageTimestamp: admin.firestore.Timestamp | string | null;

  generatedSignoDescription: string | null;
  generatedFunFacts: string[];

  createdAt: admin.firestore.FieldValue;
  parsedMessages?: {
    timestamp: any; // ou Date | string
    sender: string;
    message: string;
    isSystemMessage: boolean;
  }[];
}

export const saveAnalysisResults = functions.https.onCall(async (data: unknown, context) => {
  functions.logger.info("saveAnalysisResults function started.");
  const receivedData = (data as any)?.data || data;
  functions.logger.info("Received data for saving:", { receivedData });

  // Ensure receivedData is an object before proceeding
  if (!receivedData || typeof receivedData !== 'object') {
     functions.logger.error("Invalid data format received for saving: not an object.", { receivedData });
     throw new functions.https.HttpsError("invalid-argument", "Invalid data format received.");
  }

  const dataToSave: Partial<AnalysisResultsToSave> = {};

  // --- Manually map and validate allowed fields ---
  // (Keep your mapping logic as it is, it's good practice)
  if (typeof receivedData.totalMessages === 'number') dataToSave.totalMessages = receivedData.totalMessages;
  if (typeof receivedData.messagesPerSender === 'object' && receivedData.messagesPerSender !== null) dataToSave.messagesPerSender = receivedData.messagesPerSender;
  if (typeof receivedData.emojiCounts === 'object' && receivedData.emojiCounts !== null) dataToSave.emojiCounts = receivedData.emojiCounts;
  if (typeof receivedData.mostFrequentEmoji === 'string' || receivedData.mostFrequentEmoji === null) dataToSave.mostFrequentEmoji = receivedData.mostFrequentEmoji;
  if (typeof receivedData.mostFrequentKeywordCategory === 'string' || receivedData.mostFrequentKeywordCategory === null) dataToSave.mostFrequentKeywordCategory = receivedData.mostFrequentKeywordCategory; // Added mapping
  if (typeof receivedData.keywordCounts === 'object' && receivedData.keywordCounts !== null) dataToSave.keywordCounts = receivedData.keywordCounts;
  if (typeof receivedData.averageMessageLength === 'number') dataToSave.averageMessageLength = receivedData.averageMessageLength;
  if (typeof receivedData.favoriteWord === 'string' || receivedData.favoriteWord === null) dataToSave.favoriteWord = receivedData.favoriteWord;
  if (typeof receivedData.punctuationEmphasisCount === 'number') dataToSave.punctuationEmphasisCount = receivedData.punctuationEmphasisCount;
  if (typeof receivedData.capsWordCount === 'number') dataToSave.capsWordCount = receivedData.capsWordCount;
  if (Array.isArray(receivedData.topExpressions)) dataToSave.topExpressions = receivedData.topExpressions;
  if (typeof receivedData.statsPerSender === 'object' && receivedData.statsPerSender !== null) dataToSave.statsPerSender = receivedData.statsPerSender;
  if (typeof receivedData.passiveAggressivePercentage === 'number' || receivedData.passiveAggressivePercentage === null) dataToSave.passiveAggressivePercentage = receivedData.passiveAggressivePercentage;
  if (typeof receivedData.flirtationPercentage === 'number' || receivedData.flirtationPercentage === null) dataToSave.flirtationPercentage = receivedData.flirtationPercentage;
  if (typeof receivedData.aiPrediction === 'string' || receivedData.aiPrediction === null) dataToSave.aiPrediction = receivedData.aiPrediction;
  if (typeof receivedData.aiPoem === 'string' || receivedData.aiPoem === null) dataToSave.aiPoem = receivedData.aiPoem;
  if (typeof receivedData.aiStyleAnalysis === 'string' || receivedData.aiStyleAnalysis === null) dataToSave.aiStyleAnalysis = receivedData.aiStyleAnalysis;
  if (typeof receivedData.generatedSign === 'string' || receivedData.generatedSign === null) dataToSave.generatedSign = receivedData.generatedSign;

  // Mapear descrição do signo e fun facts
  if (typeof receivedData.generatedSignoDescription === 'string' || receivedData.generatedSignoDescription === null) {
    dataToSave.generatedSignoDescription = receivedData.generatedSignoDescription;
  }
  if (Array.isArray(receivedData.generatedFunFacts)) {
    dataToSave.generatedFunFacts = receivedData.generatedFunFacts;
  }
  if (typeof receivedData.isPremiumAnalysis === 'boolean') dataToSave.isPremiumAnalysis = receivedData.isPremiumAnalysis;
  if (typeof receivedData.totalRedFlags === 'number') dataToSave.totalRedFlags = receivedData.totalRedFlags;
  if (typeof receivedData.totalGreenFlags === 'number') dataToSave.totalGreenFlags = receivedData.totalGreenFlags;
  // Ensure aiFlagPersonalityAnalysis is an object or null
  if (typeof receivedData.aiFlagPersonalityAnalysis === 'object' || receivedData.aiFlagPersonalityAnalysis === null) {
      dataToSave.aiFlagPersonalityAnalysis = receivedData.aiFlagPersonalityAnalysis;
  }
  if (Array.isArray(receivedData.parsedMessages)) dataToSave.parsedMessages = receivedData.parsedMessages;
  if (typeof receivedData.messagesPerDate === 'object' && receivedData.messagesPerDate !== null) dataToSave.messagesPerDate = receivedData.messagesPerDate;
  if (typeof receivedData.messagesPerDayOfWeek === 'object' && receivedData.messagesPerDayOfWeek !== null) dataToSave.messagesPerDayOfWeek = receivedData.messagesPerDayOfWeek;
  if (typeof receivedData.peakHours === 'object' && receivedData.peakHours !== null) dataToSave.peakHours = receivedData.peakHours;
  if (typeof receivedData.messagesPerSender === 'object' && receivedData.messagesPerSender !== null) dataToSave.messagesPerSender = receivedData.messagesPerSender;
  if (typeof receivedData.averageResponseTimesMinutes === 'object' && receivedData.averageResponseTimesMinutes !== null) dataToSave.averageResponseTimesMinutes = receivedData.averageResponseTimesMinutes;

  // --- Map dos novos campos de timestamp ---
  if (typeof receivedData.firstMessageTimestamp === 'string') {
    try {
      dataToSave.firstMessageTimestamp = admin.firestore.Timestamp.fromDate(new Date(receivedData.firstMessageTimestamp));
    } catch (e) {
      functions.logger.warn("Invalid firstMessageTimestamp received:", receivedData.firstMessageTimestamp);
    }
  } else if (receivedData.firstMessageTimestamp === null) {
    dataToSave.firstMessageTimestamp = null;
  }

  if (typeof receivedData.lastMessageTimestamp === 'string') {
    try {
      dataToSave.lastMessageTimestamp = admin.firestore.Timestamp.fromDate(new Date(receivedData.lastMessageTimestamp));
    } catch (e) {
      functions.logger.warn("Invalid lastMessageTimestamp received:", receivedData.lastMessageTimestamp);
    }
  } else if (receivedData.lastMessageTimestamp === null) {
    dataToSave.lastMessageTimestamp = null;
  }
  // --- Fim do mapeamento timestamps ---

  dataToSave.createdAt = admin.firestore.FieldValue.serverTimestamp();

  // Check if we actually mapped any valid fields besides createdAt
  if (Object.keys(dataToSave).length <= 1) {
     functions.logger.error("No valid data fields found after filtering for saving.", { receivedData });
     throw new functions.https.HttpsError("invalid-argument", "No valid analysis data provided to save.");
  }

  try {
    const db = admin.firestore();
    const docRef = await db.collection("sharedAnalyses").add(dataToSave);
    functions.logger.info(`Analysis saved successfully with ID: ${docRef.id}`);
    return { success: true, analysisId: docRef.id };
  } catch (error) {
    functions.logger.error("Error saving analysis to Firestore:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new functions.https.HttpsError("internal", `Failed to save analysis results: ${errorMessage}`);
  }
});


// --- Function to Get Saved Analysis Results ---
interface GetAnalysisPayload {
  analysisId: string;
}

export const getAnalysisResults = functions.https.onCall(async (data: unknown, context) => {
  functions.logger.info("getAnalysisResults function started.");
  // Use consistent payload unwrapping
  const requestData = (data as any)?.data || data;

  // Add type checking for requestData itself
  if (!requestData || typeof requestData !== 'object') {
      functions.logger.error("Invalid request data for getAnalysisResults: not an object.", { requestData });
      throw new functions.https.HttpsError("invalid-argument", "Invalid request structure.");
  }

  const { analysisId } = requestData as GetAnalysisPayload; // Cast after checking it's an object

  if (!analysisId || typeof analysisId !== 'string') {
    functions.logger.error("Invalid or missing analysisId.", { requestData });
    throw new functions.https.HttpsError("invalid-argument", "An 'analysisId' must be provided.");
  }

  functions.logger.info(`Attempting to fetch analysis with ID: ${analysisId}`);

  try {
    const db = admin.firestore();
    const docRef = db.collection("sharedAnalyses").doc(analysisId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      functions.logger.warn(`Analysis document not found for ID: ${analysisId}`);
      throw new functions.https.HttpsError("not-found", "Analysis not found.");
    } else {
      const savedData = docSnap.data() as AnalysisResultsToSave; // Cast to your interface for better type safety
      if (savedData?.createdAt && typeof (savedData.createdAt as any)?.toDate === 'function') {
         savedData.createdAt = (savedData.createdAt as unknown as admin.firestore.Timestamp).toDate().toISOString() as any;
      }
      if (savedData?.firstMessageTimestamp && typeof (savedData.firstMessageTimestamp as any)?.toDate === 'function') {
         savedData.firstMessageTimestamp = (savedData.firstMessageTimestamp as unknown as admin.firestore.Timestamp).toDate().toISOString() as any;
      }
      if (savedData?.lastMessageTimestamp && typeof (savedData.lastMessageTimestamp as any)?.toDate === 'function') {
         savedData.lastMessageTimestamp = (savedData.lastMessageTimestamp as unknown as admin.firestore.Timestamp).toDate().toISOString() as any;
      }

      functions.logger.info(`Successfully fetched analysis ${analysisId}`);
      return { success: true, results: savedData };
    }
  } catch (error: any) {
     if (error instanceof functions.https.HttpsError) {
       throw error;
     }
     functions.logger.error(`Error fetching analysis ${analysisId} from Firestore:`, error);
     const errorMessage = error instanceof Error ? error.message : "Unknown error";
     throw new functions.https.HttpsError("internal", `Failed to retrieve analysis results: ${errorMessage}`);
  }
});
