#!/bin/bash

# Lista de páginas para atualizar
pages=(
  "AccountVerifiedPage"
  "CreditAuthorizationPage"
  "CreditStatusPage"
  "DataForReceivingPage"
  "DataVerificationPage"
  "DueDateSelectionPage"
  "InstallmentSelectionPage"
  "LoanApprovedPage"
  "LoanPriorityPage"
  "LoanSummaryPage"
  "LoanTermsPage"
  "NubankCustomerPage"
  "PaymentVerificationPage"
  "PixConfirmationPage"
  "ProfileQuestionsPage"
  "ReceiptUploadPage"
  "TransferConfirmationPage"
  "TaxBreakdownPage"
  "Upsell2Page"
  "Upsell3Page"
  "Upsell4Page"
  "Upsell5Page"
)

for page in "${pages[@]}"; do
  file="src/pages/${page}.tsx"

  if [ -f "$file" ]; then
    echo "Processando $file..."

    # Verifica se já tem a importação
    if ! grep -q "import.*funnelStorage" "$file"; then
      # Adiciona a importação se não existir
      sed -i "/import.*from.*'react-router-dom'/a import { saveFunnelData, getFunnelData } from '../utils/funnelStorage';" "$file"
      echo "  - Adicionada importação de funnelStorage"
    fi
  fi
done

echo "Concluído!"
