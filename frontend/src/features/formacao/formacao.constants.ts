import type { JourneyStep, Material } from './formacao.types';

export const MOCK_JOURNEY: JourneyStep[] = [
  { id: 'j1', step: 'Etapa 1/6', title: 'Fundamentos do Consultor', description: 'O baseamento para iniciar sua jornada digital com o p\u00e9 direito.', recommended: true, cta: 'Continuar' },
  { id: 'j2', step: 'Etapa 2/6', title: 'Produto e Posicionamento', description: 'Descubra seu diferencial e como empacotar sua oferta de alto valor.', recommended: false, cta: 'Come\u00e7ar' },
  { id: 'j3', step: 'Etapa 3/6', title: 'Aquisi\u00e7\u00e3o de Clientes', description: 'M\u00e1quina de vendas e estrat\u00e9gias de marketing para B2B e B2C.', recommended: false, cta: 'Trancado' },
  { id: 'j4', step: 'Etapa 4/6', title: 'Entrega e Encantamento', description: 'Estrat\u00e9gias de overdelivery e reten\u00e7\u00e3o perp\u00e9tua de clientes.', recommended: false, cta: 'Trancado' },
];

export const MOCK_MATERIALS: Material[] = [
  { id: 'm1', title: 'Checklist de Diagn\u00f3stico', type: 'PDF', description: 'O checklist completo para sua primeira reuni\u00e3o de diagn\u00f3stico com um lead qualificado. Essencial para impressionar nos primeiros 5 minutos.', uploadedAt: '12 Jan 2026', size: '2.4 MB', downloadUrl: '#' },
  { id: 'm2', title: 'Proposta Comercial Premium', type: 'Template', description: 'Template em Notion para enviar propostas formatadas de alto valor percebido.', uploadedAt: '15 Jan 2026', size: '1.1 MB', downloadUrl: '#' },
  { id: 'm3', title: 'Mapa Mental: Funil B2B', type: 'Imagem', description: 'Estrutura visual de um funil de convers\u00e3o outbound para empresas corporativas.', uploadedAt: '03 Fev 2026', size: '4.8 MB', downloadUrl: '#' },
  { id: 'm4', title: 'Script de Vendas Consultivas', type: 'PDF', description: 'O roteiro exato que usamos para fechar contratos high-ticket.', uploadedAt: '10 Fev 2026', size: '1.8 MB', downloadUrl: '#' },
  { id: 'm5', title: 'Calculadora de Precifica\u00e7\u00e3o', type: 'Template', description: 'Planilha inteligente para precificar sua hora e pacotes baseados na margem de lucro.', uploadedAt: '20 Fev 2026', size: '500 KB' },
];
