import React, { useState, useEffect } from "react";
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

const currencyData = {
  INR: { symbol: '₹', rate: 1 },
  USD: { symbol: '$', rate: 0.012 },
  EUR: { symbol: '€', rate: 0.011 },
  GBP: { symbol: '£', rate: 0.0095 }
};

export default function App() {
  const [userSalary, setUserSalary] = useState<number>(() => {
    const saved = localStorage.getItem('userSalary');
    return saved ? parseFloat(saved) : 0;
  });
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const saved = localStorage.getItem('userSalary');
    return saved && parseFloat(saved) > 0 ? "dashboard" : "start";
  });

  // Listen for currency change events to convert salary
  useEffect(() => {
    const handleCurrencyChange = (event: CustomEvent) => {
      const { from, to } = event.detail;
      if (userSalary > 0) {
        // Convert salary to new currency
        const inINR = userSalary / (currencyData[from as keyof typeof currencyData]?.rate || 1);
        const converted = inINR * (currencyData[to as keyof typeof currencyData]?.rate || 1);
        
        // Round to 1 decimal place
        const roundedConverted = Math.round(converted * 10) / 10;
        
        setUserSalary(roundedConverted);
        localStorage.setItem('userSalary', roundedConverted.toString());
      }
    };

    window.addEventListener('currencyChange', handleCurrencyChange as EventListener);
    
    return () => {
      window.removeEventListener('currencyChange', handleCurrencyChange as EventListener);
    };
  }, [userSalary]);

  const handleSalarySubmit = (salary: number) => {
    setUserSalary(salary);
    localStorage.setItem('userSalary', salary.toString());
    setCurrentPage("dashboard");
  };

  const updateSalary = (newSalary: number) => {
    setUserSalary(newSalary);
    localStorage.setItem('userSalary', newSalary.toString());
  };

  const clearAllAppData = () => {
    setUserSalary(0);
    localStorage.removeItem('userSalary');
    setCurrentPage("start");
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
        return <Settings userSalary={userSalary} onUpdateSalary={updateSalary} onClearAllData={clearAllAppData} />;
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