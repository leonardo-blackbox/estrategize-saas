CREATE TABLE IF NOT EXISTS application_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'geral',
  thumbnail_color TEXT DEFAULT '#7c5cfc',
  fields JSONB NOT NULL DEFAULT '[]',
  theme_config JSONB NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed 5 templates
INSERT INTO application_templates (name, description, category, thumbnail_color, fields) VALUES
(
  'Captação de Leads',
  'Colete nome, e-mail e telefone de potenciais clientes',
  'vendas',
  '#7c5cfc',
  '[
    {"type":"welcome","title":"Olá! Vamos começar?","description":"Preencha seus dados para que possamos entrar em contato.","position":0,"required":false,"options":{"buttonText":"Começar →"},"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"name","title":"Qual é o seu nome?","position":1,"required":true,"options":{},"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"email","title":"Qual é o seu e-mail?","position":2,"required":true,"options":{},"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"phone","title":"Qual é o seu WhatsApp?","position":3,"required":false,"options":{},"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"long_text","title":"Como podemos te ajudar?","position":4,"required":false,"options":{"placeholder":"Conte um pouco sobre o que você precisa..."},"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"thank_you","title":"Obrigado pelo contato!","position":5,"required":false,"options":{},"conditional_logic":{"enabled":false,"conditions":[]}}
  ]'
),
(
  'Pesquisa NPS',
  'Meça a satisfação dos seus clientes com NPS',
  'pesquisa',
  '#0ea5e9',
  '[
    {"type":"welcome","title":"Sua opinião importa!","description":"Esta pesquisa leva menos de 1 minuto.","position":0,"required":false,"options":{"buttonText":"Responder →"},"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"multiple_choice","title":"Em uma escala de 0 a 10, qual a probabilidade de você nos recomendar?","position":1,"required":true,"options":[{"id":"0","label":"0 — Nunca recomendaria"},{"id":"1","label":"1"},{"id":"2","label":"2"},{"id":"3","label":"3"},{"id":"4","label":"4"},{"id":"5","label":"5 — Neutro"},{"id":"6","label":"6"},{"id":"7","label":"7"},{"id":"8","label":"8"},{"id":"9","label":"9"},{"id":"10","label":"10 — Recomendaria com certeza"}],"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"long_text","title":"O que motivou sua resposta?","position":2,"required":false,"options":{"placeholder":"Conte o que influenciou sua nota..."},"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"thank_you","title":"Obrigado pelo feedback!","position":3,"required":false,"options":{},"conditional_logic":{"enabled":false,"conditions":[]}}
  ]'
),
(
  'Formulário de Contato',
  'Receba mensagens de clientes e parceiros',
  'suporte',
  '#22c55e',
  '[
    {"type":"welcome","title":"Fale conosco","description":"Responderemos em até 24 horas.","position":0,"required":false,"options":{"buttonText":"Enviar mensagem →"},"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"name","title":"Seu nome","position":1,"required":true,"options":{},"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"email","title":"Seu e-mail","position":2,"required":true,"options":{},"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"short_text","title":"Assunto","position":3,"required":true,"options":{"placeholder":"Ex: Dúvida sobre produto..."},"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"long_text","title":"Mensagem","position":4,"required":true,"options":{"placeholder":"Descreva sua dúvida ou mensagem..."},"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"thank_you","title":"Mensagem enviada!","position":5,"required":false,"options":{},"conditional_logic":{"enabled":false,"conditions":[]}}
  ]'
),
(
  'Inscrição de Evento',
  'Colete inscrições para seu webinar ou evento ao vivo',
  'eventos',
  '#f59e0b',
  '[
    {"type":"welcome","title":"Inscreva-se no evento!","description":"Garanta sua vaga agora.","position":0,"required":false,"options":{"buttonText":"Quero me inscrever →"},"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"name","title":"Seu nome completo","position":1,"required":true,"options":{},"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"email","title":"Seu melhor e-mail","position":2,"required":true,"options":{},"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"phone","title":"WhatsApp para o lembrete","position":3,"required":false,"options":{},"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"multiple_choice","title":"Como ficou sabendo do evento?","position":4,"required":false,"options":[{"id":"instagram","label":"Instagram"},{"id":"whatsapp","label":"WhatsApp"},{"id":"indicacao","label":"Indicação de amigo"},{"id":"google","label":"Google"},{"id":"outro","label":"Outro"}],"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"thank_you","title":"Inscrição confirmada!","position":5,"required":false,"options":{},"conditional_logic":{"enabled":false,"conditions":[]}}
  ]'
),
(
  'Quiz de Diagnóstico',
  'Qualifique leads com perguntas estratégicas',
  'qualificacao',
  '#ec4899',
  '[
    {"type":"welcome","title":"Descubra seu diagnóstico","description":"Responda 5 perguntas e receba insights personalizados.","position":0,"required":false,"options":{"buttonText":"Fazer diagnóstico →"},"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"name","title":"Como você se chama?","position":1,"required":true,"options":{},"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"multiple_choice","title":"Qual é o seu maior desafio hoje?","position":2,"required":true,"options":[{"id":"a","label":"Gerar mais clientes"},{"id":"b","label":"Aumentar minha receita"},{"id":"c","label":"Organizar minha equipe"},{"id":"d","label":"Escalar meu negócio"}],"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"multiple_choice","title":"Qual é o tamanho do seu negócio?","position":3,"required":true,"options":[{"id":"a","label":"Solopreneur / Freelancer"},{"id":"b","label":"Micro (1-5 pessoas)"},{"id":"c","label":"Pequeno (6-20 pessoas)"},{"id":"d","label":"Médio (20+ pessoas)"}],"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"email","title":"Onde enviamos seu diagnóstico?","position":4,"required":true,"options":{"placeholder":"seu@email.com"},"conditional_logic":{"enabled":false,"conditions":[]}},
    {"type":"thank_you","title":"Diagnóstico enviado!","position":5,"required":false,"options":{},"conditional_logic":{"enabled":false,"conditions":[]}}
  ]'
);
