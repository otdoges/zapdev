import { useEffect } from 'react';

export default function CheckoutPage() {
  useEffect(() => {
    window.location.href = '/pricing';
  }, []);
  return null;
}


