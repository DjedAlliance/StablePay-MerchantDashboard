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
import mockDataJson from "@/mock.json";
import { Bullet } from "@/components/ui/bullet";
import type { MockData, TimePeriod } from "@/types/dashboard";
import { useTransactions } from "@/hooks/use-transactions";

const mockData = mockDataJson as MockData;

// Fee percentage for revenue calculations
const FEE_PERCENTAGE = 0.01; // 1% fee - adjust as needed

type ChartDataPoint = {
  date: string;
  revenue: number;
  transactions: number;
  fees: number;
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

export default function DashboardChart() {
  const [activeTab, setActiveTab] = React.useState<TimePeriod>("week");
  const { transactions, hasFetched } = useTransactions();

  const handleTabChange = (value: string) => {
    if (value === "week" || value === "month" || value === "year") {
      setActiveTab(value as TimePeriod);
    }
  };

  // Transform transaction data into chart format
  const transformToChartData = (period: TimePeriod): ChartDataPoint[] => {
    if (!hasFetched || transactions.length === 0) {
      return mockData.chartData[period];
    }

    const now = new Date();
    const dataPoints: Map<string, { revenue: number; count: number; fees: number }> = new Map();

    // Determine date range and grouping based on period
    let daysToInclude = 7;
    let dateFormat: (date: Date) => string;

    if (period === "week") {
      daysToInclude = 7;
      dateFormat = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (period === "month") {
      daysToInclude = 30;
      dateFormat = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      daysToInclude = 365;
      dateFormat = (date: Date) => date.toLocaleDateString('en-US', { month: 'short' });
    }

    // Initialize all dates with zero values
    // For year period, iterate by month instead of day for efficiency
    if (period === "year") {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const dateKey = dateFormat(date);
        if (!dataPoints.has(dateKey)) {
          dataPoints.set(dateKey, { revenue: 0, count: 0, fees: 0 });
        }
      }
    } else {
      for (let i = daysToInclude - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateKey = dateFormat(date);

        if (!dataPoints.has(dateKey)) {
          dataPoints.set(dateKey, { revenue: 0, count: 0, fees: 0 });
        }
      }
    }

    // Group transactions by date
    transactions.forEach(tx => {
      const txDate = tx.timestamp ?? new Date();
      const dateKey = dateFormat(txDate);

      const existing = dataPoints.get(dateKey) || { revenue: 0, count: 0, fees: 0 };
      const revenue = parseFloat(tx.amountBC);
      const fees = revenue * FEE_PERCENTAGE;

      dataPoints.set(dateKey, {
        revenue: existing.revenue + revenue,
        count: existing.count + 1,
        fees: existing.fees + fees
      });
    });

    // Convert to array format
    const result: ChartDataPoint[] = [];
    dataPoints.forEach((value, date) => {
      result.push({
        date,
        revenue: parseFloat(value.revenue.toFixed(4)),
        transactions: value.count,
        fees: parseFloat(value.fees.toFixed(4))
      });
    });

    return result;
  };

  // Memoize chart data to avoid recalculating on every render
  const chartData = React.useMemo(() => ({
    week: transformToChartData("week"),
    month: transformToChartData("month"),
    year: transformToChartData("year"),
  }), [transactions, hasFetched]);

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
        <ChartContainer className="aspect-[4/3] md:aspect-[3/1] w-full" config={chartConfig}>
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
        </div>
      </div>
      <TabsContent value="week" className="space-y-4">
        {renderChart(chartData.week)}
      </TabsContent>
      <TabsContent value="month" className="space-y-4">
        {renderChart(chartData.month)}
      </TabsContent>
      <TabsContent value="year" className="space-y-4">
        {renderChart(chartData.year)}
      </TabsContent>
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
