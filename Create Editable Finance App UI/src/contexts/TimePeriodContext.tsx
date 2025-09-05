import React, { createContext, useContext, useState, ReactNode } from 'react';

export type TimePeriod = 'weekly' | 'monthly' | 'half-yearly' | 'yearly';

interface TimePeriodContextType {
  timePeriod: TimePeriod;
  setTimePeriod: (period: TimePeriod) => void;
  getPeriodLabel: () => string;
  getSavingsGoalLabel: () => string;
}

const TimePeriodContext = createContext<TimePeriodContextType | undefined>(undefined);

export function TimePeriodProvider({ children }: { children: ReactNode }) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');

  const getPeriodLabel = () => {
    switch (timePeriod) {
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
      case 'half-yearly': return 'This Half Year';
      case 'yearly': return 'This Year';
      default: return 'This Month';
    }
  };

  const getSavingsGoalLabel = () => {
    switch (timePeriod) {
      case 'weekly': return 'Weekly Savings Goal';
      case 'monthly': return 'Monthly Savings Goal';
      case 'half-yearly': return 'Half-Yearly Savings Goal';
      case 'yearly': return 'Yearly Savings Goal';
      default: return 'Monthly Savings Goal';
    }
  };

  return (
    <TimePeriodContext.Provider value={{
      timePeriod,
      setTimePeriod,
      getPeriodLabel,
      getSavingsGoalLabel
    }}>
      {children}
    </TimePeriodContext.Provider>
  );
}

export function useTimePeriod() {
  const context = useContext(TimePeriodContext);
  if (!context) {
    throw new Error('useTimePeriod must be used within a TimePeriodProvider');
  }
  return context;
}