"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
} from "recharts";

const tooltipStyle = (dark: boolean) => ({
  backgroundColor: dark ? "#111827" : "#ffffff",
  border: `1px solid ${dark ? "#1f2937" : "#e5e7eb"}`,
  borderRadius: "0.5rem",
  fontSize: "12px",
  color: dark ? "#e5e7eb" : "#0b1220",
});

const axisStyle = (dark: boolean) => ({
  fontSize: 11,
  fill: dark ? "#94a3b8" : "#64748b",
});

export function useDarkMode() {
  const [dark, setDark] = React.useState(false);
  React.useEffect(() => {
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setDark(document.documentElement.classList.contains("dark"));
    update();
    m.addEventListener("change", update);
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      m.removeEventListener("change", update);
      obs.disconnect();
    };
  }, []);
  return dark;
}

export function AreaChartCard({
  data,
  dataKey,
  name,
  color = "var(--chart-1)",
  height = 260,
}: {
  data: { label: string; [key: string]: string | number }[];
  dataKey: string;
  name: string;
  color?: string;
  height?: number;
}) {
  const dark = useDarkMode();
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={dark ? "#1f2937" : "#eef1f5"} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={axisStyle(dark)} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={axisStyle(dark)} axisLine={false} tickLine={false} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))} />
          <Tooltip contentStyle={tooltipStyle(dark)} formatter={(value, _name) => [Number(value).toLocaleString(), name]} />
          <Area type="monotone" dataKey={dataKey} name={name} stroke={color} strokeWidth={2} fill={`url(#grad-${dataKey})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarChartCard({
  data,
  dataKey,
  name,
  color = "var(--chart-1)",
  height = 260,
}: {
  data: { label: string; [key: string]: string | number }[];
  dataKey: string;
  name: string;
  color?: string;
  height?: number;
}) {
  const dark = useDarkMode();
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={dark ? "#1f2937" : "#eef1f5"} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={axisStyle(dark)} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle(dark)} axisLine={false} tickLine={false} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))} />
          <Tooltip contentStyle={tooltipStyle(dark)} formatter={(value, _name) => [Number(value).toLocaleString(), name]} cursor={{ fill: dark ? "#1f2937" : "#f1f3f7" }} />
          <Bar dataKey={dataKey} name={name} fill={color} radius={[4, 4, 0, 0]} maxBarSize={34} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MultiBarChartCard({
  data,
  series,
  height = 260,
}: {
  data: { label: string; [key: string]: string | number }[];
  series: { key: string; name: string; color: string }[];
  height?: number;
}) {
  const dark = useDarkMode();
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={dark ? "#1f2937" : "#eef1f5"} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={axisStyle(dark)} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle(dark)} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle(dark)} cursor={{ fill: dark ? "#1f2937" : "#f1f3f7" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={24} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChartCard({
  data,
  colors,
  height = 240,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number }[];
  colors: string[];
  height?: number;
  centerLabel?: string;
  centerValue?: string | number;
}) {
  const dark = useDarkMode();
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="relative" style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="86%" paddingAngle={2} stroke="none">
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle(dark)} formatter={(value, name) => [Number(value).toLocaleString(), name]} />
        </PieChart>
      </ResponsiveContainer>
      {centerValue !== undefined && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{centerValue}</span>
          {centerLabel && <span className="text-xs text-muted-foreground">{centerLabel}</span>}
          <span className="text-[10px] text-muted-foreground">{total.toLocaleString()} total</span>
        </div>
      )}
    </div>
  );
}

export function LineChartCard({
  data,
  series,
  height = 260,
}: {
  data: { label: string; [key: string]: string | number }[];
  series: { key: string; name: string; color: string }[];
  height?: number;
}) {
  const dark = useDarkMode();
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={dark ? "#1f2937" : "#eef1f5"} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={axisStyle(dark)} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle(dark)} axisLine={false} tickLine={false} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))} />
          <Tooltip contentStyle={tooltipStyle(dark)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}