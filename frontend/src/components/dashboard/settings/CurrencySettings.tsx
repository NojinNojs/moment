import { useEffect, useState, useCallback } from "react";
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
import useUserSettings from "@/hooks/useUserSettings";
import { toast } from "sonner";
import { EventBus } from "@/lib/utils";

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

export function CurrencySettings() {
  const { settings, updateSettings, isLoading } = useUserSettings();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [isChanged, setIsChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize currency when settings are loaded
  useEffect(() => {
    if (settings?.currency) {
      console.log(`[CurrencySettings] Settings currency updated to: ${settings.currency}`);
      setSelectedCurrency(settings.currency);
      setIsChanged(false);  // Reset changed state
    }
  }, [settings?.currency]);
  
  // Listen for currency changes from other devices or contexts
  useEffect(() => {
    const handleCurrencyChange = (currencyCode: string) => {
      console.log(`[CurrencySettings] Received currency change event: ${currencyCode}`);
      setSelectedCurrency(currencyCode);
      setIsChanged(false);  // Reset changed state as this is from outside
    };
    
    // Listen for both direct currency changes and preference updates
    EventBus.on('currency:changed', handleCurrencyChange);
    
    const handlePreferenceUpdate = (data: { preference: string; value: string }) => {
      if (data.preference === 'currency') {
        console.log(`[CurrencySettings] Currency preference updated to: ${data.value}`);
        handleCurrencyChange(data.value);
      }
    };
    
    EventBus.on('preference:updated', handlePreferenceUpdate);
    
    return () => {
      EventBus.off('currency:changed', handleCurrencyChange);
      // Don't remove preference:updated handler with removeAllListeners
      // as other components might be using it
      EventBus.off('preference:updated', handlePreferenceUpdate);
    };
  }, []);
  
  const handleCurrencyChange = useCallback((value: string) => {
    console.log(`[CurrencySettings] Local currency selection changed to: ${value}`);
    setSelectedCurrency(value);
    setIsChanged(value !== settings?.currency);
  }, [settings?.currency]);
  
  const handleSaveCurrency = async () => {
    if (!isChanged) {
      console.log('[CurrencySettings] No changes to save');
      return;
    }
    
    setIsSaving(true);
    try {
      console.log(`[CurrencySettings] Saving currency: ${selectedCurrency}`);
      await updateSettings({ currency: selectedCurrency });
      toast.success("Currency updated successfully");
      setIsChanged(false);
    } catch (error) {
      console.error("[CurrencySettings] Failed to update currency:", error);
      toast.error("Failed to update currency", {
        description: "Please try again later"
      });
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
  
  if (isLoading) {
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
                    aria-expanded={false}
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