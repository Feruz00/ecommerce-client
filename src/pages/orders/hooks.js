import { useQuery } from "@tanstack/react-query";
import { getMyOrders, getMyOrder } from "./api";

export const useMyOrders = (params = {}) =>
  useQuery({
    queryKey: ["my-orders", params],
    queryFn: () => getMyOrders(params),
    keepPreviousData: true,
  });

export const useMyOrder = (id) =>
  useQuery({
    queryKey: ["my-orders", id],
    queryFn: () => getMyOrder(id),
    enabled: Boolean(id),
  });
