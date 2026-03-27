import { useState, useRef, useEffect, useCallback } from 'react';
import { chatWithAI, type AIMessage } from '../services/consultorias.api.ts';

export interface ChatMessage extends AIMessage {
  id: string;
  credits_used?: number;
  isError?: boolean;
}

export function useChatMessages(consultancyId: string, clientName: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const name = clientName || 'esta consultoria';
    setMessages([{
      id: 'greeting', role: 'assistant',
      content: `Olá! Sou a IA dedicada desta consultoria. Conheço todos os detalhes de ${name}. Como posso ajudar?`,
      created_at: new Date().toISOString(),
    }]);
  }, [clientName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isThinking) return;
    const userMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);
    const history: AIMessage[] = messages.filter((m) => m.id !== 'greeting').slice(-20)
      .map(({ role, content: c, created_at }) => ({ role, content: c, created_at }));
    try {
      const res = await chatWithAI(consultancyId, content, history);
      setMessages((prev) => [...prev, {
        id: `ai-${Date.now()}`, role: 'assistant', content: res.reply,
        created_at: new Date().toISOString(), credits_used: res.credits_used,
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`, role: 'assistant',
        content: 'Erro ao processar sua mensagem. Tente novamente.',
        created_at: new Date().toISOString(), isError: true,
      }]);
    } finally { setIsThinking(false); }
  }, [input, isThinking, messages, consultancyId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return { messages, input, setInput, isThinking, messagesEndRef, textareaRef, sendMessage, handleKeyDown };
}
