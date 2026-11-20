import api from '../../api/axios';
export const login = (p) => api.post('/auth/login', p).then((r) => r.data);
export const register = (p) => api.post('/auth/register', p).then((r) => r.data);
export const logout = () => api.get('/auth/logout').then((r) => r.data);
export const getMe = () => api.get('/auth/me').then((r) => r.data);
