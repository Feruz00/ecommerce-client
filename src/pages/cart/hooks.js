import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCart, addToCart, updateCartItem, removeFromCart } from "./api";
export const useCart = () => useQuery({ queryKey: ["cart"], queryFn: getCart });
export const useAddToCart = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addToCart,
    onSuccess: () => qc.invalidateQueries(["cart"]),
  });
};

export const useUpdateCartItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }) => updateCartItem(id, quantity),
    onSuccess: () => qc.invalidateQueries(["cart"]),
  });
};
export const useRemoveFromCart = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeFromCart,
    onSuccess: () => qc.invalidateQueries(["cart"]),
  });
};
