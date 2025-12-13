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

const mockData = mockDataJson as MockData;

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

interface DashboardChartProps {
  transactions?: any[];
  hasFetched?: boolean;
}

// Generate chart data from real transactions
function generateChartData(transactions: any[], period: TimePeriod): ChartDataPoint[] {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  
  // Determine date range based on period
  let daysToShow: number;
  let dateFormat: Intl.DateTimeFormatOptions;
  
  switch (period) {
    case 'week':
      daysToShow = 7;
      dateFormat = { weekday: 'short' };
      break;
    case 'month':
      daysToShow = 30;
      dateFormat = { day: 'numeric', month: 'short' };
      break;
    case 'year':
      daysToShow = 365;
      dateFormat = { month: 'short' };
      break;
  }

  // Create buckets for each day/period
  const buckets: Map<string, { revenue: number; count: number; fees: number }> = new Map();
  
  // Initialize buckets
  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = new Date(now - i * msPerDay);
    const dateKey = date.toLocaleDateString('en-US', dateFormat);
    buckets.set(dateKey, { revenue: 0, count: 0, fees: 0 });
  }

  // Aggregate transactions into buckets
  transactions.forEach(tx => {
    const txDate = new Date(parseInt(tx.timestamp) * 1000);
    const dateKey = txDate.toLocaleDateString('en-US', dateFormat);
    
    if (buckets.has(dateKey)) {
      const bucket = buckets.get(dateKey)!;
      const amount = parseFloat(tx.amountBC || '0');
      bucket.revenue += amount;
      bucket.count += 1;
      bucket.fees += amount * 0.02; // Assume 2% fee
    }
  });

  // Convert to chart data format
  return Array.from(buckets.entries()).map(([date, data]) => ({
    date,
    revenue: Math.round(data.revenue * 100) / 100,
    transactions: data.count,
    fees: Math.round(data.fees * 100) / 100,
  }));
}

export default function DashboardChart({ transactions = [], hasFetched = false }: DashboardChartProps) {
  const [activeTab, setActiveTab] = React.useState<TimePeriod>("week");
  const [chartData, setChartData] = React.useState<Record<TimePeriod, ChartDataPoint[]>>({
    week: [],
    month: [],
    year: [],
  });

  // Generate chart data from transactions
  React.useEffect(() => {
    if (hasFetched && transactions.length > 0) {
      setChartData({
        week: generateChartData(transactions, 'week'),
        month: generateChartData(transactions, 'month'),
        year: generateChartData(transactions, 'year'),
      });
    }
  }, [transactions, hasFetched]);

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
    // Use mock data if no real data available
    const displayData = data.length > 0 ? data : (mockData.chartData[activeTab] || []);
    
    return (
      <div className="bg-accent rounded-lg p-3">
        <ChartContainer className="md:aspect-[3/1] w-full" config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={displayData}
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
