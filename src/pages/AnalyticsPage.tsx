import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, TrendingUp, DollarSign, Users, Target, Calendar, Filter } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/app';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Transaction {
  id: string;
  created_at: string;
  cpf: string;
  amount: number;
  status: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  src?: string;
  fb_campaign_id?: string;
  fb_campaign_name?: string;
  fb_adset_name?: string;
  fb_ad_name?: string;
  fb_placement?: string;
  domain?: string;
  site_source?: string;
  tracking_id?: string;
}

interface Metrics {
  totalTransactions: number;
  approvedTransactions: number;
  pendingTransactions: number;
  totalRevenue: number;
  approvedRevenue: number;
  averageTicket: number;
  conversionRate: number;
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalTransactions: 0,
    approvedTransactions: 0,
    pendingTransactions: 0,
    totalRevenue: 0,
    approvedRevenue: 0,
    averageTicket: 0,
    conversionRate: 0,
  });

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    campaign: '',
    adset: '',
    status: '',
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
    } catch (err) {
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (filters.startDate) {
      filtered = filtered.filter(t => new Date(t.created_at) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => new Date(t.created_at) <= endDate);
    }

    if (filters.campaign) {
      filtered = filtered.filter(t =>
        t.fb_campaign_name?.toLowerCase().includes(filters.campaign.toLowerCase()) ||
        t.utm_campaign?.toLowerCase().includes(filters.campaign.toLowerCase())
      );
    }

    if (filters.adset) {
      filtered = filtered.filter(t =>
        t.fb_adset_name?.toLowerCase().includes(filters.adset.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    setFilteredTransactions(filtered);
    calculateMetrics(filtered);
  };

  const calculateMetrics = (data: Transaction[]) => {
    const totalTransactions = data.length;
    const approvedTransactions = data.filter(t =>
      t.status === 'approved' || t.status === 'completed' || t.status === 'authorized'
    ).length;
    const pendingTransactions = data.filter(t => t.status === 'pending').length;
    const totalRevenue = data.reduce((sum, t) => sum + t.amount, 0);
    const approvedRevenue = data
      .filter(t => t.status === 'approved' || t.status === 'completed' || t.status === 'authorized')
      .reduce((sum, t) => sum + t.amount, 0);
    const averageTicket = approvedTransactions > 0 ? approvedRevenue / approvedTransactions : 0;
    const conversionRate = totalTransactions > 0 ? (approvedTransactions / totalTransactions) * 100 : 0;

    setMetrics({
      totalTransactions,
      approvedTransactions,
      pendingTransactions,
      totalRevenue,
      approvedRevenue,
      averageTicket,
      conversionRate,
    });
  };

  const exportToCSV = () => {
    const headers = [
      'Data',
      'CPF',
      'Nome',
      'Email',
      'Telefone',
      'Valor',
      'Status',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign',
      'UTM Term',
      'UTM Content',
      'Campanha FB',
      'Adset FB',
      'Anúncio FB',
      'Placement FB',
      'Domain',
      'Tracking ID'
    ];

    const rows = filteredTransactions.map(t => [
      new Date(t.created_at).toLocaleString('pt-BR'),
      t.cpf,
      t.customer_name || '',
      t.customer_email || '',
      t.customer_phone || '',
      t.amount.toFixed(2),
      t.status,
      t.utm_source || '',
      t.utm_medium || '',
      t.utm_campaign || '',
      t.utm_term || '',
      t.utm_content || '',
      t.fb_campaign_name || '',
      t.fb_adset_name || '',
      t.fb_ad_name || '',
      t.fb_placement || '',
      t.domain || '',
      t.tracking_id || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
      case 'authorized':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-purple-600 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/configuracoes')}
              className="flex items-center gap-2 text-white hover:text-purple-100"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50"
            >
              <Download className="w-5 h-5" />
              <span>Exportar CSV</span>
            </button>
          </div>
          <h1 className="text-2xl font-bold">Analytics de Campanhas</h1>
          <p className="text-purple-100 mt-2">Acompanhe o desempenho das suas campanhas</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Transações</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalTransactions}</p>
              </div>
              <Users className="w-10 h-10 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Aprovadas</p>
                <p className="text-2xl font-bold text-green-600">{metrics.approvedTransactions}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Receita Aprovada</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.approvedRevenue)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.conversionRate.toFixed(1)}%</p>
              </div>
              <Target className="w-10 h-10 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Filtros</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campanha</label>
              <input
                type="text"
                value={filters.campaign}
                onChange={(e) => setFilters({ ...filters, campaign: e.target.value })}
                placeholder="Filtrar por campanha"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adset</label>
              <input
                type="text"
                value={filters.adset}
                onChange={(e) => setFilters({ ...filters, adset: e.target.value })}
                placeholder="Filtrar por adset"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Todos</option>
                <option value="approved">Aprovado</option>
                <option value="pending">Pendente</option>
                <option value="rejected">Rejeitado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Transações Detalhadas</h2>
            <p className="text-sm text-gray-600 mt-1">
              Mostrando {filteredTransactions.length} de {transactions.length} transações
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campanha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adset</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Anúncio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Carregando transações...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Nenhuma transação encontrada
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-gray-900 font-medium">{transaction.customer_name || 'N/A'}</div>
                        <div className="text-gray-500">{transaction.customer_email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.fb_campaign_name || transaction.utm_campaign || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.fb_adset_name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.fb_ad_name || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
