import api from "../../api/axios";
export const getCart = () => api.get("/cart").then((r) => r.data);
export const addToCart = (p) => api.post("/cart", p).then((r) => r.data);
export const updateCartItem = (id, quantity) =>
  api.patch(`/cart/${id}`, { quantity }).then((r) => r.data);
export const removeFromCart = (id) =>
  api.delete(`/cart/${id}`).then((r) => r.data);
