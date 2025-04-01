import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * DateRangePicker component for selecting a date range
 * Used for filtering transactions by date range
 */
export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
  align = "start",
  side = "bottom",
}: DateRangePickerProps) {
  // Predefined date ranges
  const selectDateRange = (range: string) => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      0
    );
    const firstDayOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );

    // Get first day of week (Sunday)
    const firstDayOfWeek = new Date(today);
    const day = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    firstDayOfWeek.setDate(today.getDate() - day);

    // Get last day of last week
    const lastDayOfLastWeek = new Date(firstDayOfWeek);
    lastDayOfLastWeek.setDate(lastDayOfLastWeek.getDate() - 1);

    // Get first day of last week
    const firstDayOfLastWeek = new Date(lastDayOfLastWeek);
    firstDayOfLastWeek.setDate(firstDayOfLastWeek.getDate() - 6);

    // Create yesterday date outside the switch statement
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Create ninetyDaysAgo outside the switch statement
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);

    switch (range) {
      case "today":
        onStartDateChange(today);
        onEndDateChange(today);
        break;
      case "yesterday":
        onStartDateChange(yesterday);
        onEndDateChange(yesterday);
        break;
      case "this-week":
        onStartDateChange(firstDayOfWeek);
        onEndDateChange(today);
        break;
      case "last-week":
        onStartDateChange(firstDayOfLastWeek);
        onEndDateChange(lastDayOfLastWeek);
        break;
      case "this-month":
        onStartDateChange(firstDayOfMonth);
        onEndDateChange(today);
        break;
      case "last-month":
        onStartDateChange(firstDayOfLastMonth);
        onEndDateChange(lastDayOfLastMonth);
        break;
      case "last-90-days":
        onStartDateChange(ninetyDaysAgo);
        onEndDateChange(today);
        break;
      case "this-year":
        onStartDateChange(new Date(today.getFullYear(), 0, 1));
        onEndDateChange(today);
        break;
      case "all-time":
        onStartDateChange(undefined);
        onEndDateChange(undefined);
        break;
      default:
        break;
    }
  };

  // Format the display text
  const formatDisplayText = () => {
    if (!startDate && !endDate) {
      return "Select date range";
    }

    if (startDate && !endDate) {
      return `From ${format(startDate, "PP")}`;
    }

    if (!startDate && endDate) {
      return `Until ${format(endDate, "PP")}`;
    }

    // Check if start and end dates are the same
    if (
      startDate &&
      endDate &&
      startDate.toDateString() === endDate.toDateString()
    ) {
      return format(startDate, "PP");
    }

    return `${startDate ? format(startDate, "PP") : "Any"} - ${
      endDate ? format(endDate, "PP") : "Any"
    }`;
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date-range"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !startDate && !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDisplayText()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align} side={side}>
          <div className="p-3 border-b">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Select Range</h4>
              <Select
                onValueChange={selectDateRange}
                defaultValue="custom"
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select a range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="last-week">Last Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                  <SelectItem value="all-time">All Time</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="p-3 flex gap-2">
            <div className="space-y-2">
              <h4 className="font-medium text-xs text-muted-foreground">Start Date</h4>
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={onStartDateChange}
                initialFocus
                disabled={(date) => endDate ? date > endDate : false}
              />
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-xs text-muted-foreground">End Date</h4>
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={onEndDateChange}
                initialFocus
                disabled={(date) => startDate ? date < startDate : false}
              />
            </div>
          </div>
          <div className="p-3 border-t flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onStartDateChange(undefined);
                onEndDateChange(undefined);
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => {
                selectDateRange("all-time");
              }}
            >
              All Time
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default DateRangePicker;