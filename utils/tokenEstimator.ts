/**
 * Utilitário para estimar uso de tokens do Gemini
 * Baseado em uma estimativa aproximada: ~1 token = 4 caracteres
 */

/**
 * Estima o número de tokens baseado no tamanho do texto
 * Aproximação: 1 token ≈ 4 caracteres (para português e inglês)
 */
export function estimateTokens(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  
  // Contar caracteres e dividir por 4
  // Para textos em português, pode ser ligeiramente diferente, mas é uma boa estimativa
  return Math.ceil(text.length / 4);
}

/**
 * Estima tokens de uma chamada completa (prompt + resposta)
 */
export function estimateFullTokens(prompt: string, response: string): number {
  return estimateTokens(prompt) + estimateTokens(response);
}

/**
 * Formata número de tokens para exibição
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) {
    return tokens.toString();
  } else if (tokens < 1000000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  } else {
    return `${(tokens / 1000000).toFixed(2)}M`;
  }
}

