import { useRef, useState, useEffect } from "react";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/overview/cards/StatCard";
import useCurrencyFormat from "@/hooks/useCurrencyFormat";

// Animation variants
const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.4 }
};

interface TransactionOverviewProps {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  incomeTrend: { value: number; isPositive: boolean };
  expensesTrend: { value: number; isPositive: boolean };
  netTrend: { value: number; isPositive: boolean };
}

export function TransactionOverview({
  totalIncome,
  totalExpenses,
  netAmount,
  incomeTrend,
  expensesTrend,
  netTrend
}: TransactionOverviewProps) {
  // Use the currency format hook
  const { formatCurrency } = useCurrencyFormat();

  // Refs for carousel
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isInitialRender = useRef(true);
  const frameIdRef = useRef<number | null>(null);
  const scrollPositionRef = useRef({
    isAtStart: true,
    isAtEnd: false,
    activeIndex: 0,
  });
  
  // Track if we're currently scrolling to prevent duplicate updates
  const isScrollingRef = useRef(false);

  // State for carousel
  const [scrollIndicators, setScrollIndicators] = useState({
    isAtStart: true,
    isAtEnd: false,
    activeIndex: 0,
  });

  // Function to handle scroll events
  const handleScroll = useRef(() => {
    const scrollContainer = scrollContainerRef.current;
    const scrollArea = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;

    if (scrollContainer && scrollArea) {
      const { scrollLeft } = scrollArea;
      const cardWidth = scrollContainer.querySelector("div")?.offsetWidth || 0;
      const gap = 16; // Matches the space-x-4
      const cardWithGap = cardWidth + gap;

      // Calculate active index based on scroll position
      const activeIndex = Math.min(Math.round(scrollLeft / cardWithGap), 2);
      const isAtStart = scrollLeft < 20;
      const isAtEnd = activeIndex >= 2;

      if (
        scrollPositionRef.current.isAtStart !== isAtStart ||
        scrollPositionRef.current.isAtEnd !== isAtEnd ||
        scrollPositionRef.current.activeIndex !== activeIndex
      ) {
        // Update ref without triggering re-renders
        scrollPositionRef.current = { isAtStart, isAtEnd, activeIndex };

        // Update UI state
        setScrollIndicators({ isAtStart, isAtEnd, activeIndex });
      }
    }
  }).current;

  // Set up scroll event listener with better touch support
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    let scrollArea: HTMLElement | null = null;
    let touchStartX = 0;
    let scrollTimeout: NodeJS.Timeout | null = null;

    // Enhanced scroll handler with debounce
    const enhancedScrollHandler = () => {
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
      }

      // Track scroll position even during momentum scrolling
      frameIdRef.current = requestAnimationFrame(() => {
        handleScroll();
        frameIdRef.current = null;
        
        // Continue monitoring during momentum scrolling
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          handleScroll(); // Check once more after scrolling stops
          isScrollingRef.current = false;
        }, 100);
      });
    };

    // Touch event handlers
    const handleTouchStart = (e: TouchEvent) => {
      if (!scrollArea) return;
      
      isScrollingRef.current = true;
      touchStartX = e.touches[0].clientX;
      
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isScrollingRef.current || !scrollArea) return;
      
      // Update while dragging for smoother feedback
      if (Math.abs(e.touches[0].clientX - touchStartX) > 10) {
        enhancedScrollHandler();
      }
    };

    const handleTouchEnd = () => {
      if (!isScrollingRef.current || !scrollArea) return;
      
      // Schedule multiple checks to catch the end of momentum scrolling
      const checkPositionMultipleTimes = () => {
        handleScroll();
        
        // Check again after short intervals to catch momentum scrolling
        setTimeout(handleScroll, 100);
        setTimeout(handleScroll, 300);
        setTimeout(() => {
          handleScroll();
          isScrollingRef.current = false;
        }, 500);
      };
      
      checkPositionMultipleTimes();
    };

    // Find the scroll area and attach event listeners
    const setupScrollListeners = () => {
      const viewport = scrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLElement | null;

      if (viewport) {
        scrollArea = viewport;
        scrollArea.addEventListener("scroll", enhancedScrollHandler, { passive: true });
        scrollArea.addEventListener("touchstart", handleTouchStart, { passive: true });
        scrollArea.addEventListener("touchmove", handleTouchMove, { passive: true });
        scrollArea.addEventListener("touchend", handleTouchEnd, { passive: true });

        // Initial check
        setTimeout(handleScroll, 100);
      }
    };

    setupScrollListeners();

    // Clean up
    return () => {
      if (scrollArea) {
        scrollArea.removeEventListener("scroll", enhancedScrollHandler);
        scrollArea.removeEventListener("touchstart", handleTouchStart);
        scrollArea.removeEventListener("touchmove", handleTouchMove);
        scrollArea.removeEventListener("touchend", handleTouchEnd);
      }

      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }

      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [handleScroll]);

  // Function to scroll to a specific card
  const scrollToCard = (index: number) => {
    const scrollArea = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;
    const scrollContainer = scrollContainerRef.current;

    if (scrollArea && scrollContainer) {
      isScrollingRef.current = true;
      
      const viewportWidth = scrollArea.offsetWidth;
      const cardWidth = scrollContainer.querySelector("div")?.offsetWidth || 0;
      const gap = 16;

      // Calculate position that centers the card
      const cardWithGap = cardWidth + gap;
      const leftOffset = (viewportWidth - cardWidth) / 2;
      const scrollPos = index * cardWithGap - leftOffset;

      // Use scrollTo with smooth behavior
      scrollArea.scrollTo({
        left: Math.max(0, scrollPos),
        behavior: "smooth",
      });

      // Update ref directly
      scrollPositionRef.current = {
        activeIndex: index,
        isAtStart: index === 0,
        isAtEnd: index === 2,
      };

      // Update UI state immediately for better responsiveness
      setScrollIndicators({
        activeIndex: index,
        isAtStart: index === 0,
        isAtEnd: index === 2,
      });
      
      // Reset the scrolling flag after animation completes
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 500);
    }
  };

  // Scroll handlers
  const scrollLeft = () => {
    if (scrollPositionRef.current.activeIndex > 0) {
      scrollToCard(scrollPositionRef.current.activeIndex - 1);
    }
  };

  const scrollRight = () => {
    if (scrollPositionRef.current.activeIndex < 2) {
      scrollToCard(scrollPositionRef.current.activeIndex + 1);
    }
  };

  return (
    <>
      {/* Stat Cards - Desktop: Grid View */}
      <div className="hidden md:block mb-8">
        <motion.div 
          className="grid grid-cols-3 gap-4"
          {...slideUp}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <StatCard
            title="Net Balance"
            value={netAmount}
            formatter={formatCurrency}
            icon={Wallet}
            color="blue"
            trend={netTrend}
          />

          <StatCard
            title="Total Income"
            value={totalIncome}
            formatter={formatCurrency}
            icon={ArrowUpRight}
            color="green"
            trend={incomeTrend}
          />

          <StatCard
            title="Total Expenses"
            value={totalExpenses}
            formatter={formatCurrency}
            icon={ArrowDownRight}
            color="red"
            trend={expensesTrend}
          />
        </motion.div>
      </div>

      {/* Stat Cards - Mobile: Carousel with improved swipe detection */}
      <motion.div
        className="md:hidden mb-8 relative"
        {...fadeIn}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            Financial Overview
          </h2>
        </div>

        <div className="relative">
          <ScrollArea className="pb-4" ref={scrollAreaRef}>
            <div
              ref={scrollContainerRef}
              className="flex space-x-4 px-4 py-1"
            >
              <motion.div
                className="min-w-[80vw] w-[80vw] first:ml-0 h-[135px]"
                {...slideUp}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <StatCard
                  title="Net Balance"
                  value={netAmount}
                  formatter={formatCurrency}
                  icon={Wallet}
                  color="blue"
                  trend={netTrend}
                  onClick={() => scrollToCard(0)}
                />
              </motion.div>

              <motion.div
                className="min-w-[80vw] w-[80vw] h-[135px]"
                {...slideUp}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                <StatCard
                  title="Total Income"
                  value={totalIncome}
                  formatter={formatCurrency}
                  icon={ArrowUpRight}
                  color="green"
                  trend={incomeTrend}
                  onClick={() => scrollToCard(1)}
                />
              </motion.div>

              <motion.div
                className="min-w-[80vw] w-[80vw] h-[135px]"
                {...slideUp}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <StatCard
                  title="Total Expenses"
                  value={totalExpenses}
                  formatter={formatCurrency}
                  icon={ArrowDownRight}
                  color="red"
                  trend={expensesTrend}
                  onClick={() => scrollToCard(2)}
                />
              </motion.div>
            </div>

            <ScrollBar orientation="horizontal" />

            {/* Overlay gradients for scroll indication */}
            {!scrollIndicators.isAtStart && (
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
            )}
            {!scrollIndicators.isAtEnd && (
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
            )}
          </ScrollArea>

          {/* Pagination dots for mobile - now more responsive to swipe */}
          <motion.div
            className="flex items-center justify-center mt-3 gap-4"
            {...fadeIn}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <Button
              size="icon"
              variant="outline"
              className={`h-6 w-6 text-foreground border-border rounded-full ${
                scrollIndicators.isAtStart
                  ? "opacity-50 cursor-not-allowed"
                  : "opacity-100"
              }`}
              onClick={scrollLeft}
              disabled={scrollIndicators.isAtStart}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>

            <div className="flex justify-center gap-1">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  onClick={() => scrollToCard(index)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    scrollIndicators.activeIndex === index
                      ? "w-6 bg-primary opacity-70"
                      : "w-1.5 bg-primary/30 hover:bg-primary/50"
                  }`}
                  aria-label={`Go to card ${index + 1}`}
                />
              ))}
            </div>

            <Button
              size="icon"
              variant="outline"
              className={`h-6 w-6 text-foreground border-border rounded-full ${
                scrollIndicators.isAtEnd
                  ? "opacity-50 cursor-not-allowed"
                  : "opacity-100"
              }`}
              onClick={scrollRight}
              disabled={scrollIndicators.isAtEnd}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}

export default TransactionOverview; 