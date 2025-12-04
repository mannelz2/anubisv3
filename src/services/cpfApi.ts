export interface CpfData {
  nome: string;
  cpf: string;
  situacao?: string;
}

export async function consultarCPF(cpf: string): Promise<CpfData | null> {
  try {
    const cpfLimpo = cpf.replace(/\D/g, '');

    const response = await fetch(`https://api.cpfcnpj.com.br/${cpfLimpo}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Erro ao consultar CPF:', response.status);
      return null;
    }

    const data = await response.json();

    return {
      nome: data.nome || data.name || 'Nome não disponível',
      cpf: cpfLimpo,
      situacao: data.situacao || data.status,
    };
  } catch (error) {
    console.error('Erro ao buscar dados do CPF:', error);
    return null;
  }
}
