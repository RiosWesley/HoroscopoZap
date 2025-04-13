
import React from "react";
import { Link } from "react-router-dom";
import { Shield, Lock, Eye, Server, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8 bg-white/95 rounded-lg shadow-lg my-10">
      <div className="flex items-center justify-center mb-8">
        <div className="bg-gradient-to-r from-cosmic-purple to-cosmic-pink p-3 rounded-full mr-4">
          <Lock className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cosmic-purple to-cosmic-pink">Política de Privacidade</h1>
      </div>

      <div className="space-y-8">
        <section>
          <div className="flex items-center mb-3">
            <Shield className="h-5 w-5 text-cosmic-purple mr-2" />
            <h2 className="text-xl font-semibold">Nosso Compromisso</h2>
          </div>
          <p className="text-gray-700 mb-3">
            O <strong>Horóscopo das Mensagens</strong> tem como prioridade absoluta proteger sua privacidade. 
            Nosso serviço foi projetado com o princípio de "privacidade desde a concepção", garantindo que seus dados permaneçam seguros e sob seu controle.
          </p>
          <p className="text-gray-700">
            Utilizamos tecnologia de processamento local, o que significa que as mensagens do WhatsApp que você analisa nunca saem do seu dispositivo. 
            Nossa aplicação funciona diretamente no navegador do seu dispositivo, sem enviar o conteúdo das suas conversas para nossos servidores.
          </p>
        </section>

        <section>
          <div className="flex items-center mb-3">
            <Eye className="h-5 w-5 text-cosmic-purple mr-2" />
            <h2 className="text-xl font-semibold">Dados Coletados</h2>
          </div>
          <p className="text-gray-700 mb-3">
            <strong>Somente coletamos:</strong>
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>Métricas anônimas de uso</strong> - Estatísticas agregadas que nos ajudam a melhorar o serviço, sem identificação pessoal.</li>
            <li><strong>Informações de pagamento</strong> - Apenas para processamento de compras Premium, gerenciadas com segurança pelo Mercado Pago.</li>
            <li><strong>Resultados de análise</strong> - Se optar por salvar ou compartilhar seus resultados, apenas os dados processados (não as mensagens originais) são armazenados.</li>
          </ul>
        </section>

        <section>
          <div className="flex items-center mb-3">
            <Server className="h-5 w-5 text-cosmic-purple mr-2" />
            <h2 className="text-xl font-semibold">Seu Conteúdo Permanece Local</h2>
          </div>
          <div className="bg-cosmic-purple/10 p-4 rounded-lg border border-cosmic-purple/30 mb-4">
            <p className="text-gray-800 font-medium">
              O conteúdo das suas mensagens do WhatsApp é analisado <strong>exclusivamente</strong> no seu dispositivo. 
              Não armazenamos, transmitimos ou temos acesso às suas conversas originais em nenhum momento.
            </p>
          </div>
          <p className="text-gray-700">
            Para os recursos Premium que utilizam IA (como geração de previsões ou análise de estilo), apenas estatísticas agregadas
            e anônimas são transmitidas para nossos servidores - nunca o conteúdo das mensagens.
          </p>
        </section>

        <section>
          <div className="flex items-center mb-3">
            <Mail className="h-5 w-5 text-cosmic-purple mr-2" />
            <h2 className="text-xl font-semibold">Contato</h2>
          </div>
          <p className="text-gray-700 mb-4">
            Se você tiver dúvidas ou preocupações sobre nossa política de privacidade, entre em contato pelo e-mail:
          </p>
          <a href="mailto:horoscopozap@gmail.com" className="inline-block text-cosmic-purple hover:text-cosmic-deepPurple font-medium underline">
            horoscopozap@gmail.com
          </a>
        </section>
      </div>

      <div className="mt-10 flex justify-center">
        <Button variant="outline" asChild className="hover:bg-cosmic-purple/10">
          <Link to="/">Voltar para o Início</Link>
        </Button>
      </div>

      <p className="text-sm text-center text-gray-500 mt-8">
        Última atualização: 12 de abril de 2025
      </p>
    </div>
  );
};

export default PrivacyPolicy;
