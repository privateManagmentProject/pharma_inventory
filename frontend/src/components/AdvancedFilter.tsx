import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface FilterOption {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "number" | "dateRange";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface AdvancedFilterProps {
  filters: FilterOption[];
  onFilterChange: (filters: Record<string, any>) => void;
  onClearFilters: () => void;
  title?: string;
  icon?: React.ReactNode;
}

const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  title = "Advanced Filters",
  icon,
}) => {
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  useEffect(() => {
    onFilterChange(filterValues);
  }, [filterValues, onFilterChange]);

  const handleFilterChange = (key: string, value: any) => {
    const newValues = { ...filterValues, [key]: value };
    setFilterValues(newValues);

    // Update active filters
    if (value && value !== "") {
      if (!activeFilters.includes(key)) {
        setActiveFilters([...activeFilters, key]);
      }
    } else {
      setActiveFilters(activeFilters.filter((f) => f !== key));
    }
  };

  const clearFilter = (key: string) => {
    const newValues = { ...filterValues };
    delete newValues[key];
    setFilterValues(newValues);
    setActiveFilters(activeFilters.filter((f) => f !== key));
  };

  const clearAllFilters = () => {
    setFilterValues({});
    setActiveFilters([]);
    onClearFilters();
  };

  const renderFilterInput = (filter: FilterOption) => {
    const value = filterValues[filter.key] || "";

    switch (filter.type) {
      case "text":
        return (
          <Input
            placeholder={
              filter.placeholder || `Search ${filter.label.toLowerCase()}...`
            }
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="w-full"
          />
        );

      case "select":
        return (
          <Select
            value={value}
            onValueChange={(val) => handleFilterChange(filter.key, val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={`Select ${filter.label.toLowerCase()}...`}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All {filter.label}</SelectItem>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="w-full"
          />
        );

      case "dateRange":
        return (
          <div className="flex gap-2">
            <Input
              type="date"
              placeholder="From"
              value={value?.from || ""}
              onChange={(e) =>
                handleFilterChange(filter.key, {
                  ...value,
                  from: e.target.value,
                })
              }
              className="flex-1"
            />
            <Input
              type="date"
              placeholder="To"
              value={value?.to || ""}
              onChange={(e) =>
                handleFilterChange(filter.key, { ...value, to: e.target.value })
              }
              className="flex-1"
            />
          </div>
        );

      case "number":
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={value?.min || ""}
              onChange={(e) =>
                handleFilterChange(filter.key, {
                  ...value,
                  min: e.target.value,
                })
              }
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Max"
              value={value?.max || ""}
              onChange={(e) =>
                handleFilterChange(filter.key, {
                  ...value,
                  max: e.target.value,
                })
              }
              className="flex-1"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilters.length} active
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {activeFilters.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {isExpanded ? "Hide" : "Show"} Filters
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <Label className="text-sm font-medium">{filter.label}</Label>
                {renderFilterInput(filter)}
                {filterValues[filter.key] && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearFilter(filter.key)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      )}

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((key) => {
              const filter = filters.find((f) => f.key === key);
              const value = filterValues[key];
              if (!filter || !value) return null;

              let displayValue = "";
              if (filter.type === "select") {
                displayValue =
                  filter.options?.find((opt) => opt.value === value)?.label ||
                  value;
              } else if (filter.type === "dateRange") {
                displayValue = `${value.from || ""} - ${value.to || ""}`;
              } else if (filter.type === "number") {
                displayValue = `${value.min || ""} - ${value.max || ""}`;
              } else {
                displayValue = String(value);
              }

              return (
                <Badge
                  key={key}
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  {filter.label}: {displayValue}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearFilter(key)}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default AdvancedFilter;
