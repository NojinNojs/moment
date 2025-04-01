import { DollarSign, Wallet, CreditCard, Landmark } from "lucide-react";
import { Asset } from "@/types/assets";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AssetSummaryProps {
  assets: Asset[];
}

export function AssetSummary({ assets }: AssetSummaryProps) {
  // Calculate totals
  const calculateTotal = () => {
    return assets.reduce((acc, asset) => acc + asset.balance, 0);
  };

  const calculateTypeTotal = (type: string) => {
    return assets
      .filter(asset => asset.type === type)
      .reduce((acc, asset) => acc + asset.balance, 0);
  };

  // Calculate each category total
  const totalAssets = calculateTotal();
  const totalCash = calculateTypeTotal('cash') + calculateTypeTotal('emergency');
  const totalBank = calculateTypeTotal('bank');
  const totalEWallet = calculateTypeTotal('e-wallet');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/30 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-blue-700 dark:text-blue-400 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Total Assets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${totalAssets.toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/30 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-green-700 dark:text-green-400 flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Cash & Emergency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${totalCash.toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card className="bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-900/30 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-purple-700 dark:text-purple-400 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            E-Wallets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${totalEWallet.toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card className="bg-cyan-50 border-cyan-200 dark:bg-cyan-950/20 dark:border-cyan-900/30 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-cyan-700 dark:text-cyan-400 flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Bank Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${totalBank.toLocaleString()}</p>
        </CardContent>
      </Card>
    </div>
  );
} 