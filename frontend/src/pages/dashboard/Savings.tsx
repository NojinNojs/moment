import { PiggyBank } from "lucide-react";
import { UnderConstruction } from "@/components/dashboard/common/UnderConstruction";
import { DashboardHeader } from "@/components/dashboard";

export default function Savings() {
  return (
    <div className="py-6 lg:py-8">
      <div className="px-4 sm:px-6 lg:px-8">
        <DashboardHeader
          title="Savings"
          description="Plan and track your savings goals"
          icon={<PiggyBank className="h-8 w-8 text-primary opacity-85" />}
        />
        
        <div className="mt-8">
          <UnderConstruction
            title="Savings Planning Coming Soon"
            description="We're building a powerful savings system to help you manage your finances and achieve your financial goals."
          />
        </div>
      </div>
    </div>
  );
} 