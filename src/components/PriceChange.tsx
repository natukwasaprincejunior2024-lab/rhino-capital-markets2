import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { changePercent, formatPercent } from '@/lib/market-data';

interface PriceChangeProps {
  price: number;
  prevPrice: number;
  className?: string;
}

export default function PriceChange({ price, prevPrice, className = '' }: PriceChangeProps) {
  const change = changePercent(price, prevPrice);
  const up = change >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${up ? 'text-up' : 'text-down'} ${className}`}>
      {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {formatPercent(change)}
    </span>
  );
}
