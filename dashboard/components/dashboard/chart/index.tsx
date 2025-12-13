"use client";

import * as React from "react";
import { XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bullet } from "@/components/ui/bullet";
import type { TimePeriod } from "@/types/dashboard";
import type { TransactionEvent } from "@/lib/transaction-service"; // Ensure this matches your type location

// --- 1. Helper Function to Process Data ---
const processChartData = (transactions: TransactionEvent[], period: TimePeriod) => {
  if (!transactions || transactions.length === 0) return [];

  // Grouping logic would go here. For simplicity, we'll map transactions to simple points.
  // In a production app, you would aggregate sums per day/month.
  // This is a basic implementation that plots individual transaction amounts.
  
  // Sort by blockNumber (proxy for time)
  const sorted = [...transactions].sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber));

  return sorted.map((tx, index) => ({
    date: `Tx ${index + 1}`, // Simple X-Axis label
    revenue: parseFloat(tx.amountBC), // Revenue in ETH/ADA
    transactions: 1, // Count
    fees: 0, // Placeholder if you don't have fee data yet
  }));
};

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
  transactions: {
    label: "Transactions",
    color: "var(--chart-2)",
  },
  fees: {
    label: "Fees",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

// --- 2. Update Component Signature ---
export default function DashboardChart({ data = [] }: { data?: TransactionEvent[] }) {
  const [activeTab, setActiveTab] = React.useState<TimePeriod>("week");

  // Process data based on the active tab (currently just passing raw sorted data)
  const chartData = React.useMemo(() => {
    return processChartData(data, activeTab);
  }, [data, activeTab]);

  const handleTabChange = (value: string) => {
    if (value === "week" || value === "month" || value === "year") {
      setActiveTab(value as TimePeriod);
    }
  };

  const formatYAxisValue = (value: number) => {
    if (value === 0) return "";
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toFixed(2); // Changed to show small decimal amounts for crypto
  };

  const renderChart = (chartData: any[]) => {
    return (
      <div className="bg-accent rounded-lg p-3">
        <ChartContainer className="md:aspect-[3/1] w-full" config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{ left: -12, right: 12, top: 12, bottom: 12 }}
          >
            <defs>
              <linearGradient id="fillSpendings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid horizontal={false} strokeDasharray="8 8" strokeWidth={2} stroke="var(--muted-foreground)" opacity={0.3} />
            <XAxis dataKey="date" tickLine={false} tickMargin={12} strokeWidth={1.5} className="uppercase text-sm fill-muted-foreground" />
            <YAxis tickLine={false} axisLine={false} tickMargin={0} tickCount={6} className="text-sm fill-muted-foreground" tickFormatter={formatYAxisValue} domain={[0, "dataMax"]} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" className="min-w-[200px] px-4 py-3" />} />
            <Area dataKey="revenue" type="linear" fill="url(#fillSpendings)" fillOpacity={0.4} stroke="var(--color-revenue)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ChartContainer>
      </div>
    );
  };

  // If no data, show a placeholder message inside the chart area
  if (data.length === 0) {
     return (
        <div className="p-8 text-center border rounded-lg bg-accent/50">
            <p className="text-muted-foreground">No transaction data available for visualization.</p>
        </div>
     )
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="max-md:gap-4">
      <div className="flex items-center justify-between mb-4 max-md:contents">
        <TabsList className="max-md:w-full">
          <TabsTrigger value="week">Tx History</TabsTrigger> {/* Renamed for clarity */}
        </TabsList>
        <div className="flex items-center gap-6 max-md:order-1">
          <ChartLegend label="Revenue" color={chartConfig.revenue.color} />
        </div>
      </div>
      <TabsContent value="week" className="space-y-4">
        {renderChart(chartData)}
      </TabsContent>
       <TabsContent value="month" className="space-y-4">
        {renderChart(chartData)}
      </TabsContent>
       <TabsContent value="year" className="space-y-4">
        {renderChart(chartData)}
      </TabsContent>
    </Tabs>
  );
}

export const ChartLegend = ({ label, color }: { label: string; color: string }) => {
  return (
    <div className="flex items-center gap-2 uppercase">
      <Bullet style={{ backgroundColor: color }} className="rotate-45" />
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
};