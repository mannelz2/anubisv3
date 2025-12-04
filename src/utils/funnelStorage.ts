interface FunnelData {
  cpf?: string;
  userData?: any;
  loanAmount?: number;
  installments?: number;
  dueDate?: number;
  hasNubankAccount?: boolean;
  profileAnswers?: Record<string, string>;
  urlParams?: any;
}

export const saveFunnelData = (data: Partial<FunnelData>) => {
  try {
    if (data.userData) {
      sessionStorage.setItem('userData', JSON.stringify(data.userData));
    }
  } catch (error) {
    console.error('Error saving funnel data:', error);
  }
};

export const getFunnelData = (): FunnelData => {
  return {};
};

export const clearFunnelData = () => {
  try {
    sessionStorage.removeItem('userData');
  } catch (error) {
    console.error('Error clearing funnel data:', error);
  }
};

export const getUserName = (): string => {
  const funnelData = getFunnelData();
  if (funnelData.userData?.nome) {
    return funnelData.userData.nome.split(' ')[0];
  }

  const userDataStr = sessionStorage.getItem('userData');
  if (userDataStr) {
    try {
      const userData = JSON.parse(userDataStr);
      return userData.nome?.split(' ')[0] || 'Usuário';
    } catch {
      return 'Usuário';
    }
  }
  return 'Usuário';
};

export const getUserData = () => {
  const funnelData = getFunnelData();
  if (funnelData.userData) {
    return funnelData.userData;
  }

  const userDataStr = sessionStorage.getItem('userData');
  if (userDataStr) {
    try {
      return JSON.parse(userDataStr);
    } catch {
      return null;
    }
  }
  return null;
};
