
import React from "react";
import { Link } from "react-router-dom";
import { Info, MessageCircle, Shield, Star, User, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const About = () => (
  <div className="max-w-3xl mx-auto p-6 md:p-8 bg-white/95 rounded-lg shadow-lg my-10">
    <div className="relative mb-10">
      <div className="absolute -top-16 -left-16 w-32 h-32 bg-gradient-to-br from-cosmic-purple/30 to-cosmic-pink/30 rounded-full blur-xl z-0"></div>
      <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-tr from-cosmic-neonBlue/20 to-cosmic-turquoise/20 rounded-full blur-lg z-0"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="bg-gradient-to-r from-cosmic-purple to-cosmic-pink p-4 rounded-full mb-4">
          <MessageCircle className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-cosmic-darkPurple to-cosmic-pink">
          Sobre o Projeto
        </h1>
        <div className="w-20 h-1 bg-gradient-to-r from-cosmic-purple to-cosmic-pink rounded-full mt-3"></div>
      </div>
    </div>

    <div className="space-y-8">
      <p className="text-lg text-gray-800 leading-relaxed">
        O <span className="font-bold text-cosmic-darkPurple">Horóscopo das Mensagens</span> nasceu da curiosidade de entender como nossas conversas digitais refletem nossa personalidade, humor e até mesmo nossos "astros" do dia a dia. Unindo tecnologia, análise de dados e um toque de diversão, criamos uma plataforma que transforma chats do WhatsApp em insights surpreendentes e horóscopos personalizados.
      </p>

      <Card className="border-cosmic-purple/20 bg-gradient-to-br from-white to-cosmic-purple/5">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <Star className="h-6 w-6 text-cosmic-purple mr-3 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Missão</h2>
              <p className="text-gray-700">
                Democratizar o autoconhecimento digital, tornando a análise de conversas acessível, segura e divertida para todos. Queremos que cada usuário descubra algo novo sobre si mesmo e seus amigos, sempre com respeito à privacidade.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center mb-4">
          <Shield className="h-6 w-6 text-cosmic-purple mr-2" />
          <h2 className="text-xl font-semibold">Diferenciais</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-cosmic-purple/30 transition-colors">
            <Badge variant="outline" className="bg-cosmic-purple/10 text-cosmic-darkPurple mb-2">Privacidade</Badge>
            <p className="text-gray-700">Análise 100% local: seus dados nunca saem do seu dispositivo.</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-cosmic-purple/30 transition-colors">
            <Badge variant="outline" className="bg-cosmic-purple/10 text-cosmic-darkPurple mb-2">Compatibilidade</Badge>
            <p className="text-gray-700">Compatível com arquivos .txt e .zip exportados do WhatsApp.</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-cosmic-purple/30 transition-colors">
            <Badge variant="outline" className="bg-cosmic-purple/10 text-cosmic-darkPurple mb-2">Instalável</Badge>
            <p className="text-gray-700">Funciona como PWA: instale na tela inicial e use offline.</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-cosmic-purple/30 transition-colors">
            <Badge variant="outline" className="bg-cosmic-purple/10 text-cosmic-darkPurple mb-2">Premium</Badge>
            <p className="text-gray-700">Recursos premium opcionais para quem quer ir além.</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-cosmic-purple/10 to-cosmic-pink/10 p-6 rounded-lg">
        <div className="flex items-center mb-4">
          <User className="h-6 w-6 text-cosmic-purple mr-2" />
          <h2 className="text-xl font-semibold">Quem desenvolve?</h2>
        </div>
        <p className="text-gray-700 mb-4">
          O projeto foi idealizado e desenvolvido por <strong>Wesley Rios</strong>, entusiasta de tecnologia, análise de dados e astrologia pop. Se quiser sugerir melhorias, relatar bugs ou apenas bater um papo, entre em contato!
        </p>
        <div className="flex items-center">
          <Mail className="h-5 w-5 text-cosmic-purple mr-2" />
          <a href="mailto:horoscopozap@gmail.com" className="text-cosmic-purple hover:text-cosmic-darkPurple underline">
            horoscopozap@gmail.com
          </a>
        </div>
      </div>
    </div>

    <div className="mt-10 flex justify-center">
      <Button className="cosmic-btn flex items-center gap-2" asChild>
        <Link to="/">
          Voltar para o Início
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>

    <p className="text-sm text-center text-gray-500 mt-8">
      Última atualização: 12 de abril de 2025
    </p>
  </div>
);

export default About;
