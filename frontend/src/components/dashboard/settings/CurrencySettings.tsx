import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";

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

// Currency options with symbols and flags
const currencies = [
  { value: "USD", label: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { value: "EUR", label: "Euro", symbol: "€", flag: "🇪🇺" },
  { value: "GBP", label: "British Pound", symbol: "£", flag: "🇬🇧" },
  { value: "JPY", label: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { value: "CAD", label: "Canadian Dollar", symbol: "CA$", flag: "🇨🇦" },
  { value: "AUD", label: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { value: "CHF", label: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  { value: "CNY", label: "Chinese Yuan", symbol: "¥", flag: "🇨🇳" },
  { value: "INR", label: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  { value: "BRL", label: "Brazilian Real", symbol: "R$", flag: "🇧🇷" },
  { value: "IDR", label: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩" },
];

interface CurrencySettingsProps {
  defaultCurrency?: string;
}

export function CurrencySettings({ defaultCurrency = "USD" }: CurrencySettingsProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency);
  const [isChanged, setIsChanged] = useState(false);
  
  const handleCurrencyChange = (value: string) => {
    setSelectedCurrency(value);
    setIsChanged(value !== defaultCurrency);
  };
  
  const handleSaveCurrency = () => {
    toast.success(`Currency updated to ${currencies.find(c => c.value === selectedCurrency)?.label}`);
    setIsChanged(false);
  };
  
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
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Example Formats</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded bg-muted/50">
                  <p className="text-muted-foreground mb-1">Positive Amount</p>
                  <p className="font-medium text-green-600">
                    {selectedCurrency === "USD" ? "$1,234.56" : 
                     selectedCurrency === "EUR" ? "€1.234,56" : 
                     selectedCurrency === "GBP" ? "£1,234.56" : 
                     selectedCurrency === "JPY" ? "¥1,235" : 
                     selectedCurrency === "INR" ? "₹1,234.56" : 
                     `${currencies.find(c => c.value === selectedCurrency)?.symbol}1,234.56`}
                  </p>
                </div>
                <div className="p-3 rounded bg-muted/50">
                  <p className="text-muted-foreground mb-1">Negative Amount</p>
                  <p className="font-medium text-red-600">
                    {selectedCurrency === "USD" ? "-$567.89" : 
                     selectedCurrency === "EUR" ? "-€567,89" : 
                     selectedCurrency === "GBP" ? "-£567.89" : 
                     selectedCurrency === "JPY" ? "-¥568" : 
                     selectedCurrency === "INR" ? "-₹567.89" : 
                     `-${currencies.find(c => c.value === selectedCurrency)?.symbol}567.89`}
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
            disabled={!isChanged}
          >
            Save Currency Preference
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default CurrencySettings; 