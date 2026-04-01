export interface HelenaReport {
  tipo: 'abertura' | 'meio' | 'fechamento' | 'objecao';
  sugestao_principal: string;
  frase_sugerida: string | null;
  ponto_atencao: string | null;
  urgencia: 'baixa' | 'media' | 'alta';
  timestamp: string;
}
