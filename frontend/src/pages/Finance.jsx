import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowLeftRight, PieChart, TrendingUp, TrendingDown, Landmark, Scale } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOptions } from '../context/OptionsContext';
import { useFetch } from '../hooks/useFetch';
import { ResourcePage } from '../components/ui/ResourcePage';
import { StatusBadge } from '../components/ui/Badge';
import { AsyncBoundary } from '../components/ui/Feedback';
import { Card, DemoNotice, PageHeader, ProgressBar, StatCard } from '../components/ui/Misc';
import { BudgetBars, CategoryBars } from '../components/charts/Charts';
import { formatDate, formatINR, formatINRShort } from '../utils/format';
import { isAdmin } from '../utils/roles';

function useFinancialYears() {
  const o = useOptions();
  const { data } = useFetch('/budgets/financial-years');
  return data || (o.currentFinancialYear ? [o.currentFinancialYear] : []);
}

export function Budget() {
  const { user } = useAuth();
  const o = useOptions();
  const years = useFinancialYears();
  const admin = isAdmin(user);
  const fields = [
    { name: 'financialYear', label: 'Financial year', required: true, default: o.currentFinancialYear, pattern: /^\d{4}-\d{2}$/, patternMessage: 'Use format 2026-27' },
    { name: 'category', label: 'Budget head', type: 'select', options: (o.financeCategories || []).map((c) => ({ value: c, label: c })), required: true },
    { name: 'allocatedAmount', label: 'Allocated amount (₹)', type: 'number', min: 0, required: true },
    { name: 'source', label: 'Source' },
    { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
  ];
  const columns = [
    { key: 'category', label: 'Budget head', primary: true, render: (r) => <span className="font-medium text-slate-900">{r.category}</span> },
    { key: 'financialYear', label: 'FY' },
    { key: 'allocatedAmount', label: 'Allocated', className: 'text-right tabular-nums', render: (r) => formatINR(r.allocatedAmount) },
    { key: 'utilizedAmount', label: 'Utilised', className: 'text-right tabular-nums', render: (r) => formatINR(r.utilizedAmount) },
    { key: 'remainingAmount', label: 'Remaining', className: 'text-right tabular-nums', render: (r) => <span className={r.remainingAmount < 0 ? 'font-medium text-red-700' : ''}>{formatINR(r.remainingAmount)}</span> },
    { key: 'use', label: 'Utilisation', className: 'min-w-[150px]', render: (r) => <ProgressBar value={r.allocatedAmount ? Math.round((r.utilizedAmount / r.allocatedAmount) * 100) : 0} size="sm" /> },
  ];
  return (
    <ResourcePage title="Budget" subtitle="Budget allocation by head. Utilisation is calculated automatically from completed expense transactions." icon={Wallet}
      endpoint="/budgets" entityName="budget allocation" columns={columns} formFields={admin ? fields : undefined} pageSize={20}
      filters={[{ name: 'financialYear', label: 'Financial years', options: years.map((y) => ({ value: y, label: `FY ${y}` })) }, { name: 'category', label: 'Heads', options: (o.financeCategories || []).map((c) => ({ value: c, label: c })) }]}
      beforeList={() => <DemoNotice>Budget figures are demo allocations for the prototype, not actual government financial data.</DemoNotice>}
      canCreate={admin} canEdit={admin} canDelete={admin} searchPlaceholder="Search budget heads…"
      csv={[{ label: 'Budget head', value: (r) => r.category }, { label: 'FY', value: (r) => r.financialYear }, { label: 'Allocated', value: (r) => r.allocatedAmount }, { label: 'Utilised', value: (r) => r.utilizedAmount }, { label: 'Remaining', value: (r) => r.remainingAmount }]} />
  );
}

export function Transactions() {
  const { user } = useAuth();
  const o = useOptions();
  const years = useFinancialYears();
  const admin = isAdmin(user);
  const cats = [...new Set([...(o.incomeCategories || []), ...(o.financeCategories || [])])];
  const fields = [
    { name: 'type', label: 'Type', type: 'select', options: o.transactionTypes, required: true, default: 'EXPENSE' },
    { name: 'category', label: 'Category', type: 'select', required: true,
      options: [...(o.financeCategories || []).map((c) => ({ value: c, label: `${c} (expense head)` })), ...(o.incomeCategories || []).filter((c) => !(o.financeCategories || []).includes(c)).map((c) => ({ value: c, label: `${c} (income)` }))],
      help: 'Expenses should use a budget head so budget utilisation updates automatically.' },
    { name: 'amount', label: 'Amount (₹)', type: 'number', min: 0.01, step: '0.01', required: true },
    { name: 'date', label: 'Date', type: 'date', required: true, get: (r) => r.date || new Date() },
    { name: 'referenceNumber', label: 'Reference / voucher no.' },
    { name: 'status', label: 'Status', type: 'select', options: o.transactionStatuses, required: true, default: 'COMPLETED' },
    { name: 'description', label: 'Description', type: 'textarea', span: 2 },
  ];
  const columns = [
    { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
    { key: 'description', label: 'Description', primary: true, render: (r) => <div><p className="font-medium text-slate-900">{r.description || r.category}</p><p className="text-xs text-slate-500">{r.referenceNumber}</p></div> },
    { key: 'category', label: 'Category' },
    { key: 'type', label: 'Type', render: (r) => <StatusBadge value={r.type} /> },
    { key: 'amount', label: 'Amount', className: 'text-right tabular-nums', render: (r) => <span className={r.type === 'INCOME' ? 'text-green-700' : 'text-slate-800'}>{r.type === 'INCOME' ? '+' : '−'}{formatINR(r.amount)}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'financialYear', label: 'FY', hideOnMobile: true },
  ];
  return (
    <ResourcePage title="Transactions" subtitle="Income and expenditure register" icon={ArrowLeftRight}
      endpoint="/transactions" entityName="transaction" columns={columns} formFields={admin ? fields : undefined} pageSize={15}
      filters={[{ name: 'financialYear', label: 'Financial years', options: years.map((y) => ({ value: y, label: `FY ${y}` })) }, { name: 'type', label: 'Types', options: o.transactionTypes },
        { name: 'category', label: 'Categories', options: cats.map((c) => ({ value: c, label: c })) }, { name: 'status', label: 'Statuses', options: o.transactionStatuses }]}
      dateRange="Date" searchPlaceholder="Search description or reference…"
      beforeList={() => <DemoNotice>All transactions are clearly-labelled demo entries (reference numbers start with DEMO-).</DemoNotice>}
      canCreate={admin} canEdit={admin} canDelete={admin}
      csv={[{ label: 'Date', value: (r) => formatDate(r.date) }, { label: 'Type', value: (r) => r.type }, { label: 'Category', value: (r) => r.category }, { label: 'Description', value: (r) => r.description },
        { label: 'Amount', value: (r) => r.amount }, { label: 'Reference', value: (r) => r.referenceNumber }, { label: 'Status', value: (r) => r.status }, { label: 'FY', value: (r) => r.financialYear }]} />
  );
}

export function FinanceOverview() {
  const years = useFinancialYears();
  const [fy, setFy] = useState('');
  const { data: s, loading, error, reload } = useFetch('/budgets/summary', fy ? { financialYear: fy } : undefined);
  return (
    <div>
      <PageHeader title="Financial Management" subtitle="Allocation, income, expenditure and balance" icon={PieChart} actions={(
        <>
          <label className="sr-only" htmlFor="fy">Financial year</label>
          <select id="fy" className="input w-auto" value={fy || s?.financialYear || ''} onChange={(e) => setFy(e.target.value)}>
            {years.map((y) => <option key={y} value={y}>FY {y}</option>)}
          </select>
          <Link to="/reports/finance" className="btn-secondary">Financial report</Link>
        </>
      )} />
      <DemoNotice>These figures are computed from demo transactions and allocations. They are not actual government financial data.</DemoNotice>
      <AsyncBoundary loading={loading} error={error} onRetry={reload}>
        {s && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <StatCard label="Total allocation" value={formatINRShort(s.totalAllocation)} icon={Landmark} hint={formatINR(s.totalAllocation)} />
              <StatCard label="Total income" value={formatINRShort(s.totalIncome)} icon={TrendingUp} accent="green" hint={formatINR(s.totalIncome)} />
              <StatCard label="Total expenses" value={formatINRShort(s.totalExpenses)} icon={TrendingDown} accent="amber" hint={formatINR(s.totalExpenses)} />
              <StatCard label="Utilised budget" value={formatINRShort(s.utilizedBudget)} icon={Wallet} accent="violet" hint={`${s.utilizationPercent}% of allocation`} />
              <StatCard label="Remaining budget" value={formatINRShort(s.remainingBudget)} icon={Scale} accent={s.remainingBudget < 0 ? 'red' : 'green'} hint={formatINR(s.remainingBudget)} />
            </div>
            <Card title={`Allocation vs utilisation by head — FY ${s.financialYear}`}><BudgetBars data={s.budgets} /></Card>
            <div className="grid gap-5 lg:grid-cols-2">
              <Card title="Expenditure by category"><CategoryBars data={s.expenseByCategory.map((r) => ({ name: r.category, value: r.amount }))} valueFormatter={formatINRShort} color="#eb6834" /></Card>
              <Card title="Income by source"><CategoryBars data={s.incomeByCategory.map((r) => ({ name: r.category, value: r.amount }))} valueFormatter={formatINRShort} color="#1baf7a" /></Card>
            </div>
            <Card title="Budget head summary" bodyClass="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50"><tr><th className="table-th">Head</th><th className="table-th text-right">Allocated</th><th className="table-th text-right">Utilised</th><th className="table-th text-right">Remaining</th><th className="table-th">Use</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {s.budgets.map((b) => (
                    <tr key={b.category}><td className="table-td font-medium">{b.category}</td><td className="table-td text-right tabular-nums">{formatINR(b.allocated)}</td><td className="table-td text-right tabular-nums">{formatINR(b.utilized)}</td>
                      <td className="table-td text-right tabular-nums">{formatINR(b.remaining)}</td><td className="table-td min-w-[140px]"><ProgressBar value={b.allocated ? Math.round((b.utilized / b.allocated) * 100) : 0} size="sm" /></td></tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </AsyncBoundary>
    </div>
  );
}
