import api from '../../api/axios';

export const getCategories = async () => {
  const { data } = await api.get('/categories');
  return data;
};

export const getCategory = async (id) => {
  const { data } = await api.get(`/categories/${id}`);
  return data;
};
