import { useQuery } from '@tanstack/react-query';
import { getProducts, getProduct, getCategoryTree, getBanners } from './api';
export const useProducts = (params = {}) => useQuery({ queryKey: ['products', params], queryFn: () => getProducts(params), keepPreviousData: true });
export const useProduct = (id) => useQuery({ queryKey: ['product', id], queryFn: () => getProduct(id), enabled: !!id });
export const useCategoryTree = () => useQuery({ queryKey: ['cat-tree'], queryFn: getCategoryTree, staleTime: 300000 });
export const useBanners = () => useQuery({ queryKey: ['banners'], queryFn: getBanners, staleTime: 300000 });
