import { BarChart3 } from "lucide-react";
import { UnderConstruction } from "@/components/dashboard/common/UnderConstruction";
import { DashboardHeader } from "@/components/dashboard";

export default function Reports() {
  return (
    <div className="py-6 lg:py-8">
      <div className="px-4 sm:px-6 lg:px-8">
        <DashboardHeader
          title="Reports"
          description="Analyze your financial performance and trends"
          icon={<BarChart3 className="h-8 w-8 text-primary opacity-85" />}
        />
        
        <div className="mt-8">
          <UnderConstruction
            title="Reports Coming Soon"
            description="We're building powerful financial reporting tools to help you understand your money better."
          />
        </div>
      </div>
    </div>
  );
} 