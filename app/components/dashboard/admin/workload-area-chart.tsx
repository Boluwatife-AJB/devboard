"use client";

import { ChartLineUpIcon } from "@phosphor-icons/react/dist/ssr";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { WorkloadPoint } from "@/types";

const chartConfig = {
  todo: {
    label: "Todo",
    color: "var(--chart-5)",
  },
  inProgress: {
    label: "In Prog",
    color: "var(--chart-2)",
  },
  done: {
    label: "Done",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type WorkloadAreaChartProps = {
  data: WorkloadPoint[];
};

export function WorkloadAreaChart({ data }: WorkloadAreaChartProps) {
  return (
    <Card className="rounded-xs">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <ChartLineUpIcon className="size-4 text-muted-foreground" />
          Workload Status
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-72 w-full"
        >
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ left: 4, right: 4, top: 8 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="team"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="todo"
              type="natural"
              fill="var(--color-todo)"
              fillOpacity={0.25}
              stroke="var(--color-todo)"
              stackId="workload"
            />
            <Area
              dataKey="inProgress"
              type="natural"
              fill="var(--color-inProgress)"
              fillOpacity={0.35}
              stroke="var(--color-inProgress)"
              stackId="workload"
            />
            <Area
              dataKey="done"
              type="natural"
              fill="var(--color-done)"
              fillOpacity={0.45}
              stroke="var(--color-done)"
              stackId="workload"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
