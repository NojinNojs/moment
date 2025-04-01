import { motion } from "framer-motion";
import {
  CreditCard,
  Landmark,
  Wallet,
  Coins,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import { Asset } from "@/types/assets";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { StatCard } from "@/components/dashboard/overview/cards/StatCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AssetOverviewProps {
  assets: Asset[];
  onAddClick: () => void;
}

export function AssetOverview({ assets, }: AssetOverviewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Calculate totals
  const calculateTotal = () => {
    return assets.reduce((acc, asset) => acc + asset.balance, 0);
  };

  const calculateTypeTotal = (type: string) => {
    return assets
      .filter((asset) => asset.type === type)
      .reduce((acc, asset) => acc + asset.balance, 0);
  };

  // Calculate each category total
  const totalAssets = calculateTotal();
  const totalCash =
    calculateTypeTotal("cash") + calculateTypeTotal("emergency");
  const totalBank = calculateTypeTotal("bank");
  const totalEWallet = calculateTypeTotal("e-wallet");

  // Format currency for display
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (part: number, total: number): string => {
    if (total === 0) return "0%";
    return `${Math.round((part / total) * 100)}%`;
  };

  // Track scroll position for mobile view
  useEffect(() => {
    const handleScroll = () => {
      const scrollArea = scrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLElement | null;

      if (!scrollArea) return;

      const { scrollLeft, scrollWidth, clientWidth } = scrollArea;
      const isStart = scrollLeft < 20;
      const isEnd = scrollLeft + clientWidth >= scrollWidth - 20;

      setIsAtStart(isStart);
      setIsAtEnd(isEnd);

      // Calculate active index
      const cardWidth =
        scrollContainerRef.current?.querySelector("div")?.offsetWidth || 0;
      const gap = 16; // Match with space-x-4
      const cardWithGap = cardWidth + gap;
      const newIndex = Math.round(scrollLeft / cardWithGap);

      setActiveIndex(newIndex);
    };

    const scrollArea = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;

    if (scrollArea) {
      scrollArea.addEventListener("scroll", handleScroll);

      // Initial check
      setTimeout(handleScroll, 100);

      return () => scrollArea.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Scroll to a specific card
  const scrollToCard = (index: number) => {
    const scrollArea = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;

    if (!scrollArea) return;

    const cardWidth =
      scrollContainerRef.current?.querySelector("div")?.offsetWidth || 0;
    const gap = 16; // Match with space-x-4
    const cardWithGap = cardWidth + gap;

    scrollArea.scrollTo({
      left: index * cardWithGap,
      behavior: "smooth",
    });
  };

  // Scroll to next or previous card
  const scrollToNext = () => {
    if (activeIndex < 3) {
      scrollToCard(activeIndex + 1);
    }
  };

  const scrollToPrevious = () => {
    if (activeIndex > 0) {
      scrollToCard(activeIndex - 1);
    }
  };

  // Animation variants
  const cardAnimation = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  };

  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-foreground">
            Asset Summary
          </h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help opacity-70 hover:opacity-100 transition-opacity" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px]">
                <p>Overview of your assets across different categories</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div
          variants={cardAnimation}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.1 }}
        >
          <StatCard
            title="Total Assets"
            value={formatCurrency(totalAssets)}
            icon={Wallet}
            color="blue"
            subtitle="Current balance across all assets"
            className="shadow-md hover:shadow-lg transition-shadow"
          />
        </motion.div>

        <motion.div
          variants={cardAnimation}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.2 }}
        >
          <StatCard
            title="Cash & Emergency"
            value={formatCurrency(totalCash)}
            icon={Coins}
            color="green"
            subtitle={`${formatPercentage(
              totalCash,
              totalAssets
            )} of total assets`}
            trend={{
              value: Math.round((totalCash / totalAssets) * 100) || 0,
              isPositive: true,
            }}
            className="shadow-md hover:shadow-lg transition-shadow"
          />
        </motion.div>

        <motion.div
          variants={cardAnimation}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.3 }}
        >
          <StatCard
            title="Bank Accounts"
            value={formatCurrency(totalBank)}
            icon={Landmark}
            color="cyan"
            subtitle={`${formatPercentage(
              totalBank,
              totalAssets
            )} of total assets`}
            trend={{
              value: Math.round((totalBank / totalAssets) * 100) || 0,
              isPositive: true,
            }}
            className="shadow-md hover:shadow-lg transition-shadow"
          />
        </motion.div>

        <motion.div
          variants={cardAnimation}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.4 }}
        >
          <StatCard
            title="E-Wallets"
            value={formatCurrency(totalEWallet)}
            icon={CreditCard}
            color="purple"
            subtitle={`${formatPercentage(
              totalEWallet,
              totalAssets
            )} of total assets`}
            trend={{
              value: Math.round((totalEWallet / totalAssets) * 100) || 0,
              isPositive: true,
            }}
            className="shadow-md hover:shadow-lg transition-shadow"
          />
        </motion.div>
      </div>

      {/* Mobile view with carousel */}
      <div className="md:hidden relative">
        <ScrollArea className="pb-4" ref={scrollAreaRef}>
          <div
            ref={scrollContainerRef}
            className="flex space-x-4 px-1.5 py-1.5"
          >
            <motion.div
              className="min-w-[85vw] w-[85vw] first:pl-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              whileTap={{ scale: 0.98 }}
            >
              <StatCard
                title="Total Assets"
                value={formatCurrency(totalAssets)}
                icon={Wallet}
                color="blue"
                subtitle="Current balance across all assets"
                className={cn(
                  "shadow-sm transition-all",
                  activeIndex === 0 ? "shadow-md border-primary/20" : ""
                )}
              />
            </motion.div>

            <motion.div
              className="min-w-[85vw] w-[85vw]"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              whileTap={{ scale: 0.98 }}
            >
              <StatCard
                title="Cash & Emergency"
                value={formatCurrency(totalCash)}
                icon={Coins}
                color="green"
                subtitle={`${formatPercentage(
                  totalCash,
                  totalAssets
                )} of total assets`}
                trend={{
                  value: Math.round((totalCash / totalAssets) * 100) || 0,
                  isPositive: true,
                }}
                className={cn(
                  "shadow-sm transition-all",
                  activeIndex === 1 ? "shadow-md border-primary/20" : ""
                )}
              />
            </motion.div>

            <motion.div
              className="min-w-[85vw] w-[85vw]"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              whileTap={{ scale: 0.98 }}
            >
              <StatCard
                title="Bank Accounts"
                value={formatCurrency(totalBank)}
                icon={Landmark}
                color="cyan"
                subtitle={`${formatPercentage(
                  totalBank,
                  totalAssets
                )} of total assets`}
                trend={{
                  value: Math.round((totalBank / totalAssets) * 100) || 0,
                  isPositive: true,
                }}
                className={cn(
                  "shadow-sm transition-all",
                  activeIndex === 2 ? "shadow-md border-primary/20" : ""
                )}
              />
            </motion.div>

            <motion.div
              className="min-w-[85vw] w-[85vw]"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              whileTap={{ scale: 0.98 }}
            >
              <StatCard
                title="E-Wallets"
                value={formatCurrency(totalEWallet)}
                icon={CreditCard}
                color="purple"
                subtitle={`${formatPercentage(
                  totalEWallet,
                  totalAssets
                )} of total assets`}
                trend={{
                  value: Math.round((totalEWallet / totalAssets) * 100) || 0,
                  isPositive: true,
                }}
                className={cn(
                  "shadow-sm transition-all",
                  activeIndex === 3 ? "shadow-md border-primary/20" : ""
                )}
              />
            </motion.div>
          </div>

          <ScrollBar orientation="horizontal" />

          {/* Overlay gradients for scroll indication */}
          {!isAtStart && (
            <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
          )}
          {!isAtEnd && (
            <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
          )}
        </ScrollArea>

        {/* Pagination dots for mobile */}
        <div className="flex items-center justify-center mt-2 mb-1 gap-4">
          <Button
            size="icon"
            variant="outline"
            className={`h-6 w-6 text-foreground border-border rounded-full transition-opacity ${
              isAtStart ? "opacity-50 cursor-not-allowed" : "opacity-100"
            }`}
            onClick={scrollToPrevious}
            disabled={isAtStart}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>

          <div className="flex justify-center gap-1">
            {[0, 1, 2, 3].map((index) => (
              <button
                key={index}
                onClick={() => scrollToCard(index)}
                className={`h-2 rounded-full transition-all duration-200 ${
                  activeIndex === index
                    ? "w-6 bg-primary opacity-80"
                    : "w-2 bg-primary/30 hover:bg-primary/50"
                }`}
                aria-label={`Go to card ${index + 1}`}
              />
            ))}
          </div>

          <Button
            size="icon"
            variant="outline"
            className={`h-6 w-6 text-foreground border-border rounded-full transition-opacity ${
              isAtEnd ? "opacity-50 cursor-not-allowed" : "opacity-100"
            }`}
            onClick={scrollToNext}
            disabled={isAtEnd}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
