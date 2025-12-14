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
import type { TransactionEvent } from "@/lib/transaction-service";

type ChartDataPoint = {
  date: string;
  revenue: number;
  transactions: number;
  fees: number;
};

interface DashboardChartProps {
  transactions: TransactionEvent[];
  hasFetched: boolean;
  loading?: boolean;
}

const chartConfig = {
  revenue: {
    label: "Revenue (USD)",
    color: "var(--chart-1)",
  },
  transactions: {
    label: "Transactions",
    color: "var(--chart-2)",
  },
  fees: {
    label: "Fees (USD)",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

// Generate chart data from transactions
function generateChartData(transactions: TransactionEvent[], period: TimePeriod): ChartDataPoint[] {
  if (transactions.length === 0) {
    // Return empty placeholder data
    return getEmptyChartData(period);
  }

  const now = new Date();
  const groupedData: Record<string, { revenue: number; count: number }> = {};

  if (period === "year") {
    const monthsToShow = 12;
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const key = date.toLocaleString("en-US", { month: "short" });
      if (!groupedData[key]) {
        groupedData[key] = { revenue: 0, count: 0 };
      }
    }

    transactions.forEach((tx) => {
      if (!tx.timestamp) return;
      const txDate = new Date(Number(tx.timestamp) * 1000);
      
      const monthDiff = (now.getFullYear() - txDate.getFullYear()) * 12 + (now.getMonth() - txDate.getMonth());
      
      if (monthDiff >= 0 && monthDiff < monthsToShow) {
        const key = txDate.toLocaleString("en-US", { month: "short" });
        if (groupedData[key]) {
          groupedData[key].revenue += parseFloat(tx.amountSC || "0");
          groupedData[key].count += 1;
        }
      }
    });
  } else {
    let daysToShow: number;
    let dateFormat: (date: Date) => string;

    if (period === "week") {
      daysToShow = 7;
      dateFormat = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    } else {
      daysToShow = 30;
      dateFormat = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    }

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = dateFormat(date);
      if (!groupedData[key]) {
        groupedData[key] = { revenue: 0, count: 0 };
      }
    }

    transactions.forEach((tx) => {
      if (!tx.timestamp) return;
      const txDate = new Date(Number(tx.timestamp) * 1000);
      const daysDiff = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff >= 0 && daysDiff < daysToShow) {
        const key = dateFormat(txDate);
        if (groupedData[key]) {
          groupedData[key].revenue += parseFloat(tx.amountSC || "0");
          groupedData[key].count += 1;
        }
      }
    });
  }

  // Convert to chart data format
  return Object.entries(groupedData).map(([date, data]) => ({
    date,
    revenue: Math.round(data.revenue * 100) / 100,
    transactions: data.count,
    fees: Math.round(data.revenue * 0.01 * 100) / 100, // Assume 1% fees
  }));
}

function getEmptyChartData(period: TimePeriod): ChartDataPoint[] {
  const now = new Date();
  const data: ChartDataPoint[] = [];
  
  const daysToShow = period === "week" ? 7 : period === "month" ? 30 : 12;
  
  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = new Date(now);
    if (period === "year") {
      date.setMonth(date.getMonth() - i);
      data.push({
        date: date.toLocaleString("en-US", { month: "short" }),
        revenue: 0,
        transactions: 0,
        fees: 0,
      });
    } else {
      date.setDate(date.getDate() - i);
      data.push({
        date: `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`,
        revenue: 0,
        transactions: 0,
        fees: 0,
      });
    }
  }
  
  return data;
}

export default function DashboardChart({ transactions, hasFetched, loading }: DashboardChartProps) {
  const [activeTab, setActiveTab] = React.useState<TimePeriod>("week");

  // Generate chart data from transactions
  const chartData = React.useMemo(() => ({
    week: generateChartData(transactions, "week"),
    month: generateChartData(transactions, "month"),
    year: generateChartData(transactions, "year"),
  }), [transactions]);

  const handleTabChange = (value: string) => {
    if (value === "week" || value === "month" || value === "year") {
      setActiveTab(value as TimePeriod);
    }
  };

  const formatYAxisValue = (value: number) => {
    // Hide the "0" value by returning empty string
    if (value === 0) {
      return "";
    }

    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const renderChart = (data: ChartDataPoint[]) => {
    return (
      <div className="bg-accent rounded-lg p-3">
        <ChartContainer className="md:aspect-[3/1] w-full" config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: -12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <defs>
              <linearGradient id="fillSpendings" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-transactions)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-transactions)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillCoffee" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-fees)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-fees)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              horizontal={false}
              strokeDasharray="8 8"
              strokeWidth={2}
              stroke="var(--muted-foreground)"
              opacity={0.3}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={12}
              strokeWidth={1.5}
              className="uppercase text-sm fill-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={0}
              tickCount={6}
              className="text-sm fill-muted-foreground"
              tickFormatter={formatYAxisValue}
              domain={[0, "dataMax"]}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  className="min-w-[200px] px-4 py-3"
                />
              }
            />
            <Area
              dataKey="revenue"
              type="linear"
              fill="url(#fillSpendings)"
              fillOpacity={0.4}
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              dataKey="transactions"
              type="linear"
              fill="url(#fillSales)"
              fillOpacity={0.4}
              stroke="var(--color-transactions)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              dataKey="fees"
              type="linear"
              fill="url(#fillCoffee)"
              fillOpacity={0.4}
              stroke="var(--color-fees)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    );
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="max-md:gap-4"
    >
      <div className="flex items-center justify-between mb-4 max-md:contents">
        <TabsList className="max-md:w-full">
          <TabsTrigger value="week">WEEK</TabsTrigger>
          <TabsTrigger value="month">MONTH</TabsTrigger>
          <TabsTrigger value="year">YEAR</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-6 max-md:order-1">
          {Object.entries(chartConfig).map(([key, value]) => (
            <ChartLegend key={key} label={value.label} color={value.color} />
          ))}
          {loading && (
            <span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>
      
      {!hasFetched && (
        <div className="bg-accent rounded-lg p-8 flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground text-center">
            No transaction data available.<br />
            <span className="text-sm">Fetch transactions from the Transactions tab to see the chart.</span>
          </p>
        </div>
      )}

      {hasFetched && (
        <>
          <TabsContent value="week" className="space-y-4">
            {renderChart(chartData.week)}
          </TabsContent>
          <TabsContent value="month" className="space-y-4">
            {renderChart(chartData.month)}
          </TabsContent>
          <TabsContent value="year" className="space-y-4">
            {renderChart(chartData.year)}
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}

export const ChartLegend = ({
  label,
  color,
}: {
  label: string;
  color: string;
}) => {
  return (
    <div className="flex items-center gap-2 uppercase">
      <Bullet style={{ backgroundColor: color }} className="rotate-45" />
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
};
