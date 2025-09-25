import StockTracker from '@/components/StockTracker';
import { getTodayString } from '@/lib/utils';

export default function Home() {
  return <StockTracker initialDate={getTodayString()} />;
}