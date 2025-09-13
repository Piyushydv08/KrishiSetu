import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Product, InsertProduct } from '@shared/schema';

export function useProducts(userId?: string) {
  return useQuery({
    queryKey: userId ? ['/api/products', { userId }] : ['/api/products'],
    queryFn: async () => {
      const url = userId ? `/api/products?userId=${userId}` : '/api/products';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json() as Promise<Product[]>;
    }
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['/api/products', id],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error('Product not found');
      return response.json() as Promise<Product>;
    },
    enabled: !!id
  });
}

export function useProductByBatch(batchId: string) {
  return useQuery({
    queryKey: ['/api/products/batch', batchId],
    queryFn: async () => {
      const response = await fetch(`/api/products/batch/${batchId}`);
      if (!response.ok) throw new Error('Product not found');
      return response.json() as Promise<Product>;
    },
    enabled: !!batchId
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: InsertProduct) => {
      const response = await apiRequest('POST', '/api/products', productData);
      return response.json() as Promise<Product>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      // Also invalidate user-specific stats queries
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    }
  });
}

export function useStats(userId?: string) {
  return useQuery({
    queryKey: userId ? ['/api/user', userId, 'stats'] : ['/api/stats'],
    queryFn: async () => {
      const url = userId ? `/api/user/${userId}/stats` : '/api/stats';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json() as Promise<{
        totalProducts: number;
        verifiedBatches?: number;
        activeShipments?: number;
        averageQualityScore?: number;
        activeTransfers?: number;
        completedTransfers?: number;
        averageRating?: number;
      }>;
    },
    enabled: !!userId || !userId // Always enabled for global stats, but userId required for user stats
  });
}

export function useRecentScans(userId?: string) {
  return useQuery({
    queryKey: userId ? ['/api/scans/recent', { userId }] : ['/api/scans/recent'],
    queryFn: async () => {
      const url = userId ? `/api/scans/recent?userId=${userId}` : '/api/scans/recent';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch recent scans');
      return response.json();
    }
  });
}
