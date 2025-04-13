import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import crypto from "crypto"; // Para validação da assinatura

// Garante inicialização do Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Valida a assinatura do Webhook do Mercado Pago conforme documentação oficial.
 * Manifest: id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
 * - [data.id_url]: ID do evento (data.id), minúsculo se alfanumérico.
 * - [x-request-id_header]: header x-request-id.
 * - [ts_header]: valor ts do header x-signature.
 * Remove partes se algum valor não estiver presente.
 */
const validateWebhookSignature = (req: functions.https.Request, secret: string): boolean => {
  const signatureHeader = req.headers['x-signature'] as string;
  if (!signatureHeader) {
    functions.logger.warn("Webhook signature validation failed: Missing X-Signature header.");
    return false;
  }

  // Parse x-signature: ts=...,v1=...
  const parts = signatureHeader.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc[key.trim()] = value.trim();
    return acc;
  }, {} as Record<string, string>);

  const ts = parts['ts'];
  const receivedHash = parts['v1'];
  const xRequestId = req.headers['x-request-id'] as string | undefined;

  // data.id pode vir no corpo (body.data.id) ou como query param (data.id_url)
  let dataId = '';
  if (req.body && req.body.data && req.body.data.id) {
    dataId = String(req.body.data.id);
    // Se for alfanumérico, deve ser minúsculo
    if (/[a-zA-Z]/.test(dataId)) {
      dataId = dataId.toLowerCase();
    }
  }

  // Montar o manifest conforme doc: id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
  let manifest = '';
  if (dataId) manifest += `id:${dataId};`;
  if (xRequestId) manifest += `request-id:${xRequestId};`;
  if (ts) manifest += `ts:${ts};`;

  if (!ts || !receivedHash || !manifest) {
    functions.logger.warn("Webhook signature validation failed: Missing ts, v1, or manifest.", { signatureHeader, manifest });
    return false;
  }

  functions.logger.debug("Webhook signature validation details:", { ts, receivedHash, xRequestId, dataId, manifest });

  // Calcular o HMAC
  const hmac = crypto.createHmac('sha256', secret);
  const calculatedHash = hmac.update(manifest).digest('hex');

  // Comparar hashes de forma segura
  try {
    const trusted = Buffer.from(receivedHash, 'hex');
    const calculated = Buffer.from(calculatedHash, 'hex');
    if (trusted.length === calculated.length && crypto.timingSafeEqual(trusted, calculated)) {
      functions.logger.info("Webhook signature validation successful.");
      return true;
    } else {
      functions.logger.error("Webhook signature validation failed: Hashes do not match.", { receivedHash, calculatedHash, manifest });
      return false;
    }
  } catch (e) {
    functions.logger.error("Webhook signature validation failed: Error during comparison.", { error: e });
    return false;
  }
};

export const handlePixWebhook = functions.https.onRequest(async (req, res) => {
  functions.logger.info("handlePixWebhook function started.");

  // 1. Validar Método POST
  if (req.method !== 'POST') {
    functions.logger.warn(`Webhook received non-POST request: ${req.method}`);
    res.status(405).send('Method Not Allowed');
    return;
  }

   // É crucial ter acesso ao corpo raw para validação da assinatura.
   // Em Cloud Functions v2, isso pode exigir configuração explícita ou uso de `express` com `bodyParser.raw`.
   // Se req.rawBody não estiver disponível, a validação falhará.
   if (!(req as any).rawBody && typeof req.body !== 'string') {
       functions.logger.error("Raw body not available for signature validation. Ensure function is configured correctly or use appropriate middleware.");
       // Responder 200 OK para evitar retentativas, mas logar o erro grave.
       res.status(200).send("OK - Internal configuration error: Raw body needed for validation.");
       return;
   }


  // 2. Validar Assinatura (ESSENCIAL PARA SEGURANÇA)
  const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    functions.logger.error("MERCADO_PAGO_WEBHOOK_SECRET environment variable not set.");
    // Responder 200 OK para evitar retentativas, mas logar erro grave.
    res.status(200).send("OK - Internal Server Configuration Error");
    return;
  }

  if (!validateWebhookSignature(req, webhookSecret)) {
    functions.logger.error("Webhook signature validation failed.");
    res.status(403).send("Forbidden: Invalid signature");
    return;
  }
  // Se chegou aqui, a assinatura é válida


  try {
    // O corpo já foi usado (ou tentado usar) na validação.
    // Se req.body for um objeto (parseado automaticamente), use-o.
    // Se req.rawBody foi usado e era string, parseie agora.
    let notification;
    if (typeof req.body === 'object' && req.body !== null) {
        notification = req.body;
    } else if ((req as any).rawBody && typeof (req as any).rawBody === 'string') {
        try {
            notification = JSON.parse((req as any).rawBody);
        } catch (parseError) {
            functions.logger.error("Failed to parse raw body JSON after signature validation.", { parseError });
            res.status(400).send("Bad Request: Invalid JSON body.");
            return;
        }
    } else {
         functions.logger.error("Could not determine notification body after signature validation.");
         res.status(400).send("Bad Request: Could not process request body.");
         return;
    }

    functions.logger.info("Webhook notification received:", { notification });

    // 3. Extrair Topic e ID
    const topic = notification?.type;
    const paymentIdStr = notification?.data?.id; // ID vem como string ou number? Verificar. Assumindo string por segurança.
    const paymentIdNum = paymentIdStr ? Number(paymentIdStr) : null; // Converter para número para query

    functions.logger.info("Webhook data extracted:", { topic, paymentIdStr, paymentIdNum });


    if (topic === 'payment' && paymentIdNum) { // Usar paymentIdNum na condição
      functions.logger.info(`Processing payment notification for ID: ${paymentIdNum}`);

      // 4. Buscar Detalhes do Pagamento na API MP (API usa ID como string/number?) - Usar string é mais seguro
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!accessToken) {
        functions.logger.error("MERCADO_PAGO_ACCESS_TOKEN env var not found for fetching payment details.");
        // Não retornar 500 aqui, apenas logar, pois o webhook deve responder 200 OK ao MP
        res.status(200).send("OK - Internal config error logged");
        return;
      }

      let paymentDetails;
      try {
        // Usar paymentIdStr (string) na URL da API MP
        const responseMP = await fetch(`https://api.mercadopago.com/v1/payments/${paymentIdStr}`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });
        if (!responseMP.ok) {
          functions.logger.error(`Failed to fetch payment details for ${paymentIdStr}. Status: ${responseMP.status}`);
          // Responder 200 OK mesmo assim para evitar retentativas do MP
          res.status(200).send(`OK - Failed to fetch payment details: ${responseMP.status}`);
          return;
        }
        paymentDetails = await responseMP.json();
        functions.logger.info(`Payment details fetched for ${paymentIdStr}:`, { status: paymentDetails?.status });
      } catch (fetchError) {
        functions.logger.error(`Error fetching payment details for ${paymentIdStr}:`, fetchError);
        res.status(200).send("OK - Error fetching payment details");
        return;
      }

      // 5. Verificar Status 'approved'
      if (paymentDetails?.status === 'approved') {
        functions.logger.info(`Payment ${paymentIdNum} is approved. Attempting to update Firestore.`);

        // 6. Encontrar analysisId e Atualizar Firestore
        try {
          const db = admin.firestore();
          const analysesRef = db.collection("sharedAnalyses");
          // Buscar pelo paymentId (garantir que o tipo corresponde ao salvo - Number)
          const querySnapshot = await analysesRef.where("paymentId", "==", paymentIdNum).limit(1).get();
          functions.logger.info(`Firestore query result for paymentId ${paymentIdNum}: empty=${querySnapshot.empty}, size=${querySnapshot.size}`);


          if (querySnapshot.empty) {
            functions.logger.warn(`No analysis found in Firestore for paymentId: ${paymentIdNum}`);
            // Ainda responder 200 OK
          } else {
            const analysisDoc = querySnapshot.docs[0];
            functions.logger.info(`Found analysis doc: ${analysisDoc.id}. Updating...`);
            await analysisDoc.ref.update({
              isPremiumAnalysis: true,
              paymentStatus: 'approved', // Atualiza o status final
              paymentDetail: paymentDetails.status_detail || 'approved_by_webhook'
            });
            functions.logger.info(`Firestore updated successfully for analysis ${analysisDoc.id} (paymentId: ${paymentIdNum}).`);
          }
        } catch (firestoreError) {
          functions.logger.error(`Error updating Firestore for paymentId ${paymentIdNum}:`, firestoreError);
          // Ainda responder 200 OK
        }
      } else {
        functions.logger.info(`Payment ${paymentIdNum} status is not 'approved' (${paymentDetails?.status}). No Firestore update needed.`);
      }

    } else {
      functions.logger.warn("Webhook received, but not a 'payment' topic or missing data ID.", { topic, paymentIdStr });
    }

    // 7. Responder 200 OK ao Mercado Pago
    functions.logger.info("Webhook processed. Responding 200 OK.");
    res.status(200).send("OK");

  } catch (error) {
    functions.logger.error("Error processing webhook:", error);
    // É crucial responder 200 OK mesmo em caso de erro interno
    // para evitar que o Mercado Pago tente reenviar a notificação indefinidamente.
    // Logue o erro para investigação posterior.
    res.status(200).send("OK - Internal error occurred");
  }
});
