import api from '../../api/axios';
export const getProducts = (params) => api.get('/products', { params }).then((r) => r.data);
export const getProduct = (id) => api.get(`/products/${id}`).then((r) => r.data);
export const getCategoryTree = () => api.get('/categories/tree').then((r) => r.data);
export const getBanners = () => api.get('/banners/active').then((r) => r.data);
