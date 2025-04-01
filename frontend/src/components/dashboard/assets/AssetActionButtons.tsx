import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { PlusCircle, ArrowLeftRight, LineChart } from "lucide-react";
import { Link } from "react-router-dom";

interface AssetActionButtonsProps {
  onAddClick: () => void;
  onTransferClick: () => void;
}

export function AssetActionButtons({
  onAddClick,
  onTransferClick,
}: AssetActionButtonsProps) {
  return (
    <motion.div
      className="flex flex-col md:flex-row gap-3 mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <Button className="flex-1 gap-2" onClick={onAddClick}>
        <PlusCircle className="h-4 w-4" />
        Add New Asset
      </Button>

      <Button
        variant="outline"
        className="flex-1 gap-2"
        onClick={onTransferClick}
      >
        <ArrowLeftRight className="h-4 w-4" />
        Transfer Between Assets
      </Button>

      <Button variant="secondary" className="flex-1 gap-2" asChild>
        <Link to="/dashboard/reports">
          <LineChart className="h-4 w-4" />
          View Reports
        </Link>
      </Button>
    </motion.div>
  );
}
