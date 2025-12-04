import { useLocation } from 'react-router-dom';

interface FunnelPersistenceProps {
  currentStep: string;
  children: React.ReactNode;
  requiresUserData?: boolean;
}

export const FunnelPersistence: React.FC<FunnelPersistenceProps> = ({
  children,
}) => {
  return <>{children}</>;
};

export const useFunnelData = () => {
  const location = useLocation();

  return {
    userData: location.state?.userData,
    loanAmount: location.state?.loanAmount,
    installments: location.state?.installments,
    dueDate: location.state?.dueDate,
    hasNubankAccount: location.state?.hasNubankAccount,
    profileAnswers: location.state?.profileAnswers,
    indemnityAmount: location.state?.indemnityAmount || 7854.63,
  };
};
