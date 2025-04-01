import { Receipt } from "lucide-react";
import { UnderConstruction } from "@/components/dashboard/common/UnderConstruction";
import { DashboardHeader } from "@/components/dashboard";

export default function Bills() {
  return (
    <div className="py-6 lg:py-8">
      <div className="px-4 sm:px-6 lg:px-8">
        <DashboardHeader
          title="Bills"
          description="Track and manage your recurring payments"
          icon={<Receipt className="h-8 w-8 text-primary opacity-85" />}
        />
        
        <div className="mt-8">
          <UnderConstruction
            title="Bills Management Coming Soon"
            description="We're developing a comprehensive bill tracking and payment system to help you stay on top of your expenses."
          />
        </div>
      </div>
    </div>
  );
} 