import { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { DollarSign, Check, ChevronsUpDown } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { currencies } from "@/lib/currencies";

// Mock useAuth hook until the real one is available
const useAuth = () => ({
  isAuthenticated: false,
});

// Animation variants for staggered animations
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { 
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1.0]
    }
  })
};

interface CurrencySettingsProps {
  defaultCurrency?: string;
}

export function CurrencySettings({ defaultCurrency }: CurrencySettingsProps) {
  const { isAuthenticated } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [isChanged, setIsChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize currency when settings are loaded
  useEffect(() => {
    if (defaultCurrency) {
      setSelectedCurrency(defaultCurrency);
    }
  }, [defaultCurrency]);
  
  const handleCurrencyChange = (value: string) => {
    setSelectedCurrency(value);
    setIsChanged(value !== defaultCurrency);
  };
  
  const handleSaveCurrency = async () => {
    setIsSaving(true);
    try {
      // Implementation of handleSaveCurrency
    } finally {
      setIsSaving(false);
    }
  };
  
  // Format examples based on currency
  const getFormattedExample = (amount: number, isNegative = false) => {
    const currency = currencies.find(c => c.value === selectedCurrency);
    
    if (!currency) return '';
    
    let formattedAmount = '';
    const absAmount = Math.abs(amount);
    
    // Special cases for known currencies
    switch (selectedCurrency) {
      case 'IDR':
        formattedAmount = `Rp${absAmount.toLocaleString('id-ID')}`;
        break;
      case 'JPY':
      case 'KRW':
      case 'VND':
        // No decimals for these currencies
        formattedAmount = `${currency.symbol}${Math.round(absAmount).toLocaleString()}`;
        break;
      case 'EUR':
        formattedAmount = `${currency.symbol}${absAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        break;
      default:
        formattedAmount = `${currency.symbol}${absAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    return isNegative ? `-${formattedAmount}` : formattedAmount;
  };
  
  if (!selectedCurrency) {
    return <div className="p-4 text-center">Loading currency settings...</div>;
  }
  
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      custom={6}
    >
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        <CardHeader className="border-b pb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Currency Settings</CardTitle>
              <CardDescription>
                Set your preferred currency for the application
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="currency" className="text-sm font-medium block mb-2">
                Preferred Currency
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={true}
                    className="w-full justify-between"
                  >
                    {currencies.find(c => c.value === selectedCurrency)?.label || "Select a currency..."}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search currency or country..." />
                    <CommandList>
                      <CommandEmpty>No currency found.</CommandEmpty>
                      <CommandGroup>
                        {currencies.map((currency) => (
                          <CommandItem
                            key={currency.value}
                            value={currency.value}
                            onSelect={(currentValue) => {
                              handleCurrencyChange(currentValue);
                            }}
                          >
                            <span className="mr-2">{currency.flag}</span>
                            <span className="font-medium">{currency.label} ({currency.symbol})</span>
                            <Check className={selectedCurrency === currency.value ? "ml-auto opacity-100" : "ml-auto opacity-0"} />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-sm text-muted-foreground mt-2">
                This will change how currency amounts are displayed throughout the application.
              </p>
              {isAuthenticated && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Your currency preference will be saved to your account and synced across all devices.
                </p>
              )}
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Example Formats</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded bg-muted/50">
                  <p className="text-muted-foreground mb-1">Positive Amount</p>
                  <p className="font-medium text-green-600">
                    {getFormattedExample(1234.56)}
                  </p>
                </div>
                <div className="p-3 rounded bg-muted/50">
                  <p className="text-muted-foreground mb-1">Negative Amount</p>
                  <p className="font-medium text-red-600">
                    {getFormattedExample(567.89, true)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t py-4">
          <Button 
            onClick={handleSaveCurrency} 
            className="ml-auto"
            disabled={!isChanged || isSaving}
          >
            {isSaving ? "Saving..." : "Save Currency Preference"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default CurrencySettings; 