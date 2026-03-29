import { useMutation } from '@tanstack/react-query';
import { createCheckoutSession } from '../../../api/checkout.ts';

export function useCheckout() {
  return useMutation({
    mutationFn: (priceId: string) => createCheckoutSession(priceId),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}
