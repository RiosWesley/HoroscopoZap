
import React from "react";
import { Link } from "react-router-dom";
import { FileText, Shield, ArrowRight, CreditCard, Check, Info, AlertTriangle, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import GradientBackground from "@/components/GradientBackground";

const TermsOfUse = () => {
  return (
    <GradientBackground variant="cool">
      <div className="max-w-4xl mx-auto p-6 md:p-8 bg-white/95 rounded-lg shadow-lg my-10">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-gradient-to-r from-cosmic-purple to-cosmic-pink p-3 rounded-full mr-4">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cosmic-purple to-cosmic-pink">
            Termos de Uso
          </h1>
        </div>

        <div className="text-sm text-gray-500 mb-8 text-center">
          Última atualização: 12 de abril de 2025
        </div>

        <div className="mb-8">
          <p className="text-gray-700 text-lg">
            Bem-vindo ao <strong className="text-cosmic-purple">HoroscopoZap</strong>, uma aplicação web que analisa chats do WhatsApp para fornecer insights sobre padrões de comunicação, sentimentos e mais, usando inteligência artificial. Estes Termos de Uso regem o uso do nosso serviço. Leia-os com atenção.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="item-1" className="border border-gray-200 rounded-lg overflow-hidden">
            <AccordionTrigger className="bg-cosmic-purple/5 px-4 py-3 hover:bg-cosmic-purple/10 hover:no-underline">
              <div className="flex items-center">
                <Check className="h-5 w-5 text-cosmic-purple mr-2 flex-shrink-0" />
                <h2 className="text-lg font-medium text-gray-800">1. Aceitação dos Termos</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 text-gray-700">
              <p>
                Ao acessar ou usar o HoroscopoZap, você concorda em cumprir estes Termos de Uso e todas as leis aplicáveis. 
                Se não concordar com qualquer parte destes termos, você não deve utilizar a aplicação.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border border-gray-200 rounded-lg overflow-hidden">
            <AccordionTrigger className="bg-cosmic-purple/5 px-4 py-3 hover:bg-cosmic-purple/10 hover:no-underline">
              <div className="flex items-center">
                <Info className="h-5 w-5 text-cosmic-purple mr-2 flex-shrink-0" />
                <h2 className="text-lg font-medium text-gray-800">2. Descrição do Serviço</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 text-gray-700">
              <p>
                O HoroscopoZap permite que você envie chats exportados do WhatsApp (em formato <code>.txt</code> ou <code>.zip</code>) 
                para análise, gerando relatórios detalhados com visualizações como nuvens de emojis, gráficos de 
                sentimentos e mapas de atividade. A análise é feita com técnicas de Processamento de Linguagem 
                Natural (NLP) e IA. Recursos premium, como previsões e análises avançadas, estão disponíveis 
                mediante pagamento. O serviço inclui anúncios via Google AdSense.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border border-gray-200 rounded-lg overflow-hidden">
            <AccordionTrigger className="bg-cosmic-purple/5 px-4 py-3 hover:bg-cosmic-purple/10 hover:no-underline">
              <div className="flex items-center">
                <Info className="h-5 w-5 text-cosmic-purple mr-2 flex-shrink-0" />
                <h2 className="text-lg font-medium text-gray-800">3. Elegibilidade</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 text-gray-700">
              <p>
                Você deve ter pelo menos 13 anos para usar o HoroscopoZap. Ao usar o serviço, você 
                declara que tem idade suficiente ou possui consentimento de um responsável legal.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="border border-gray-200 rounded-lg overflow-hidden">
            <AccordionTrigger className="bg-cosmic-purple/5 px-4 py-3 hover:bg-cosmic-purple/10 hover:no-underline">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-cosmic-purple mr-2 flex-shrink-0" />
                <h2 className="text-lg font-medium text-gray-800">4. Uso Permitido</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 text-gray-700">
              <p className="mb-2">
                Você pode usar o HoroscopoZap apenas para fins pessoais e não comerciais. É proibido:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Enviar conteúdo ilegal, ofensivo, difamatório ou que viole os direitos de terceiros.</li>
                <li>Tentar acessar, modificar ou interferir no funcionamento do sistema, incluindo seus servidores ou bancos de dados.</li>
                <li>Usar o serviço para violar leis locais, nacionais ou internacionais.</li>
                <li>Fazer engenharia reversa ou tentar extrair o código-fonte da aplicação.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5" className="border border-gray-200 rounded-lg overflow-hidden">
            <AccordionTrigger className="bg-cosmic-purple/5 px-4 py-3 hover:bg-cosmic-purple/10 hover:no-underline">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-cosmic-purple mr-2 flex-shrink-0" />
                <h2 className="text-lg font-medium text-gray-800">5. Privacidade e Dados</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 text-gray-700">
              <p className="mb-2">Nós respeitamos sua privacidade:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong className="text-cosmic-purple">Chats enviados:</strong> Os arquivos de chat são processados temporariamente para análise e não são armazenados após o processamento, exceto para análises premium, com sua autorização explícita.
                </li>
                <li>
                  <strong className="text-cosmic-purple">Dados premium:</strong> Informações de pagamento e resultados de análises premium são armazenados com segurança, acessíveis apenas por você.
                </li>
                <li>
                  <strong className="text-cosmic-purple">Anúncios:</strong> O Google AdSense pode coletar dados anônimos de navegação para exibir anúncios personalizados, conforme descrito na nossa Política de Privacidade.
                </li>
              </ul>
              <p className="mt-2 text-gray-600 italic">
                Consulte nossa <Link to="/privacy" className="text-cosmic-purple hover:underline">Política de Privacidade</Link> para mais detalhes.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6" className="border border-gray-200 rounded-lg overflow-hidden">
            <AccordionTrigger className="bg-cosmic-purple/5 px-4 py-3 hover:bg-cosmic-purple/10 hover:no-underline">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-cosmic-purple mr-2 flex-shrink-0" />
                <h2 className="text-lg font-medium text-gray-800">6. Pagamentos Premium</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 text-gray-700">
              <ul className="space-y-2">
                <li className="flex">
                  <span className="mr-2">•</span>
                  <span><strong className="text-cosmic-purple">Acesso premium:</strong> Recursos avançados, como análises preditivas e conteúdos personalizados, estão disponíveis mediante pagamento único ou recorrente via Mercado Pago (cartão ou Pix).</span>
                </li>
                <li className="flex">
                  <span className="mr-2">•</span>
                  <span><strong className="text-cosmic-purple">Processamento:</strong> Pagamentos são processados com segurança pelo Mercado Pago. Não armazenamos dados de cartão no nosso sistema.</span>
                </li>
                <li className="flex">
                  <span className="mr-2">•</span>
                  <span><strong className="text-cosmic-purple">Sem reembolsos:</strong> Devido à natureza digital do serviço, pagamentos premium não são reembolsáveis, salvo em casos exigidos por lei.</span>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7" className="border border-gray-200 rounded-lg overflow-hidden">
            <AccordionTrigger className="bg-cosmic-purple/5 px-4 py-3 hover:bg-cosmic-purple/10 hover:no-underline">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-cosmic-purple mr-2 flex-shrink-0" />
                <h2 className="text-lg font-medium text-gray-800">7. Propriedade Intelectual</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 text-gray-700">
              <p>
                Todo o conteúdo do HoroscopoZap, incluindo interface, gráficos, visualizações e análises geradas, é protegido por direitos autorais e pertence aos desenvolvedores ou seus licenciadores. Você pode compartilhar resultados gerados para fins pessoais, mas não pode modificá-los, distribuí-los ou usá-los comercialmente sem permissão.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8" className="border border-gray-200 rounded-lg overflow-hidden">
            <AccordionTrigger className="bg-cosmic-purple/5 px-4 py-3 hover:bg-cosmic-purple/10 hover:no-underline">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-cosmic-purple mr-2 flex-shrink-0" />
                <h2 className="text-lg font-medium text-gray-800">8. Limitação de Responsabilidade</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 text-gray-700">
              <p className="mb-2">O HoroscopoZap é fornecido "como está". Não garantimos que:</p>
              <ul className="list-disc pl-6 mb-2">
                <li>O serviço estará livre de erros ou interrupções.</li>
                <li>As análises geradas pela IA serão 100% precisas ou adequadas para decisões importantes.</li>
              </ul>
              <p>
                Não nos responsabilizamos por danos diretos, indiretos ou incidentais decorrentes do uso ou 
                incapacidade de usar o serviço, salvo conforme exigido por lei.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-9" className="border border-gray-200 rounded-lg overflow-hidden">
            <AccordionTrigger className="bg-cosmic-purple/5 px-4 py-3 hover:bg-cosmic-purple/10 hover:no-underline">
              <div className="flex items-center">
                <Info className="h-5 w-5 text-cosmic-purple mr-2 flex-shrink-0" />
                <h2 className="text-lg font-medium text-gray-800">9. Modificações no Serviço</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 text-gray-700">
              <p>
                Podemos atualizar, modificar ou suspender o HoroscopoZap a qualquer momento, com ou sem aviso prévio. 
                Alterações nos Termos de Uso serão publicadas nesta página, e o uso contínuo do serviço implica aceitação das mudanças.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-10" className="border border-gray-200 rounded-lg overflow-hidden">
            <AccordionTrigger className="bg-cosmic-purple/5 px-4 py-3 hover:bg-cosmic-purple/10 hover:no-underline">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-cosmic-purple mr-2 flex-shrink-0" />
                <h2 className="text-lg font-medium text-gray-800">10. Rescisão</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 text-gray-700">
              <p>
                Podemos suspender ou encerrar seu acesso ao HoroscopoZap se você violar estes termos, 
                sem aviso prévio. Você pode parar de usar o serviço a qualquer momento.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-11" className="border border-gray-200 rounded-lg overflow-hidden">
            <AccordionTrigger className="bg-cosmic-purple/5 px-4 py-3 hover:bg-cosmic-purple/10 hover:no-underline">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-cosmic-purple mr-2 flex-shrink-0" />
                <h2 className="text-lg font-medium text-gray-800">11. Contato</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 text-gray-700">
              <p className="flex items-center">
                Para dúvidas, sugestões ou reclamações, entre em contato pelo e-mail:&nbsp;
                <a href="mailto:horoscopozap@gmail.com" className="text-cosmic-purple hover:underline font-medium">
                  horoscopozap@gmail.com
                </a>
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-12" className="border border-gray-200 rounded-lg overflow-hidden">
            <AccordionTrigger className="bg-cosmic-purple/5 px-4 py-3 hover:bg-cosmic-purple/10 hover:no-underline">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-cosmic-purple mr-2 flex-shrink-0" />
                <h2 className="text-lg font-medium text-gray-800">12. Lei Aplicável</h2>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 text-gray-700">
              <p>
                Estes Termos de Uso são regidos pelas leis do Brasil. Qualquer disputa será 
                resolvida nos tribunais competentes de São Paulo, SP, salvo disposição legal em contrário.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-10 pt-6 border-t border-gray-200 flex justify-center">
          <Button asChild className="cosmic-btn flex items-center gap-2">
            <Link to="/">
              Voltar para o Início
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-6 text-center">
          <Link to="/privacy-policy" className="text-cosmic-purple hover:underline text-sm">
            Ver Política de Privacidade
          </Link>
        </div>
      </div>
    </GradientBackground>
  );
};

export default TermsOfUse;