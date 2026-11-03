/**
 * One chart form for the dashboard: a single series over days, as a line or
 * bars, with a hover tooltip, recessive grid, and a table view for anyone who
 * wants the numbers. The colour passes the data-mark checks on both surfaces
 * (#2563eb on light, #3b82f6 on dark).
 */

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatNumber } from './ui';

const SERIES = { light: '#2563eb', dark: '#3b82f6' };

function isDark(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
}

function dayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

interface Point {
  date: string;
}

export function DailyChart<T extends Point>({
  data,
  dataKey,
  label,
  kind = 'line',
  height = 220,
}: {
  data: T[];
  dataKey: keyof T & string;
  /** What the series is, for the tooltip and the table. */
  label: string;
  kind?: 'line' | 'bar';
  height?: number;
}) {
  const [table, setTable] = useState(false);
  const colour = isDark() ? SERIES.dark : SERIES.light;
  const ink = 'hsl(var(--muted-foreground))';
  const grid = 'hsl(var(--border))';

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No data for this period.</p>;
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground">{label} per day</div>
        <button type="button" className="text-xs text-muted-foreground underline-offset-2 hover:underline" onClick={() => setTable((t) => !t)}>
          {table ? 'Chart' : 'Table'}
        </button>
      </div>
      {table ? (
        <div className="max-h-64 overflow-auto rounded border">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/60 text-left">
              <tr>
                <th className="px-2 py-1 font-semibold">Day</th>
                <th className="px-2 py-1 text-right font-semibold">{label}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((d) => (
                <tr key={d.date}>
                  <td className="px-2 py-1">{dayLabel(d.date)}</td>
                  <td className="px-2 py-1 text-right tabular-nums">{formatNumber(Number(d[dataKey as keyof T]) || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          {kind === 'bar' ? (
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
              <CartesianGrid vertical={false} stroke={grid} strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fontSize: 11, fill: ink }} axisLine={false} tickLine={false} minTickGap={28} />
              <YAxis width={38} tick={{ fontSize: 11, fill: ink }} axisLine={false} tickLine={false} tickFormatter={compact} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'hsl(var(--muted) / 0.6)' }} content={<Tip label={label} />} />
              <Bar dataKey={dataKey} fill={colour} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={grid} strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fontSize: 11, fill: ink }} axisLine={false} tickLine={false} minTickGap={28} />
              <YAxis width={38} tick={{ fontSize: 11, fill: ink }} axisLine={false} tickLine={false} tickFormatter={compact} allowDecimals={false} />
              <Tooltip cursor={{ stroke: ink, strokeDasharray: '3 3' }} content={<Tip label={label} />} />
              <Line type="monotone" dataKey={dataKey} stroke={colour} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: 'hsl(var(--background))', strokeWidth: 2, fill: colour }} isAnimationActive={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}

function Tip({ active, payload, label: seriesLabel }: { active?: boolean; payload?: { value: number; payload: Point }[]; label: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded border bg-background px-2.5 py-1.5 text-xs shadow-sm">
      <div className="text-muted-foreground">{dayLabel(p.payload.date)}</div>
      <div className="font-semibold tabular-nums">
        {formatNumber(p.value)} <span className="font-normal text-muted-foreground">{seriesLabel.toLowerCase()}</span>
      </div>
    </div>
  );
}
