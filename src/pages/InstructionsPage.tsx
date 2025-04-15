
import React, { useState, useEffect } from 'react'; // Add useEffect
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip'; // Import JSZip
import { Button } from '@/components/ui/button';
import { ChevronLeft, MessageSquare, MoreVertical, Download, Upload, HelpCircle, FileArchive, Smartphone, Share2 } from 'lucide-react'; // Added Smartphone, Share2
import { useChatAnalysis } from '@/context/ChatAnalysisContext'; // Import the context hook
import GradientBackground from '@/components/GradientBackground';
import StepIndicator from '@/components/StepIndicator';
import InstallPwaButton from '@/components/InstallPwaButton'; // Import the button component
import { toast } from 'sonner';

// Remove local BeforeInstallPromptEvent interface definition

const InstructionsPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  // Get PWA prompt state and handlers from context
  const { 
    setRawChatText, 
    setIsLoading, 
    setError, 
    deferredPrompt, // Get prompt from context
    handleInstallClick, // Get handler from context
    isPwaInstalling // Get install status from context
  } = useChatAnalysis();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;

    if (selectedFile) {
      // Accept both .txt and .zip files
      if (selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.zip')) {
        setFile(selectedFile);
        toast.success(`Arquivo ${selectedFile.name.endsWith('.zip') ? '.zip' : '.txt'} selecionado!`);
      } else {
        setFile(null); // Reset if invalid file type
        toast.error('Por favor, selecione um arquivo .txt ou .zip exportado do WhatsApp.');
      }
    }
  };

  const handleSubmit = async () => { // Make handleSubmit async
    if (!file) {
      toast.error('Por favor, selecione um arquivo de chat (.txt ou .zip) para continuar');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let chatText: string | null = null;

      if (file.name.endsWith('.zip')) {
        // Handle ZIP file
        const zip = new JSZip();
        const content = await zip.loadAsync(file); // Load zip file content
        let txtFileFound = false;

        // Search for the chat file within the zip
        for (const filename in content.files) {
          // WhatsApp usually names it _chat.txt or similar
          if (filename.endsWith('.txt') && !filename.startsWith('__MACOSX/')) { 
            const fileInZip = content.files[filename];
            chatText = await fileInZip.async('string'); // Extract text content
            txtFileFound = true;
            // console.log(`Found and extracted text from: ${filename}`);
            break; // Stop after finding the first .txt file
          }
        }

        if (!txtFileFound || chatText === null) {
          throw new Error('Nenhum arquivo .txt de chat encontrado dentro do .zip.');
        }

      } else if (file.name.endsWith('.txt')) {
        // Handle TXT file (existing logic wrapped in Promise)
        chatText = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const text = event.target?.result;
            if (typeof text === 'string') {
              resolve(text);
            } else {
              reject(new Error('Falha ao ler o conteúdo do arquivo .txt.'));
            }
          };
          reader.onerror = () => {
            reject(new Error('Erro ao ler o arquivo .txt.'));
          };
          reader.readAsText(file);
        });
      } else {
         // Should not happen due to handleFileChange validation, but good practice
         throw new Error('Tipo de arquivo inválido.');
      }

      // If text was successfully extracted (from either zip or txt)
      if (chatText) {
        setRawChatText(chatText); // Store raw text in context
        navigate('/analyzing'); // Navigate after successful processing
      } else {
         // This case should ideally be caught by earlier checks
         throw new Error('Não foi possível extrair o texto do chat.');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setError(errorMessage);
      toast.error(`Erro ao processar arquivo: ${errorMessage}`);
      console.error("File processing error:", err);
    } finally {
      setIsLoading(false); // Ensure loading is always turned off
    }
  };

  // Remove local useEffect for PWA install prompt logic
  // Remove local handleInstallClick handler

  // Updated steps to prioritize PWA installation and sharing
  const steps = [
    {
      icon: <Smartphone className="h-10 w-10 text-cosmic-purple" />,
      title: "1. Instale nosso App",
      description: "Para a melhor experiência, adicione o HoroscopoZap à sua tela inicial. Procure o botão 'Instalar' no site.",
      image: { src: "/images/instructions/step1-install-prompt.png", alt: "Banner ou botão de instalação do PWA no site" }
    },
    {
      icon: <MessageSquare className="h-10 w-10 text-cosmic-purple" />,
      title: "2. Abra a conversa no WhatsApp",
      description: "Selecione o chat individual ou grupo que deseja analisar.",
      image: { src: "/images/instructions/step2-whatsapp-chat.png", alt: "Tela de conversa aberta no WhatsApp" }
    },
    {
      icon: <MoreVertical className="h-10 w-10 text-cosmic-purple" />,
      title: "3. Exporte a conversa",
      description: "No WhatsApp, vá em Opções (três pontinhos) > Mais > Exportar conversa.",
      image: { src: "/images/instructions/step3-whatsapp-export-menu.png", alt: "Menu 'Mais' do WhatsApp destacando 'Exportar conversa'" }
    },
    {
      icon: <Download className="h-10 w-10 text-cosmic-purple" />,
      title: "4. Escolha 'Sem Mídia'",
      description: "Só precisamos do texto! Isso torna o arquivo menor e o processo mais rápido.",
      image: { src: "/images/instructions/step4-whatsapp-without-media.png", alt: "Pop-up do WhatsApp perguntando 'Incluir mídia?' com 'Sem mídia' selecionado" }
    },
    {
      icon: <Share2 className="h-10 w-10 text-cosmic-purple" />,
      title: "5. Escolha 'Compartilhar'",
      description: "Na tela de compartilhamento do seu celular, talvez precise clicar em 'Mais' ou procurar na lista de apps.",
      image: { src: "/images/instructions/step5-share-options.png", alt: "Tela de compartilhamento do celular mostrando a opção 'Mais'" } // Updated image and text for step 5
    },
    { // New step 6
      icon: <Smartphone className="h-10 w-10 text-cosmic-purple" />, // Using Smartphone icon, adjust if needed
      title: "6. Selecione o HoroscopoZap",
      description: "Encontre e toque no ícone do HoroscopoZap. O app será aberto e a análise começará automaticamente!",
      image: { src: "/images/instructions/step6-select-horoscopozap.png", alt: "Lista de aplicativos para compartilhar destacando o HoroscopoZap" }
    }
  ];

  return (
    <GradientBackground>
      <div className="flex flex-col h-full">
        <header className="flex items-center py-4">
          <button 
            onClick={() => navigate("/")} 
            className="p-2"
          >
            <ChevronLeft className="h-6 w-6 text-cosmic-purple" />
          </button>
          <h1 className="text-2xl font-bold flex-1 text-center mr-8">Instruções</h1>
        </header>
        
        {/* Updated total steps */}
        <StepIndicator currentStep={1} totalSteps={6} /> {/* Changed totalSteps to 6 */}
        
        <div className="mt-4 mb-6">
          <h2 className="text-xl font-bold text-center mb-2">
            Como Analisar sua Conversa
          </h2>
           <p className="text-center text-sm opacity-80 px-4">
            O jeito mais fácil é instalando nosso app e compartilhando a conversa direto do WhatsApp!
          </p>
        </div>
        
        <div className="space-y-6 mb-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start cosmic-card">
              <div className="bg-white rounded-full p-3 mr-4">
                {step.icon}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{step.title}</h3>
                <p className="text-sm opacity-80 mb-2">{step.description}</p>
                {/* Display image if available */}
                {step.image && (
                  <img 
                    src={step.image.src} 
                    alt={step.image.alt} 
                    className="mt-2 rounded-md border border-muted max-w-full h-auto" 
                    loading="lazy" // Add lazy loading
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* File Upload Area - Now presented as an alternative */}
         <div className="my-8 text-center">
          <p className="text-lg font-semibold mb-2">Alternativa: Enviar arquivo pelo site</p>
          <p className="text-sm opacity-80 mb-4 px-4">Se preferir não instalar o app, você pode exportar o chat para seu dispositivo e fazer o upload do arquivo (.txt ou .zip) aqui:</p>
        </div>
        <div className="relative mb-8">
          <div className="cosmic-card border-2 border-dashed border-cosmic-purple p-8 text-center">
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".txt,.zip" // Accept both .txt and .zip
            />
            {file?.name.endsWith('.zip') ? (
               <FileArchive className="h-12 w-12 mx-auto mb-4 text-cosmic-purple" /> // Changed icon to FileArchive
            ) : (
               <Upload className="h-12 w-12 mx-auto mb-4 text-cosmic-purple" />
            )}
            <p className="font-medium">
              {file ? file.name : 'Clique para selecionar o arquivo .txt ou .zip'}
            </p>
            <p className="text-sm opacity-70 mt-2">
              {file ? `Arquivo ${file.name.endsWith('.zip') ? '.zip' : '.txt'} selecionado` : 'Ou arraste e solte aqui'}
            </p>
          </div>
        </div>
        
        {/* Removed the help button as instructions are clearer now */}
        {/* <div className="flex items-center justify-center mb-6"> ... </div> */}
        
        <div className="mt-auto mb-8">
          <Button 
            onClick={handleSubmit}
            disabled={!file}
            className={`cosmic-btn w-full ${!file ? 'opacity-60' : ''}`}
          >
            Analisar Mensagens
          </Button>
        </div>

        {/* Conditionally render the install button within this page */}
        {deferredPrompt && <InstallPwaButton onInstallClick={handleInstallClick} isInstalling={isPwaInstalling} />}
        
      </div>
    </GradientBackground>
  );
};

export default InstructionsPage;
