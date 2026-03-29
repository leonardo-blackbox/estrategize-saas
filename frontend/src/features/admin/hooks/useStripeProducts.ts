import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminListProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminArchiveProduct,
  type CreateProductInput,
  type UpdateProductInput,
} from '../../../api/stripe.ts';

const QUERY_KEY = ['admin-stripe-products'] as const;

export function useStripeProducts() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: adminListProducts,
  });

  const createProduct = useMutation({
    mutationFn: (input: CreateProductInput) => adminCreateProduct(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      adminUpdateProduct(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const archiveProduct = useMutation({
    mutationFn: (id: string) => adminArchiveProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    products: data?.data ?? [],
    isLoading,
    createProduct,
    updateProduct,
    archiveProduct,
    isCreating: createProduct.isPending,
    isUpdating: updateProduct.isPending,
    isArchiving: archiveProduct.isPending,
  };
}
