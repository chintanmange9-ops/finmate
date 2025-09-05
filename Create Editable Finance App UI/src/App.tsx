import React, { useState } from "react";
import { StartPage } from "./components/StartPage";
import { Dashboard } from "./components/Dashboard";
import { AIInsights } from "./components/AIInsights";
import { Transactions } from "./components/Transactions";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { Settings } from "./components/Settings";
import { BottomNavigation } from "./components/BottomNavigation";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TransactionProvider } from "./contexts/TransactionContext";
import { AppSettingsProvider } from "./contexts/AppSettingsContext";
import { TimePeriodProvider } from "./contexts/TimePeriodContext";
import { Toaster } from "./components/ui/sonner";

export type Page =
  | "start"
  | "dashboard"
  | "transactions"
  | "insights"
  | "reports"
  | "settings";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("start");
  const [userSalary, setUserSalary] = useState<number>(0);

  const handleSalarySubmit = (salary: number) => {
    setUserSalary(salary);
    setCurrentPage("dashboard");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "start":
        return (
          <StartPage onSalarySubmit={handleSalarySubmit} />
        );
      case "dashboard":
        return <Dashboard salary={userSalary} />;
      case "insights":
        return <AIInsights />;
      case "transactions":
        return <Transactions />;
      case "reports":
        return <AnalyticsDashboard />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard salary={userSalary} />;
    }
  };

  return (
    <ThemeProvider>
      <AppSettingsProvider>
        <TimePeriodProvider>
          <TransactionProvider>
            <div className="min-h-screen bg-background max-w-md mx-auto relative">
            {/* Status Bar */}
            <div className="bg-card px-4 py-2 flex justify-between items-center border-b">
              <span className="font-medium">2:41</span>
              <div className="flex gap-1">
                <div className="w-4 h-2 bg-foreground rounded-sm"></div>
                <div className="w-4 h-2 bg-foreground rounded-sm"></div>
                <div className="w-4 h-2 bg-foreground rounded-sm"></div>
                <div className="w-4 h-2 bg-foreground rounded-sm"></div>
                <div className="w-2 h-2 bg-foreground rounded-full"></div>
                <div className="w-6 h-2 bg-foreground rounded-sm"></div>
              </div>
            </div>

            {/* Main Content */}
            <div className="pb-20">{renderPage()}</div>

            {/* Bottom Navigation */}
            {currentPage !== "start" && (
              <BottomNavigation
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            )}

            {/* Toast notifications */}
            <Toaster />
            </div>
          </TransactionProvider>
        </TimePeriodProvider>
      </AppSettingsProvider>
    </ThemeProvider>
  );
}