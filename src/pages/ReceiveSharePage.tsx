import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useChatAnalysis } from "../context/ChatAnalysisContext";
import { parseChat } from "../lib/parseChat";
import { analyzeChat } from "../lib/analyzeChat";
import { Card, CardContent } from "@/components/ui/card";
import { FileUp, ArrowRight, AlarmClock } from "lucide-react";
import GradientBackground from "@/components/GradientBackground";
import JSZip from "jszip";
import { useToast } from "@/hooks/use-toast";

/**
 * Página que processa arquivos compartilhados via Web Share Target (WhatsApp).
 * Aceita arquivos .zip ou .txt enviados via POST (multipart/form-data).
 */
export default function ReceiveSharePage() {
  const navigate = useNavigate();
  const { setParsedMessages, setAnalysisResults } = useChatAnalysis();
  const { toast } = useToast();

  useEffect(() => {
    // console.log("ReceiveSharePage: Componente montado. pathname:", window.location.pathname, window.location.search);

    // Se for fluxo Web Share Target (com ?share-target na URL)
    if (window.location.pathname === "/receive-share" && window.location.search.includes("share-target")) {
      (async () => {
        try {
          // console.log("ReceiveSharePage: Detected ?share-target, buscando arquivo no cache...");
          const mediaCache = await caches.open("media-share");
          const response = await mediaCache.match("shared-file");
          if (!response) {
            console.error("ReceiveSharePage: Nenhum arquivo encontrado no cache media-share.");
            toast({ title: "Nenhum arquivo compartilhado encontrado.", variant: "destructive" });
            navigate("/instructions");
            return;
          }
          const blob = await response.blob();
          await mediaCache.delete("shared-file");
          // console.log("ReceiveSharePage: Arquivo recuperado do cache, tipo:", blob.type, "tamanho:", blob.size);

          // Tenta identificar o nome do arquivo (não é garantido pelo cache, mas tentamos inferir)
          let fileName = "compartilhado.txt";
          if (blob.type === "application/zip") fileName = "compartilhado.zip";
          if (blob.type === "text/plain") fileName = "compartilhado.txt";
          const file = new File([blob], fileName, { type: blob.type });

          // Validação de extensão e tamanho
          if (!(file.name.endsWith(".txt") || file.name.endsWith(".zip")) || file.size === 0) {
            toast({ title: "Arquivo inválido. Envie um .zip ou .txt exportado do WhatsApp.", variant: "destructive" });
            navigate("/instructions");
            return;
          }

          let text = "";
          if (file.name.endsWith(".txt")) {
            text = await file.text();
          } else if (file.name.endsWith(".zip")) {
            // Usar JSZip para extrair o .txt correto
            const zip = await JSZip.loadAsync(file);
            // Procura _chat.txt (iPhone) ou qualquer .txt (Android)
            let textFile = Object.values(zip.files).find(f =>
              f.name.endsWith("_chat.txt") || f.name.endsWith(".txt")
            );
            if (!textFile) {
              toast({ title: "Nenhum arquivo .txt encontrado no ZIP.", variant: "destructive" });
              navigate("/instructions");
              return;
            }
            text = await textFile.async("string");
          } else {
            toast({ title: "Tipo de arquivo não suportado.", variant: "destructive" });
            navigate("/instructions");
            return;
          }

          // Loga as primeiras linhas do arquivo para depuração
          // console.log("ReceiveSharePage: Primeiras linhas do arquivo:", text.split(/\r?\n/).slice(0, 10));

          // Validação: verifica se o texto parece um chat do WhatsApp
          const linhas = text.split(/\r?\n/).filter(l => l.trim().length > 0);
          const linhasComData = linhas.filter(l => /^\[?\d{1,2}[./]\d{1,2}[./]\d{2,4}/.test(l));
          if (linhasComData.length === 0) {
            toast({
              title: "O arquivo não parece ser um chat exportado do WhatsApp.",
              description: "Por favor, exporte a conversa diretamente pelo WhatsApp e compartilhe o arquivo .txt ou .zip gerado.",
              variant: "destructive"
            });
            navigate("/instructions");
            return;
          }

          const chatData = parseChat(text);
          if (!chatData || chatData.length === 0) {
            toast({
              title: "Nenhuma mensagem válida encontrada.",
              description: "O arquivo não contém mensagens exportadas do WhatsApp.",
              variant: "destructive"
            });
            navigate("/instructions");
            return;
          }

          setParsedMessages(chatData);
          const analysis = analyzeChat(chatData);
          setAnalysisResults(analysis);
          navigate("/results");
        } catch (err) {
          console.error("ReceiveSharePage: Erro ao processar arquivo do cache", err);
          toast({ title: "Erro ao processar o arquivo compartilhado.", variant: "destructive" });
          navigate("/instructions");
        }
      })();
      return;
    }

    // Só processa se for rota correta
    if (window.location.pathname !== "/receive-share") return;

    // Web Share Target API (Chrome Android)
    if ("launchQueue" in window) {
      // console.log("ReceiveSharePage: launchQueue está disponível no window.");
      // @ts-ignore
      window.launchQueue.setConsumer(async (launchParams: any) => {
        // console.log("ReceiveSharePage: launchQueue.setConsumer chamado!", launchParams);
        if (!launchParams.files || !launchParams.files.length) {
          // console.log("ReceiveSharePage: Nenhum arquivo recebido em launchParams.");
          return;
        }
        const fileHandle = launchParams.files[0];
        let file: File;
        if ("getFile" in fileHandle) {
          file = await fileHandle.getFile();
        } else {
          file = fileHandle as File;
        }
        await handleFile(file);
      });
    } else {
      // console.log("ReceiveSharePage: launchQueue NÃO está disponível no window.");
    }

    async function handleFile(file: File) {
      // console.log("handleFile: Iniciando processamento do arquivo", file.name, file.type, file.size);
      try {
        let chatData;
        // console.log("handleFile: Verificando tipo de arquivo", file.name);
        if (file.name.endsWith(".txt")) {
          // console.log("handleFile: Arquivo TXT detectado, lendo como texto");
          const text = await file.text();
          // console.log("handleFile: Conteúdo do arquivo TXT lido", text.substring(0, 50) + "...");
          chatData = parseChat(text);
          // console.log("handleFile: parseChat (TXT) concluído");
        } else if (file.name.endsWith(".zip")) {
          // console.log("handleFile: Arquivo ZIP detectado, lendo como texto");
          const text = await file.text();
          // console.log("handleFile: Conteúdo do arquivo ZIP lido (como texto)", text.substring(0, 50) + "...");
          chatData = parseChat(text);
          // console.log("handleFile: parseChat (ZIP) concluído");
        } else {
          console.error("handleFile: Tipo de arquivo não suportado", file.name);
          throw new Error("Tipo de arquivo não suportado.");
        }
        // console.log("handleFile: setParsedMessages...");
        setParsedMessages(chatData);
        // console.log("handleFile: analyzeChat...");
        const analysis = analyzeChat(chatData);
        // console.log("handleFile: setAnalysisResults...");
        setAnalysisResults(analysis);
        // console.log("handleFile: navigate('/results')...");
        navigate("/results");
        // console.log("handleFile: Navegação para /results concluída");
      } catch (err) {
        console.error("handleFile: Erro no processamento do arquivo compartilhado", err);
        alert("Erro ao processar o arquivo compartilhado.");
        navigate("/");
      }
    }
    // eslint-disable-next-line
  }, []);

  return (
    <GradientBackground variant="purple">
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <Card className="cosmic-card w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse bg-primary/20 rounded-full"></div>
                <div className="relative bg-white/30 p-4 rounded-full">
                  <FileUp className="h-12 w-12 text-primary" strokeWidth={1.5} />
                </div>
              </div>
              
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Processando seu arquivo</h1>
                <p className="text-lg text-white/90">Estamos analisando suas mensagens...</p>
              </div>
              
              <div className="flex items-center gap-2 text-white/80">
                <AlarmClock className="h-5 w-5" />
                <p>Isso leva apenas alguns segundos</p>
              </div>
              
              <div className="flex justify-center w-full">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse delay-100"></div>
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse delay-200"></div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-white/60">
                <ArrowRight className="h-4 w-4" />
                <p>Você será redirecionado automaticamente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </GradientBackground>
  );
}
