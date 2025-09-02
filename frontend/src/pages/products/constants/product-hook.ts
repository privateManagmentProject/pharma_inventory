import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../api/productAPI";
import type { Product } from "./product";

export const useProducts = () => {
  return useQuery<Product[], Error>({
    queryKey: ["products"],
    queryFn: getProducts,
  });
};
