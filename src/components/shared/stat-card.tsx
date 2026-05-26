import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  trend?: number;
  format?: "currency" | "percent" | "number";
  color?: "default" | "green" | "red" | "blue" | "purple";
  className?: string;
}

const colorMap = {
  default: "text-gray-900 dark:text-white",
  green: "text-emerald-600",
  red: "text-red-600",
  blue: "text-blue-600",
  purple: "text-purple-600",
};

export function StatCard({ title, value, subtitle, trend, format = "currency", color = "default", className }: StatCardProps) {
  const formatted =
    format === "currency"
      ? formatCurrency(value)
      : format === "percent"
      ? `${value.toFixed(1)}%`
      : value.toLocaleString();

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
        <p className={cn("mt-2 text-2xl font-bold", colorMap[color])}>{formatted}</p>
        {(subtitle || trend !== undefined) && (
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            {trend !== undefined && (
              <>
                {trend > 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : trend < 0 ? (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                <span className={trend > 0 ? "text-emerald-600" : trend < 0 ? "text-red-600" : ""}>
                  {trend > 0 ? "+" : ""}{formatCurrency(Math.abs(trend))}
                </span>
              </>
            )}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
