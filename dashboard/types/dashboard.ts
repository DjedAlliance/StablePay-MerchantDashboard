export interface DashboardStat {
  label: string;
  value: string;
  description: string;
  intent: "positive" | "negative" | "neutral";
  icon: string;
  tag?: string;
  direction?: "up" | "down";
}

export interface ChartDataPoint {
  date: string;
  revenue: number;
  transactions: number;
  fees: number;
}

export interface ChartData {
  week: ChartDataPoint[];
  month: ChartDataPoint[];
  year: ChartDataPoint[];
}


export interface MockData {
  dashboardStats: DashboardStat[];
  chartData: ChartData;
}

export type TimePeriod = "week" | "month" | "year";
