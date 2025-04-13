"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayment = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const crypto_1 = __importDefault(require("crypto"));
const cors_1 = __importDefault(require("cors"));
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const allowedOrigins = [
    'https://horoscopozap.web.app',
    'http://localhost:8080'
];
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204
};
const corsHandler = (0, cors_1.default)(corsOptions);
exports.createPayment = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== 'POST') {
            console.log(`Method Not Allowed: ${req.method}`);
            res.status(405).json({ error: 'Método não permitido' });
            return;
        }
        try {
            // Desestruturação movida para dentro do try principal
            const { token, payment_method_id, issuer_id, transaction_amount, installments, description, analysisId, payer // Desestruturar o objeto payer
             } = req.body;
            // Validar campos principais e o objeto payer e seus subcampos
            const missingFields = [];
            if (!token)
                missingFields.push("token");
            if (!payment_method_id)
                missingFields.push("payment_method_id");
            if (!transaction_amount)
                missingFields.push("transaction_amount");
            if (!installments)
                missingFields.push("installments");
            if (!description)
                missingFields.push("description");
            if (!analysisId)
                missingFields.push("analysisId");
            if (!payer)
                missingFields.push("payer object");
            if (payer && !payer.email)
                missingFields.push("payer.email");
            if (payer && !payer.identification)
                missingFields.push("payer.identification object");
            if (payer && payer.identification && !payer.identification.type)
                missingFields.push("payer.identification.type");
            if (payer && payer.identification && !payer.identification.number)
                missingFields.push("payer.identification.number");
            // Logar tipos dos campos recebidos para depuração
            const typeMap = {
                token: typeof token,
                payment_method_id: typeof payment_method_id,
                issuer_id: typeof issuer_id,
                transaction_amount: typeof transaction_amount,
                installments: typeof installments,
                description: typeof description,
                analysisId: typeof analysisId,
                payer: typeof payer,
                payer_email: payer?.email ? typeof payer.email : undefined,
                payer_identification: payer?.identification ? typeof payer.identification : undefined,
                payer_identification_type: payer?.identification?.type ? typeof payer.identification.type : undefined,
                payer_identification_number: payer?.identification?.number ? typeof payer.identification.number : undefined,
                bodyType: typeof req.body
            };
            if (missingFields.length > 0) {
                console.warn(`Validation Error: Missing required fields: ${missingFields.join(", ")}. Body received:`, req.body, "Types:", typeMap);
                res.status(400).json({
                    error: `Dados obrigatórios ausentes: ${missingFields.join(", ")}`,
                    missingFields,
                    bodyReceived: req.body,
                    typeMap
                });
                return;
            }
            // Chave '}' extra removida da linha 70
            // Cloud Functions v2: use variável de ambiente padrão
            const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
            if (!accessToken) {
                console.error("Configuration Error: MERCADOPAGO_ACCESS_TOKEN env var not found.");
                res.status(500).json({
                    error: "Access token do Mercado Pago não configurado. Defina a variável de ambiente MERCADOPAGO_ACCESS_TOKEN no deploy da Cloud Function."
                });
                return;
            }
            // Construção do payload usando as variáveis desestruturadas
            const paymentPayload = {
                transaction_amount: Number(transaction_amount),
                token,
                description,
                installments: Number(installments),
                payment_method_id,
                issuer_id, // issuer_id é opcional pela API MP, mas mantido se enviado
                payer: {
                    email: payer.email,
                    identification: {
                        type: payer.identification.type,
                        number: payer.identification.number
                    }
                }
            };
            console.log("Sending payment request to Mercado Pago...");
            const idempotencyKey = crypto_1.default.randomUUID();
            const responseMP = await fetch("https://api.mercadopago.com/v1/payments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                    "X-Idempotency-Key": idempotencyKey
                },
                body: JSON.stringify(paymentPayload)
            });
            const paymentResult = await responseMP.json();
            console.log("Mercado Pago Response Status:", responseMP.status);
            console.log("Mercado Pago Response Body:", paymentResult);
            if (!responseMP.ok) {
                console.error(`Mercado Pago API error (${responseMP.status}):`, paymentResult);
                const clientErrorMessage = paymentResult?.message || `Falha ao processar o pagamento com Mercado Pago.`;
                const clientStatus = responseMP.status >= 500 ? 502 : 400; // Ajustar status code retornado ao cliente
                res.status(clientStatus).json({
                    error: clientErrorMessage,
                    mp_status: paymentResult?.status,
                    mp_status_detail: paymentResult?.status_detail
                });
                return;
            }
            const isApproved = paymentResult.status === "approved";
            // Bloco try/catch para atualização do Firestore
            try {
                const analysisUpdateData = {
                    paymentStatus: paymentResult.status,
                    paymentDetail: paymentResult.status_detail,
                    paymentId: paymentResult.id,
                };
                if (isApproved) {
                    analysisUpdateData.isPremiumAnalysis = true;
                }
                // Usar a variável analysisId desestruturada
                await admin.firestore().collection("sharedAnalyses").doc(analysisId).update(analysisUpdateData);
                console.log(`Analysis ${analysisId} updated in Firestore. Payment Approved: ${isApproved}`);
            }
            catch (firestoreError) {
                // Logar erro crítico, mas não impedir a resposta ao cliente
                console.error(`CRITICAL: Firestore update failed for analysis ${analysisId} after payment processing (Payment ID: ${paymentResult.id}, Status: ${paymentResult.status}). Error:`, firestoreError);
            }
            // Resposta de sucesso ao cliente
            res.status(200).json({
                success: isApproved,
                status: paymentResult.status,
                detail: paymentResult.status_detail,
                paymentId: paymentResult.id, // Manter apenas uma definição
                message: isApproved // Adicionar vírgula aqui
                    ? "Pagamento aprovado com sucesso."
                    : `Pagamento ${paymentResult.status}. ${paymentResult.status_detail}`
            });
        }
        catch (error) {
            console.error("Internal Server Error in createPayment:", error);
            res.status(500).json({
                error: "Erro interno do servidor.",
                errorMessage: error instanceof Error ? error.message : String(error),
                errorStack: error instanceof Error ? error.stack : undefined
            });
        }
    });
});
//# sourceMappingURL=createPayment.js.map