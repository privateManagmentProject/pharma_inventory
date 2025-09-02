import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "../api/customerAPI";
import type { Customer } from "./customer";

export const useCustomers = () => {
  return useQuery<Customer[], Error>({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });
};
