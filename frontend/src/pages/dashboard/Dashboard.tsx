import { useEffect, useState, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  DollarSign, 
  PieChart, 
  ArrowRight,
  Clock,
  TrendingUp,
  BadgeDollarSign,
  CreditCard,
  Receipt
} from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-utils";
import { BottomBar, DashboardSidebar } from "@/components/dashboard";
import { SidebarContext } from "@/components/dashboard/DashboardSidebar";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  // Initialize with default state - will be controlled by the sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Check screen size for responsive layout
  useLayoutEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Dummy data for the dashboard
  const dummyData = {
    balance: 12450.75,
    income: 3200.00,
    expenses: 1845.25,
    savings: 1355.50,
    recentTransactions: [
      { id: 1, title: "Grocery Shopping", amount: -125.30, date: "2023-10-15", category: "Food" },
      { id: 2, title: "Salary Deposit", amount: 3200.00, date: "2023-10-10", category: "Income" },
      { id: 3, title: "Electricity Bill", amount: -85.40, date: "2023-10-08", category: "Utilities" },
      { id: 4, title: "Freelance Payment", amount: 450.00, date: "2023-10-05", category: "Income" }
    ],
    upcomingBills: [
      { id: 1, title: "Rent", amount: 1200.00, dueDate: "2023-10-31" },
      { id: 2, title: "Internet", amount: 59.99, dueDate: "2023-10-25" },
      { id: 3, title: "Phone Bill", amount: 45.00, dueDate: "2023-10-22" }
    ]
  };

  if (!user) {
    return null; // Or a loading spinner
  }

  return (
    <SidebarContext.Provider value={{ open: sidebarOpen, setOpen: setSidebarOpen }}>
      <div className="min-h-screen bg-background pb-16 lg:pb-0">
        <DashboardSidebar />
        {/* Use className for base styles and inline style for dynamic padding */}
        <main 
          className="transition-all duration-300"
          style={{
            paddingLeft: isLargeScreen ? (sidebarOpen ? "18rem" : "5rem") : "0"
          }}
        >
          <div className="py-6 lg:py-8">
            <div className="px-4 sm:px-6 lg:px-8">
              {/* Welcome Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-xl text-muted-foreground mt-1">
                  Welcome back, {user.name}
                </p>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-8">
                <Button className="bg-primary/90 hover:bg-primary gap-2">
                  <Plus size={18} />
                  <span>New Transaction</span>
                </Button>
                <Button variant="outline" className="gap-2">
                  <ArrowUpRight size={18} className="text-green-500" />
                  <span>Income</span>
                </Button>
                <Button variant="outline" className="gap-2">
                  <ArrowDownRight size={18} className="text-red-500" />
                  <span>Expense</span>
                </Button>
                <Button variant="outline" className="gap-2">
                  <Calendar size={18} />
                  <span>Budget Plan</span>
                </Button>
              </div>

              {/* Financial Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      Total Balance
                      <DollarSign className="h-5 w-5 text-primary" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">${dummyData.balance.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Updated today</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      Income
                      <ArrowUpRight className="h-5 w-5 text-green-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">${dummyData.income.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">This month</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      Expenses
                      <ArrowDownRight className="h-5 w-5 text-red-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">${dummyData.expenses.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">This month</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      Savings
                      <PieChart className="h-5 w-5 text-blue-500" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">${dummyData.savings.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">This month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Main Dashboard Content - 2 columns on larger screens */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Recent Transactions */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>Your latest financial activities</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1">
                        View All <ArrowRight size={16} />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dummyData.recentTransactions.map(transaction => (
                          <div key={transaction.id} className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${
                                transaction.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                              }`}>
                                {transaction.amount > 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                              </div>
                              <div>
                                <p className="font-medium">{transaction.title}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock size={12} />
                                  <span>{transaction.date}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {transaction.category}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <p className={`font-bold ${
                              transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD'
                              })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <Button variant="outline" className="w-full">
                        Add New Transaction
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Financial Snapshot */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Financial Snapshot</CardTitle>
                      <CardDescription>Monthly spend vs budget overview</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[200px] flex items-center justify-center border-2 border-dashed border-border rounded-md">
                      <p className="text-muted-foreground">Chart placeholder - Spend vs Budget</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Other Widgets */}
                <div className="space-y-6">
                  {/* Shortcuts Widget */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Shortcuts</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center">
                        <TrendingUp size={24} className="text-primary" />
                        <span className="text-sm">Investments</span>
                      </Button>
                      <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center">
                        <BadgeDollarSign size={24} className="text-primary" />
                        <span className="text-sm">Budget</span>
                      </Button>
                      <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center">
                        <CreditCard size={24} className="text-primary" />
                        <span className="text-sm">Cards</span>
                      </Button>
                      <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center">
                        <Receipt size={24} className="text-primary" />
                        <span className="text-sm">Bills</span>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Upcoming Bills */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Upcoming Bills</CardTitle>
                      <CardDescription>Bills due this month</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dummyData.upcomingBills.map(bill => (
                          <div key={bill.id} className="flex items-center justify-between border-b border-border pb-3">
                            <div>
                              <p className="font-medium">{bill.title}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar size={12} />
                                <span>Due: {bill.dueDate}</span>
                              </div>
                            </div>
                            <p className="font-bold">${bill.amount.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <Button variant="outline" className="w-full">
                        View All Bills
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Tips Widget */}
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-primary">Money Tip</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        Try the 50/30/20 rule: Spend 50% of income on needs, 30% on wants, and save 20% for future goals.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>
        <BottomBar />
      </div>
    </SidebarContext.Provider>
  );
} 