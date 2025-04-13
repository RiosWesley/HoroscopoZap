
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip'; // Import JSZip
import { Button } from '@/components/ui/button';
import { ChevronLeft, MessageSquare, MoreVertical, Download, Upload, HelpCircle, FileArchive } from 'lucide-react'; // Replaced FileZip with FileArchive
import { useChatAnalysis } from '@/context/ChatAnalysisContext'; // Import the context hook
import GradientBackground from '@/components/GradientBackground';
import StepIndicator from '@/components/StepIndicator';
import { toast } from 'sonner';

const InstructionsPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  // Get setters from the context
  const { setRawChatText, setIsLoading, setError } = useChatAnalysis(); 
  
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
            console.log(`Found and extracted text from: ${filename}`);
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
  
  const handleHelp = () => {
    toast('Dica: O WhatsApp permite exportar suas conversas facilmente. Se precisar de mais ajuda, visite nosso site.', {
      duration: 5000,
    });
  };
  
  const steps = [
    {
      icon: <MessageSquare className="h-10 w-10 text-cosmic-purple" />,
      title: "Abra a conversa no WhatsApp",
      description: "Selecione um chat individual ou grupo",
    },
    {
      icon: <MoreVertical className="h-10 w-10 text-cosmic-purple" />,
      title: "Vá em Opções > Mais > Exportar conversa",
      description: "Toque nos três pontos no canto superior direito",
    },
    {
      icon: <Download className="h-10 w-10 text-cosmic-purple" />,
      title: "Escolha 'Sem Mídia'",
      description: "Só precisamos do texto, não das imagens (o app ignora mídias)",
    },
    {
      icon: <FileArchive className="h-10 w-10 text-cosmic-purple" />, // Changed icon to FileArchive
      title: "Envie o arquivo .zip ou .txt para nosso app", // Updated title
      description: "O app extrairá o chat do .zip automaticamente!", // Updated description
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
        
        <StepIndicator currentStep={1} totalSteps={4} />
        
        <div className="mt-4 mb-6">
          <h2 className="text-xl font-bold text-center mb-4">
            Ok, hora da mágica! Vamos pegar seu chat.
          </h2>
        </div>
        
        <div className="space-y-6 mb-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start cosmic-card">
              <div className="bg-white rounded-full p-3 mr-4">
                {step.icon}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{step.title}</h3>
                <p className="text-sm opacity-80">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* File Upload Area */}
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
        
        <div className="flex items-center justify-center mb-6">
          <button 
            onClick={handleHelp}
            className="flex items-center text-sm text-cosmic-darkPurple"
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Problemas? Veja como fazer
          </button>
        </div>
        
        <div className="mt-auto mb-8">
          <Button 
            onClick={handleSubmit}
            disabled={!file}
            className={`cosmic-btn w-full ${!file ? 'opacity-60' : ''}`}
          >
            Analisar Mensagens
          </Button>
        </div>
      </div>
    </GradientBackground>
  );
};

export default InstructionsPage;
