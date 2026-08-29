"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ADMIN_CHART_COLORS, ADMIN_CHART_LINE_COLORS } from "@/components/admin/admin-styles";
import { cn } from "@/lib/utils";

function formatShortDate(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const tooltipStyle = {
  backgroundColor: "rgba(20, 17, 31, 0.94)",
  border: "1px solid rgba(200, 155, 74, 0.28)",
  borderRadius: "10px",
  color: "#ffffff",
  fontSize: "12px",
  boxShadow: "0 12px 28px -18px rgba(0, 0, 0, 0.55)",
  backdropFilter: "blur(8px)",
};

const tooltipLabelStyle = {
  color: "rgba(255, 255, 255, 0.65)",
  fontWeight: 600,
  marginBottom: 4,
};

const tooltipItemStyle = {
  color: "#f9db7e",
};

/** Recharts default bar hover cursor is light gray — override for dark admin charts. */
const barTooltipCursor = {
  fill: "rgba(110, 70, 199, 0.14)",
  stroke: "rgba(200, 155, 74, 0.22)",
  strokeWidth: 1,
};

const lineTooltipCursor = {
  stroke: "rgba(200, 155, 74, 0.35)",
  strokeWidth: 1,
  strokeDasharray: "4 4",
};

function AdminChartTooltip(props: React.ComponentProps<typeof Tooltip>) {
  return (
    <Tooltip
      contentStyle={tooltipStyle}
      labelStyle={tooltipLabelStyle}
      itemStyle={tooltipItemStyle}
      {...props}
    />
  );
}

const axisTick = { fill: "rgba(255,255,255,0.95)", fontSize: 11, fontWeight: 500 };

const legendStyle = { fontSize: "11px", color: "rgba(255,255,255,0.95)", fontWeight: 500 };

const gridStroke = "rgba(255,255,255,0.16)";

const activeDot = { r: 5, strokeWidth: 2, stroke: "#14111f" };

interface ChartPanelProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  height?: number;
}

export function AdminChartPanel({
  title,
  subtitle,
  children,
  className,
  height = 220,
}: ChartPanelProps) {
  return (
    <div
      className={cn(
        "rounded-[1rem] border border-[#f9db7e]/20 bg-[#1f1a2e] p-4 text-white shadow-[0_16px_40px_-28px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle ? (
          <p className="mt-0.5 text-[11px] text-[#fce9a8]">{subtitle}</p>
        ) : null}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}

export function AdminActivityTrendChart({
  data,
}: {
  data: Array<{ date: string; users: number; reviews: number; comments: number }>;
}) {
  const chartData = data.map((point) => ({
    ...point,
    label: formatShortDate(point.date),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={gridStroke} vertical={false} />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
        <AdminChartTooltip cursor={lineTooltipCursor} />
        <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />
        <Line type="monotone" dataKey="users" name="Users" stroke={ADMIN_CHART_LINE_COLORS.users} strokeWidth={2.5} dot={false} activeDot={{ ...activeDot, fill: ADMIN_CHART_LINE_COLORS.users }} />
        <Line type="monotone" dataKey="reviews" name="Reviews" stroke={ADMIN_CHART_LINE_COLORS.reviews} strokeWidth={2.5} dot={false} activeDot={{ ...activeDot, fill: ADMIN_CHART_LINE_COLORS.reviews }} />
        <Line type="monotone" dataKey="comments" name="Comments" stroke={ADMIN_CHART_LINE_COLORS.comments} strokeWidth={2.5} dot={false} activeDot={{ ...activeDot, fill: ADMIN_CHART_LINE_COLORS.comments }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AdminBarCountChart({
  data,
  dataKey = "count",
  labelKey = "label",
}: {
  data: Array<{ label: string; count: number }>;
  dataKey?: string;
  labelKey?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid stroke={gridStroke} horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey={labelKey} width={124} tick={axisTick} tickLine={false} axisLine={false} />
        <AdminChartTooltip cursor={barTooltipCursor} />
        <Bar dataKey={dataKey} name="Count" radius={[0, 4, 4, 0]} minPointSize={8}>
          {data.map((entry, index) => (
            <Cell key={`${entry.label}-${index}`} fill={ADMIN_CHART_COLORS[index % ADMIN_CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AdminDonutChart({
  data,
}: {
  data: Array<{ label: string; count: number }>;
}) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="label" innerRadius="58%" outerRadius="82%" paddingAngle={3} stroke="#14111f" strokeWidth={2}>
            {data.map((entry, index) => (
              <Cell key={`${entry.label}-${index}`} fill={ADMIN_CHART_COLORS[index % ADMIN_CHART_COLORS.length]} />
            ))}
          </Pie>
          <AdminChartTooltip cursor={{ fill: "rgba(110, 70, 199, 0.12)" }} />
          <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#fde68a]">Total</p>
          <p className="font-serif text-2xl font-medium text-white">{total.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

export function AdminGroupedBarChart({
  data,
}: {
  data: Array<{ label: string; count: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={gridStroke} vertical={false} />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
        <AdminChartTooltip cursor={barTooltipCursor} />
        <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]} minPointSize={8}>
          {data.map((entry, index) => (
            <Cell key={`${entry.label}-${index}`} fill={ADMIN_CHART_COLORS[index % ADMIN_CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
