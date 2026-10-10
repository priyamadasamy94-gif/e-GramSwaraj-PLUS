import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { labelize, formatINR, formatINRShort } from '../../utils/format';

// Categorical palette (validated default order) — colour follows the entity, never its rank.
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
// Fixed colour per known status so a filter never repaints survivors.
const FIXED = {
  PLANNED: '#94a3b8', PROPOSED: '#94a3b8', APPROVED: '#2a78d6', IN_PROGRESS: '#eda100', COMPLETED: '#0ca30c', ON_HOLD: '#ec835a', CANCELLED: '#d03b3b',
  SUBMITTED: '#94a3b8', ACKNOWLEDGED: '#2a78d6', RESOLVED: '#0ca30c', REJECTED: '#d03b3b',
  GOOD: '#0ca30c', FAIR: '#fab219', POOR: '#ec835a', CRITICAL: '#d03b3b',
};
const colorFor = (name, i) => FIXED[name] || SERIES[i % SERIES.length];

const tooltipStyle = { borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15,33,66,.1)', fontSize: 12 };

/** Donut for part-to-whole of a handful of states; legend + labels carry identity (never colour alone). */
export function DonutChart({ data = [], height = 240 }) {
  const rows = data.filter((d) => d.value > 0).map((d, i) => ({ ...d, label: labelize(d.name), fill: colorFor(d.name, i) }));
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (!rows.length) return <p className="py-10 text-center text-sm text-slate-500">No data yet</p>;
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <div className="relative w-full sm:w-1/2" style={{ height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie isAnimationActive={false} data={rows} dataKey="value" nameKey="label" innerRadius="58%" outerRadius="88%" paddingAngle={1.5} stroke="#fff" strokeWidth={2}>
              {rows.map((r) => <Cell key={r.name} fill={r.fill} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v} (${Math.round((v / total) * 100)}%)`, n]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-slate-900">{total}</span>
          <span className="text-xs text-slate-500">Total</span>
        </div>
      </div>
      <ul className="w-full space-y-1.5 sm:w-1/2">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: r.fill }} />{r.label}</span>
            <span className="font-medium tabular-nums text-slate-800">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal bars for counts per category (magnitude, single series → single hue). */
export function CategoryBars({ data = [], height, color = SERIES[0], valueFormatter = (v) => v }) {
  const rows = [...data].map((d) => ({ ...d, label: labelize(d.name) })).sort((a, b) => b.value - a.value);
  if (!rows.length) return <p className="py-10 text-center text-sm text-slate-500">No data yet</p>;
  const h = height || Math.max(160, rows.length * 34 + 30);
  return (
    <div style={{ height: h }}>
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 28, top: 4, bottom: 4 }} barCategoryGap={6}>
          <CartesianGrid horizontal={false} stroke="#eef0f3" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={valueFormatter} />
          <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }} formatter={(v) => [valueFormatter(v), 'Count']} />
          <Bar isAnimationActive={false} dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={20} label={{ position: 'right', fontSize: 11, fill: '#334155', formatter: valueFormatter }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Allocated vs utilised per budget head (two series, one axis). */
export function BudgetBars({ data = [], height = 320 }) {
  if (!data.length) return <p className="py-10 text-center text-sm text-slate-500">No budget allocations for this year</p>;
  const rows = data.map((d) => ({ ...d, short: d.category.replace(' & Infrastructure', ' & Infra.') }));
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ left: 0, right: 8, top: 8, bottom: 8 }} barGap={2}>
          <CartesianGrid vertical={false} stroke="#eef0f3" />
          <XAxis dataKey="short" interval={0} angle={-30} textAnchor="end" height={70} tick={{ fontSize: 11, fill: '#334155' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
          <YAxis tickFormatter={formatINRShort} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={64} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }} formatter={(v, n) => [formatINR(v), n]} labelFormatter={(l, p) => p?.[0]?.payload?.category || l} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="square" />
          <Bar isAnimationActive={false} name="Allocated" dataKey="allocated" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={26} />
          <Bar isAnimationActive={false} name="Utilised" dataKey="utilized" fill={SERIES[1]} radius={[4, 4, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
