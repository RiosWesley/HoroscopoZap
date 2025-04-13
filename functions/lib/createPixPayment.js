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
exports.createPixPayment = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cors_1 = __importDefault(require("cors"));
const crypto_1 = __importDefault(require("crypto"));
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
exports.createPixPayment = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Método não permitido' });
            return;
        }
        try {
            const { transaction_amount, description, analysisId, payer // { email, identification: { type, number } }
             } = req.body;
            const missingFields = [];
            if (!transaction_amount)
                missingFields.push("transaction_amount");
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
            if (missingFields.length > 0) {
                res.status(400).json({
                    error: `Dados obrigatórios ausentes: ${missingFields.join(", ")}`,
                    missingFields,
                    bodyReceived: req.body
                });
                return;
            }
            const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
            if (!accessToken) {
                res.status(500).json({
                    error: "Access token do Mercado Pago não configurado. Defina a variável de ambiente MERCADOPAGO_ACCESS_TOKEN no deploy da Cloud Function."
                });
                return;
            }
            const paymentPayload = {
                transaction_amount: Number(transaction_amount),
                description,
                payment_method_id: "pix",
                payer: {
                    email: payer.email,
                    identification: {
                        type: payer.identification.type,
                        number: payer.identification.number
                    }
                }
            };
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
            if (!responseMP.ok) {
                res.status(responseMP.status).json({
                    error: paymentResult?.message || "Erro ao criar pagamento Pix.",
                    mp_status: paymentResult?.status,
                    mp_status_detail: paymentResult?.status_detail,
                    paymentResult
                });
                return;
            }
            // Atualiza Firestore com status inicial e IDs para referência futura do webhook
            try {
                const analysisUpdateData = {
                    paymentStatus: paymentResult.status, // Geralmente 'pending'
                    paymentDetail: paymentResult.status_detail, // Geralmente 'pending_waiting_transfer'
                    paymentId: paymentResult.id, // ID do pagamento MP
                    analysisId: analysisId, // Salva o ID da análise para busca pelo webhook
                    paymentMethod: 'pix' // Indica o método
                };
                // Usar set com merge: true para criar ou atualizar o documento
                await admin.firestore().collection("sharedAnalyses").doc(analysisId).set(analysisUpdateData, { merge: true });
                functions.logger.info(`Firestore updated for analysis ${analysisId} with initial Pix data (Payment ID: ${paymentResult.id})`);
            }
            catch (firestoreError) {
                // Logar erro, mas não impedir a resposta ao cliente com o QR Code
                console.error(`CRITICAL: Firestore update failed for analysis ${analysisId} during Pix creation (Payment ID: ${paymentResult.id}). Error:`, firestoreError);
            }
            // Retorna dados do QR Code Pix
            const qrData = paymentResult.point_of_interaction?.transaction_data;
            res.status(200).json({
                success: true,
                status: paymentResult.status,
                detail: paymentResult.status_detail,
                paymentId: paymentResult.id,
                qr_code: qrData?.qr_code,
                qr_code_base64: qrData?.qr_code_base64,
                paymentResult
            });
        }
        catch (error) {
            res.status(500).json({
                error: "Erro interno do servidor.",
                errorMessage: error instanceof Error ? error.message : String(error),
                errorStack: error instanceof Error ? error.stack : undefined
            });
        }
    });
});
//# sourceMappingURL=createPixPayment.js.map