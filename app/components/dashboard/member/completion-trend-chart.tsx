"use client";

import { ChartLineUpIcon } from "@phosphor-icons/react/dist/ssr";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { CompletionPoint } from "@/types";

const chartConfig = {
  completed: {
    label: "Completed",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type CompletionTrendChartProps = {
  data: CompletionPoint[];
};

export function CompletionTrendChart({ data }: CompletionTrendChartProps) {
  return (
    <Card className="rounded-xs">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <ChartLineUpIcon className="size-4 text-muted-foreground" />
          Completion Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-64 w-full"
        >
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ left: 4, right: 4, top: 8 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" hideLabel />}
            />
            <Area
              dataKey="completed"
              type="natural"
              fill="var(--color-completed)"
              fillOpacity={0.35}
              stroke="var(--color-completed)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
