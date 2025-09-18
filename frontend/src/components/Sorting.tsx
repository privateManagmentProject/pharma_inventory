import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import React from "react";

interface SortOption {
  value: string;
  label: string;
}

interface SortingProps {
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
  sortOptions: SortOption[];
}

const Sorting: React.FC<SortingProps> = ({
  sortBy,
  sortOrder,
  onSortChange,
  sortOptions,
}) => {
  const handleSortChange = (newSortBy: string) => {
    if (newSortBy === sortBy) {
      // Toggle order if same field
      onSortChange(sortBy, sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Default to ascending for new field
      onSortChange(newSortBy, "asc");
    }
  };

  const getSortIcon = (optionValue: string) => {
    if (optionValue !== sortBy) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-700">Sort by:</span>
      <Select value={sortBy} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center space-x-2">
                <span>{option.label}</span>
                {getSortIcon(option.value)}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default Sorting;
