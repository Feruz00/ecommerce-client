import api from '../../api/axios';
export const checkout = (payload) => api.post('/orders/checkout', payload).then((r) => r.data);
export const getMyOrders = () => api.get('/orders/my').then((r) => r.data);
