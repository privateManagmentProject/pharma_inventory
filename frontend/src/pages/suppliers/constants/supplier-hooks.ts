import { useQuery } from "@tanstack/react-query";
import { getSuppliers } from "../api/supplierAPI";
import type { Supplier } from "./supplier";

export const useSuppliers = () => {
  return useQuery<Supplier[], Error>({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });
};
