"use client"

import React from "react";
import { Area, AreaChart as RechartsAreaChart, CartesianGrid, XAxis, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

/**
 * AreaChart component with gradient fill
 * Uses recharts and the shadcn/ui chart components
 */
export interface AreaChartProps {
  data: Record<string, unknown>[];
  categories: Record<string, unknown>[];
  index: string;
  valueFormatter?: (value: number) => string;
  colors?: string[];
  yAxisWidth?: number;
  showYAxis?: boolean;
  showXAxis?: boolean;
  showGridLines?: boolean;
  autoMinValue?: boolean;
  minValue?: number;
  maxValue?: number;
  showAnimation?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  showGradient?: boolean;
  startEndOnly?: boolean;
  className?: string;
}

export function AreaChart({
  data,
  title,
  description,
  footer,
  categories,
  index,
  className,
  showGrid = true,
  showXAxis = true,
}: {
  data: Record<string, unknown>[];
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  categories: string[];
  index: string;
  className?: string;
  showGrid?: boolean;
  showXAxis?: boolean;
  valueFormatter?: (value: number) => string;
}) {
  // Create config for the chart
  const chartConfig = categories.reduce((acc, category, i) => {
    const colors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
    ];
    
    acc[category] = {
      label: category,
      color: colors[i % colors.length],
    };
    
    return acc;
  }, {} as ChartConfig);

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ChartContainer config={chartConfig}>
          <RechartsAreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 0,
              right: 0,
              top: 5,
              bottom: 5,
            }}
          >
            {showGrid && <CartesianGrid vertical={false} />}
            {showXAxis && (
              <XAxis
                dataKey={index}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => 
                  typeof value === 'string' ? value.slice(0, 3) : value
                }
              />
            )}
            <Tooltip content={<ChartTooltipContent />} />
            <defs>
              {categories.map((category) => (
                <linearGradient 
                  key={category}
                  id={`fill${category}`} 
                  x1="0" 
                  y1="0" 
                  x2="0" 
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={`var(--color-${category})`}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={`var(--color-${category})`}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
            </defs>
            {categories.map((category) => (
              <Area
                key={category}
                dataKey={category}
                type="monotone"
                fill={`url(#fill${category})`}
                fillOpacity={0.4}
                stroke={`var(--color-${category})`}
                stackId="1"
              />
            ))}
          </RechartsAreaChart>
        </ChartContainer>
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}

export default AreaChart; 