import { useQuery } from "@tanstack/react-query";
import { getCategories } from "../api/categoryAPI";
import type { Category } from "./catgory";

export const useCategories = () => {
  return useQuery<Category[], Error>({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
};
