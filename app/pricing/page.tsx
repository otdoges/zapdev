import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ProductWithPrices } from '@/types';
import { Navbar } from '@/components/navbar';
import { PricingContent } from '@/components/pricing';

export const dynamic = 'force-dynamic';

async function getProductsWithPrices(): Promise<ProductWithPrices[]> {
  const supabase = createServerComponentClient({ cookies });
  const { data, error } = await supabase
    .from('products')
    .select('*, prices(*)')
    .eq('active', true)
    .eq('prices.active', true)
    .order('metadata->index');

  if (error) {
    console.error('Error fetching products with prices:', error);
    return [];
  }
  return data || [];
}

export default async function PricingPage() {
  const products = await getProductsWithPrices();

  return (
    <>
      <Navbar />
      <PricingContent products={products} />
    </>
  );
}
