import api from "../../api/axios";

export const getMyOrders = (params = {}) =>
  api.get("/my-orders", { params }).then((res) => res.data);

export const getMyOrder = (id) =>
  api.get(`/my-orders/${id}`).then((res) => res.data);
