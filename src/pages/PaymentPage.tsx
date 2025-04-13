import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  AlertCircle,
  CheckCircle2,
  LucideLoader2,
  Sparkles,
  Lock
} from "lucide-react";
import { useChatAnalysis } from "@/context/ChatAnalysisContext";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
 

declare global {
  interface Window {
    MercadoPago?: any;
    _mpCardFormInstance?: any;
  }
}

function getPaymentFunctionUrl() {
  const projectId = "horoscopozap"; // seu projectId do Firebase
  const isLocalhost = window.location.hostname === "localhost";
    return `https://us-central1-horoscopozap.cloudfunctions.net/createPayment`;
  
}


const PaymentPage = () => {
  const { analysisId: routeId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();

  const analysisId = routeId;
  const { toast } = useToast();
  const {} = useChatAnalysis();

  const [isLoadingSdk, setIsLoadingSdk] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mpInstance, setMpInstance] = useState<any>(null);
  const [pixQrCodeBase64, setPixQrCodeBase64] = useState<string | null>(null);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixPaymentId, setPixPaymentId] = useState<string | null>(null);
  const [isPollingPremium, setIsPollingPremium] = useState(false);
  const [pixTimer, setPixTimer] = useState<number>(0); // segundos restantes

const [identificationType, setIdentificationType] = useState<"CPF" | "CNPJ">("CPF");
const [identificationNumber, setIdentificationNumber] = useState<string>("");
const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "pix">("credit_card");
const [buyerEmail, setBuyerEmail] = useState<string>(""); // email do comprador

// Timer visual para expiração do QR Code Pix
useEffect(() => {
  if (paymentMethod === "pix" && pixQrCodeBase64 && pixTimer > 0) {
    const timer = setInterval(() => {
      setPixTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }
}, [paymentMethod, pixQrCodeBase64, pixTimer]);

  const premiumPrice = 1.99;

// Handlers para atualizar o estado dos campos do comprador
const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setBuyerEmail(e.target.value);
};

const handleIdentificationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  setIdentificationType(e.target.value as "CPF" | "CNPJ");
};

const handleIdentificationNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setIdentificationNumber(e.target.value);
};

  useEffect(() => {
    if (!analysisId) {
      const msg = "ID da análise não encontrado.";
      setError(msg);
      toast({ title: "Erro", description: msg, variant: "destructive" });
      setIsLoadingSdk(false);
      return;
    }

    const publicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;
    if (!publicKey) {
      const msg = "Chave pública do Mercado Pago não configurada.";
      setError(msg);
      toast({ title: "Erro", description: msg, variant: "destructive" });
      setIsLoadingSdk(false);
      return;
    }

    const scriptId = "mercado-pago-sdk";
    const existingScript = document.getElementById(scriptId);
    let script: HTMLScriptElement | null = null;

    if (!existingScript) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;

      script.onload = () => {
        console.log("Mercado Pago SDK carregado.");
        try {
          if (window.MercadoPago) {
            const mp = new window.MercadoPago(publicKey);
            setMpInstance(mp);
            console.log("Instância Mercado Pago criada.");
          } else {
            throw new Error("Objeto window.MercadoPago não encontrado após carregar script.");
          }
        } catch (err) {
          console.error("Erro ao inicializar Mercado Pago SDK:", err);
          setError("Erro ao inicializar Mercado Pago.");
        } finally {
          setIsLoadingSdk(false);
        }
      };

      script.onerror = () => {
        console.error("Erro ao carregar o SDK Mercado Pago");
        setError("Erro ao carregar o SDK Mercado Pago.");
        setIsLoadingSdk(false);
      };

      document.body.appendChild(script);
    } else {
      try {
        if (window.MercadoPago) {
          const mp = new window.MercadoPago(publicKey);
          setMpInstance(mp);
          console.log("Instância Mercado Pago criada (script pré-existente).");
        } else {
          console.warn("Script do MP existe, mas window.MercadoPago não está definido.");
          setError("Falha ao usar script existente do Mercado Pago. Recarregue a página.");
        }
      } catch (err) {
        console.error("Erro ao inicializar Mercado Pago SDK (script pré-existente):", err);
        setError("Erro ao inicializar Mercado Pago.");
      } finally {
        setIsLoadingSdk(false);
      }
    }
  }, [analysisId, toast]);

  useEffect(() => {
    if (!mpInstance || isLoadingSdk) return;

    // Only initialize cardForm if payment method is credit_card
    if (paymentMethod !== "credit_card") {
      // If switching to Pix, unmount any existing cardForm
      if (window._mpCardFormInstance && typeof window._mpCardFormInstance.unmount === "function") {
        try {
          if (window._mpCardFormInstance && typeof window._mpCardFormInstance.unmount === "function") {
            console.log("Desmontando cardForm porque método mudou para Pix");
            window._mpCardFormInstance.unmount();
          }
        } catch (err) {
          console.warn("CardForm não estava montado ao tentar desmontar (Pix):", err);
        }
      }
      return;
    }

    let cardFormInstance: any = null;

    try {
      try {
        if (window._mpCardFormInstance && typeof window._mpCardFormInstance.unmount === "function") {
          console.log("Desmontando cardForm anterior...");
          window._mpCardFormInstance.unmount();
        }
      } catch (err) {
        console.warn("CardForm não estava montado ao tentar desmontar:", err);
      }

      // Adiciona verificação para garantir que o container do formulário existe
      if (!document.getElementById('form-checkout')) {
        throw new Error("Elemento #form-checkout não encontrado no DOM ao tentar criar cardForm.");
      }

      const result = mpInstance.cardForm({
        amount: premiumPrice.toFixed(2),
        autoMount: true, // Corrigido para true para montagem automática recomendada
        form: {
          id: "form-checkout",
          cardholderName: { id: "form-checkout__cardholderName", placeholder: "Nome como no cartão" },
          cardNumber: { id: "form-checkout__cardNumber", placeholder: "---- ---- ---- ----" },
          issuer: { id: "form-checkout__issuer", placeholder: "Bandeira" },
          expirationDate: { id: "form-checkout__expirationDate", placeholder: "MM/AA" },
          securityCode: { id: "form-checkout__securityCode", placeholder: "CVC" },
          installments: { id: "form-checkout__installments", placeholder: "Parcelas" },
          email: { id: "email", placeholder: "seu@email.com" },
          identificationType: { id: "form-checkout__identificationType", placeholder: "CPF" },
          identificationNumber: { id: "form-checkout__identificationNumber", placeholder: "000.000.000-00" },
        },
        callbacks: {
          onFormMounted: (err: any) => {
            if (err) {
              console.error("Erro ao montar formulário Mercado Pago:", err);
              if (Array.isArray(err)) {
                err.forEach((e, idx) => console.error(`Erro ${idx}:`, e));
              }
              setError("Erro ao preparar o formulário de pagamento.");
            } else {
              console.log("Formulário Mercado Pago montado com sucesso.");
            }
          },
          onSubmit: async (event: any) => {
            event.preventDefault(); // Prevenir submissão padrão
            setIsProcessing(true); // Inicia processamento
            setError(null);

            try {
              const cardData = window._mpCardFormInstance?.getCardFormData();
              if (!cardData) {
                throw new Error("Não foi possível obter os dados do formulário do cartão.");
              }

              // Tentar obter o email do estado e do DOM, priorizando o estado, mas usando o DOM como fallback
              const emailFromDOM = (document.getElementById('email') as HTMLInputElement)?.value?.trim();
              const finalEmail = buyerEmail?.trim() || emailFromDOM;
              const finalIdType = cardData.identificationType || identificationType;
              const finalIdNumber = cardData.identificationNumber || identificationNumber;
              const finalAnalysisId = analysisId?.trim();

              // Validação rigorosa dos campos obrigatórios
              if (!cardData.token) throw new Error("Token do cartão não gerado.");
              if (!cardData.paymentMethodId) throw new Error("Método de pagamento não selecionado.");
              if (!finalEmail) throw new Error("Email do comprador é obrigatório.");
              if (!finalIdType) throw new Error("Tipo de documento é obrigatório.");
              if (!finalIdNumber) throw new Error("Número do documento é obrigatório.");
              if (!finalAnalysisId) throw new Error("ID da análise não encontrado.");

              // Garantir que transaction_amount e installments são number
              const transactionAmountNumber = Number(premiumPrice);
              const installmentsNumber = Number(cardData.installments) || 1;

              const bodyToSend = {
                token: cardData.token,
                payment_method_id: cardData.paymentMethodId,
                issuer_id: cardData.issuerId || "0",
                transaction_amount: transactionAmountNumber,
                installments: installmentsNumber,
                description: "Pagamento Premium",
                analysisId: finalAnalysisId,
                payer: {
                  email: finalEmail,
                  identification: {
                    type: finalIdType,
                    number: finalIdNumber
                  }
                }
              };

              // Logs detalhados para debug
              console.log("Dados do CardForm:", cardData);
              console.log("typeof transaction_amount:", typeof transactionAmountNumber, transactionAmountNumber);
              console.log("typeof installments:", typeof installmentsNumber, installmentsNumber);
              console.log("Email do Estado (buyerEmail):", buyerEmail);
              console.log("Email do DOM (input#email):", emailFromDOM);
              console.log("Email usado (finalEmail):", finalEmail);
              console.log("analysisId (usado):", finalAnalysisId);
              console.log("Body enviado para Cloud Function:", bodyToSend);

              // Chamada para a Cloud Function
              const response = await fetch(getPaymentFunctionUrl(), {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(bodyToSend) // Usar o bodyToSend validado
              });

              const result = await response.json();
              console.log("Resposta da Cloud Function:", result);

              if (!response.ok) {
                 // Lança erro para ser pego pelo catch, usando a mensagem do backend
                 throw new Error(result.error || `Erro ${response.status} ao processar pagamento.`);
              }

              if (result.success) {
                toast({
                  title: "Pagamento aprovado!",
                  description: "Seu acesso premium foi liberado.",
                  variant: "default"
                });
                navigate(`/results/${analysisId}`);
              } else {
                 // Lança erro para ser pego pelo catch, usando a mensagem do backend
                 throw new Error(result.message || `Pagamento ${result.status}. ${result.detail}`);
              }

            } catch (err: any) {
              console.error("Erro no onSubmit do CardForm:", err);
              setError(err.message || "Erro ao processar pagamento com cartão.");
              toast({
                title: "Falha no pagamento com cartão",
                description: err.message || "Não foi possível processar seu pagamento.",
                variant: "destructive",
              });
              setIsProcessing(false);
            }
          }
        }
      });

      // O resultado de cardForm pode ser a instância ou um array de erros
      if (Array.isArray(result)) {
        // Se for um array, são erros na inicialização
        console.error("Erro ao inicializar cardForm (retornou array):", result);
        setError("Erro ao preparar o formulário de pagamento com cartão.");
        result.forEach((e: any, idx: number) => console.error(`Erro ${idx}:`, e));
      } else if (result && typeof result.mount === 'function') {
        // Se for um objeto com 'mount', é a instância
        cardFormInstance = result;
        window._mpCardFormInstance = cardFormInstance; // Armazena globalmente
        console.log("Instância cardForm criada com autoMount:true (montagem automática).");

      } else {
        // Caso inesperado
        console.error("Resultado inesperado ao criar cardForm:", result);
        setError("Erro inesperado ao preparar formulário de cartão.");
      }

    } catch (err: any) { // Captura erros gerais da criação/verificação
      console.error("Erro geral ao tentar criar/verificar cardForm:", err);
      setError(err.message || "Erro ao preparar o formulário de pagamento.");
    }

    return () => {
      if (cardFormInstance && typeof cardFormInstance.unmount === "function") {
        try {
          cardFormInstance.unmount();
        } catch (unmountError) {
          console.error("Erro ao desmontar CardForm:", unmountError);
        }
      }
    };
  }, [mpInstance, isLoadingSdk, premiumPrice, toast, navigate, analysisId, paymentMethod]);

  // Polling para detectar liberação premium após pagamento Pix
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (
      paymentMethod === "pix" &&
      pixQrCodeBase64 &&
      analysisId &&
      !isProcessing &&
      !isPollingPremium // Evita múltiplos intervals
    ) {
      setIsPollingPremium(true);
      interval = setInterval(async () => {
        try {
          // Busca o documento da análise no Firestore via REST API
          const resp = await fetch(
            `https://firestore.googleapis.com/v1/projects/horoscopozap/databases/(default)/documents/sharedAnalyses/${analysisId}`
          );
          if (resp.ok) {
            const data = await resp.json();
            // O campo isPremiumAnalysis pode estar em fields.isPremiumAnalysis.booleanValue
            const isPremium =
              data?.fields?.isPremiumAnalysis?.booleanValue === true;
            if (isPremium) {
              clearInterval(interval!);
              setIsPollingPremium(false);
              // Redireciona para resultados
              window.location.href = `/results/${analysisId}`;
            }
          }
        } catch (e) {
          // Silencia erros de polling
        }
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
      setIsPollingPremium(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, pixQrCodeBase64, analysisId, isProcessing]);

  // Handler central para submissão do formulário
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Previne submissão HTML padrão
    setIsProcessing(true);
    setError(null);
    setPixQrCodeBase64(null); // Limpa QR anterior
    setPixQrCode(null);
    setPixPaymentId(null);

    try {
      if (paymentMethod === "pix") {
        console.log("Iniciando pagamento via Pix");

        // Validar campos do pagador antes de enviar
        const finalEmail = buyerEmail?.trim();
        const finalIdType = identificationType;
        const finalIdNumber = identificationNumber?.trim();
        const finalAnalysisId = analysisId?.trim();

        if (!finalEmail) throw new Error("Email do comprador é obrigatório.");
        if (!finalIdType) throw new Error("Tipo de documento é obrigatório.");
        if (!finalIdNumber) throw new Error("Número do documento é obrigatório.");
        if (!finalAnalysisId) throw new Error("ID da análise não encontrado.");

        const bodyToSend = {
          transaction_amount: premiumPrice,
          description: "Pagamento Premium",
          analysisId: finalAnalysisId,
          payer: {
            email: finalEmail,
            identification: {
              type: finalIdType,
              number: finalIdNumber
            }
          }
        };

        console.log("Body enviado para Cloud Function (Pix):", bodyToSend);

        // Chamada para a nova Cloud Function createPixPayment
        const pixFunctionUrl = "https://us-central1-horoscopozap.cloudfunctions.net/createPixPayment"; // Substitua se necessário
        const response = await fetch(pixFunctionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(bodyToSend)
        });

        const result = await response.json();
        console.log("Resposta da Cloud Function (Pix):", result);

        if (!response.ok) {
          throw new Error(result.error || `Erro ${response.status} ao gerar pagamento Pix.`);
        }

        if (result.success && result.qr_code_base64 && result.qr_code) {
          setPixQrCodeBase64(result.qr_code_base64);
          setPixQrCode(result.qr_code);
          setPixPaymentId(result.paymentId);

          // Extrai a data de expiração e calcula os segundos restantes
          const expirationDateString = result.paymentResult?.date_of_expiration;
          if (expirationDateString) {
            const expirationDate = new Date(expirationDateString);
            const now = new Date();
            // Garante que não seja negativo e converte para segundos
            const remainingSeconds = Math.max(0, Math.floor((expirationDate.getTime() - now.getTime()) / 1000));
            setPixTimer(remainingSeconds); // Define o timer com os segundos restantes
            console.log(`QR Code expiration: ${expirationDateString}, Remaining seconds: ${remainingSeconds}`);
          } else {
            console.warn("Data de expiração não encontrada na resposta do pagamento. O timer pode não funcionar como esperado.");
            setPixTimer(0); // Define como 0 se a data não for encontrada
          }

          toast({
            title: "QR Code Pix Gerado!",
            description: "Escaneie o código ou copie para pagar.",
            variant: "default",
          });
        } else {
          setPixTimer(0); // Reseta o timer se a geração do QR falhar
          throw new Error("Não foi possível obter os dados do QR Code Pix.");
        }

      } else if (paymentMethod === "credit_card") {
        console.log("Submissão via Cartão de Crédito - SDK deve assumir.");
        // O SDK do Mercado Pago deve interceptar a submissão do formulário
        // e chamar o callback 'onSubmit' que definimos dentro de mpInstance.cardForm
        // Se o SDK não fizer isso automaticamente (o que seria estranho),
        // precisaríamos chamar algo como window._mpCardFormInstance.submit() aqui.
        // Por enquanto, confiamos que o SDK fará o trabalho.
        // O callback 'onSubmit' do cardForm cuidará do resto (getCardFormData, etc.)
        // e também do navigate/localStorage em caso de sucesso.
      }
    } catch (err: any) {
      // Erro GERAL no handleFormSubmit (ex: falha na lógica Pix)
      console.error("Erro no handleFormSubmit:", err);
      setError(err.message || "Ocorreu um erro inesperado.");
      toast({
        title: "Erro",
        description: err.message || "Não foi possível processar a solicitação.",
        variant: "destructive",
      });
      setIsProcessing(false); // Garante que sai do estado de processamento em caso de erro aqui
    } finally {
      // IMPORTANTE: Não colocar setIsProcessing(false) aqui se for cartão,
      // pois o callback onSubmit do cardForm precisa rodar e ele tem seu próprio finally.
      // Só definimos como false aqui se for Pix ou erro GERAL antes de chamar o cartão.
      if (paymentMethod === "pix") {
         setIsProcessing(false);
      }
    } // Fim do try...catch...finally
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 lg:p-8 bg-gradient-to-b from-background to-secondary/20">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center justify-center gap-2">
            <CreditCard className="h-8 w-8 text-primary" />
            <span>Pagamento Premium</span>
          </h1>
          <p className="text-muted-foreground">
            Desbloqueie análises avançadas, textos criativos por IA e muito mais
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          <Card className="md:col-span-3 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Ativar Recursos Premium
              </CardTitle>
              <CardDescription>
                Insira os dados para completar sua compra
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && !isProcessing && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isLoadingSdk ? (
                <div className="space-y-4">
                  <p className="text-center text-muted-foreground flex items-center justify-center">
                    <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando ambiente seguro de pagamento...
                  </p>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !mpInstance && !error ? (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Não foi possível carregar o módulo de pagamento. Tente recarregar a página.</AlertDescription>
                </Alert>
              ) : mpInstance ? (
                // Anexa o handler ao onSubmit do form
                <form id="form-checkout" className="space-y-6" onSubmit={handleFormSubmit}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Método de pagamento</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="credit_card"
                            checked={paymentMethod === "credit_card"}
                            onChange={() => setPaymentMethod("credit_card")}
                            disabled={isProcessing}
                          />
                          Cartão de Crédito
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="pix"
                            checked={paymentMethod === "pix"}
                            onChange={() => setPaymentMethod("pix")}
                            disabled={isProcessing}
                          />
                          Pix
                        </label>
                      </div>
                    </div>

                    {/* Email deve ser o PRIMEIRO campo do formulário */}
                    <div className="space-y-2">
                      <Label htmlFor="form-checkout__email">Email</Label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="seu@email.com"
                        disabled={isProcessing}
                        value={buyerEmail} // Reintroduzir controle de estado
                        onChange={handleEmailChange} // Reintroduzir controle de estado
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      />
                    </div>
                    {/* Para debug, verifique no console manualmente se o campo está no DOM:
                        Abra o console e rode: document.getElementById("form-checkout__email")
                        Não é permitido usar console.log diretamente no JSX */}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="form-checkout__identificationType">Tipo Doc.</Label>
                        <select
                          id="form-checkout__identificationType"
                          name="identificationType"
                          required
                          disabled={isProcessing}
                          value={identificationType} // Reintroduzir controle de estado
                          onChange={handleIdentificationTypeChange} // Reintroduzir controle de estado
                          className="h-10 border rounded-md w-full px-2"
                        >
                          <option value="CPF">CPF</option>
                          <option value="CNPJ">CNPJ</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="form-checkout__identificationNumber">Número Doc.</Label>
                        <input
                          id="form-checkout__identificationNumber"
                          name="identificationNumber"
                          required
                          disabled={isProcessing}
                          placeholder="000.000.000-00"
                          value={identificationNumber} // Reintroduzir controle de estado
                          onChange={handleIdentificationNumberChange} // Reintroduzir controle de estado
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                        />
                      </div>
                    </div>

                    {paymentMethod === "credit_card" && (
                      <>
                        <Separator />

                        <h3 className="text-sm font-medium text-muted-foreground">Dados do cartão</h3>

                        <div className="space-y-2">
                          <Label htmlFor="form-checkout__cardholderName">Nome no cartão</Label>
                          {/* Alterado de div para input */}
                          <input id="form-checkout__cardholderName" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="form-checkout__cardNumber">Número do cartão</Label>
                          <input id="form-checkout__cardNumber" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"></input>
                        </div>

                        {/* Adiciona o container para a bandeira (issuer) - Alterado para select */}
                        <div className="space-y-2">
                           <Label htmlFor="form-checkout__issuer">Bandeira</Label>
                           <select id="form-checkout__issuer" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"></select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="form-checkout__expirationDate">Validade (MM/AA)</Label>
                            <input id="form-checkout__expirationDate" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" ></input>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="form-checkout__securityCode">Cód. Segurança</Label>
                            <input id="form-checkout__securityCode" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"></input>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="form-checkout__installments">Parcelas</Label>
                          {/* Alterado de div para select */}
                          <select id="form-checkout__installments" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"></select>
                        </div>
                        </>
                    )}

                    {/* Exibe QR Code e botão Copiar se o método for Pix e os dados existirem */}
                    {paymentMethod === "pix" && pixQrCodeBase64 && pixQrCode && (
                      <div className="mt-6 p-4 border rounded-lg bg-muted/40 flex flex-col items-center space-y-4">
                        <h3 className="text-lg font-semibold">Pague com Pix</h3>
                        <img
                          src={`data:image/jpeg;base64,${pixQrCodeBase64}`}
                          alt="QR Code Pix"
                          className="max-w-xs w-full border rounded"
                        />
                        {/* Timer visual de expiração */}
                        <div className="text-sm text-center text-orange-600 font-semibold">
                          {pixTimer > 0
                            ? `O QR Code expira em ${Math.floor(pixTimer / 60)
                                .toString()
                                .padStart(2, "0")}:${(pixTimer % 60)
                                .toString()
                                .padStart(2, "0")}`
                            : "QR Code expirado. Gere um novo Pix se necessário."}
                        </div>
                        <div className="w-full space-y-2">
                           <Label htmlFor="pix-copy-paste">Pix Copia e Cola:</Label>
                           <div className="flex gap-2">
                             <Input id="pix-copy-paste" value={pixQrCode} readOnly className="flex-grow" />
                             <Button
                               type="button"
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 navigator.clipboard.writeText(pixQrCode);
                                 toast({ title: "Código Pix copiado!" });
                               }}
                             >
                               Copiar
                             </Button>
                           </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Escaneie o QR Code ou copie o código acima no seu app bancário.<br/>
                          Pagamento ID: {pixPaymentId}
                        </p>
                      </div>
                    )}

                    {/* Botão principal de submissão */}
                    <Button
                      type="submit"
                      className="w-full py-3 mt-4"
                      // Desabilitar se for Pix e já tiver gerado QR Code? Ou permitir gerar novo?
                      // Por enquanto, permite gerar novo.
                      disabled={isProcessing || isLoadingSdk || (paymentMethod === 'credit_card' && !mpInstance)}
                    >
                      {isProcessing ? (
                        <>
                          <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          {paymentMethod === "pix" ? "Gerar QR Code Pix" : `Pagar R$ ${premiumPrice.toFixed(2)}`}
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                      <img src="/MP_RGB_HANDSHAKE_color-blanco_vert.png" alt="Mercado Pago" className="h-16 opacity-80"/>
                      Pagamento seguro processado por Mercado Pago.
                    </p>
                  </div>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-4">
            <Card className="bg-secondary/20">
              <CardHeader>
                <CardTitle className="text-lg">Resumo da Compra</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Recursos Premium</span>
                    <span className="font-medium">R$ {premiumPrice.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span>Total</span>
                    <span>R$ {premiumPrice.toFixed(2)}</span>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 w-full justify-center py-1">
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Pagamento Único - Apenas dessa analise
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Benefícios Incluídos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Análises detalhadas de sentimento e comportamento</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Previsões e poemas criativos gerados por IA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Métricas de passivo-agressividade e flerte</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-4 border-t">
                <Button variant="outline" size="sm" asChild className="w-full">
                  {analysisId ? (
                    <Link to={`/results/${analysisId}`}>Voltar para resultados</Link>
                  ) : (
                    <Link to="/">Voltar para início</Link>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="faq-1">
              <AccordionTrigger>Como funciona o pagamento?</AccordionTrigger>
              <AccordionContent>
                Seu pagamento é processado de forma segura via Mercado Pago. Os dados do seu cartão são enviados diretamente para eles de forma criptografada e não ficam armazenados em nossos servidores.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-2">
              <AccordionTrigger>O acesso premium vale para sempre?</AccordionTrigger>
              <AccordionContent>
                O acesso premium é vitalício, mas vinculado a esta análise específica. Se você iniciar uma nova análise, será necessário adquirir o premium novamente.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;