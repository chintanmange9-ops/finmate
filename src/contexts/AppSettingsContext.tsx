import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';

export interface BudgetReminder {
  id: string;
  category: string;
  amount: number;
  period: 'weekly' | 'monthly';
  isActive: boolean;
  created: Date;
}

export interface BudgetGoal {
  category: string;
  amount: number;
  isActive: boolean;
}

export interface GoalTarget {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  isActive: boolean;
}

interface AppSettingsContextType {
  // Currency
  currency: string;
  setCurrency: (currency: string, convertExistingData?: boolean) => void;
  formatAmount: (amount: number) => string;
  getCurrencySymbol: () => string;
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => number;
  
  // Budget Reminders
  budgetReminders: BudgetReminder[];
  addBudgetReminder: (reminder: Omit<BudgetReminder, 'id' | 'created'>) => void;
  removeBudgetReminder: (id: string) => void;
  toggleBudgetReminder: (id: string) => void;
  
  // Budget Goals
  budgetGoals: BudgetGoal[];
  updateBudgetGoals: (goals: BudgetGoal[]) => void;
  getBudgetGoal: (category: string) => BudgetGoal | undefined;
  
  // Savings Target
  savingsTarget: number;
  setSavingsTarget: (target: number) => void;
  
  // General Goals/Targets
  goalTargets: GoalTarget[];
  addGoalTarget: (goal: Omit<GoalTarget, 'id'>) => void;
  updateGoalTarget: (id: string, updates: Partial<GoalTarget>) => void;
  removeGoalTarget: (id: string) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

const currencyData = {
  INR: { symbol: '₹', rate: 1 },
  USD: { symbol: '$', rate: 0.012 },
  EUR: { symbol: '€', rate: 0.011 },
  GBP: { symbol: '£', rate: 0.0095 }
};

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState('INR');
  const [lastCurrency, setLastCurrency] = useState('INR'); // Track previous currency for conversion
  const [budgetReminders, setBudgetReminders] = useState<BudgetReminder[]>([]);
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([
    { category: 'Food', amount: 15000, isActive: true },
    { category: 'Transport', amount: 5000, isActive: true },
    { category: 'Shopping', amount: 10000, isActive: true },
    { category: 'Entertainment', amount: 3000, isActive: true }
  ]);
  const [savingsTarget, setSavingsTargetState] = useState(15000);
  const [goalTargets, setGoalTargets] = useState<GoalTarget[]>([
    {
      id: '1',
      name: 'Emergency Fund',
      targetAmount: 100000,
      currentAmount: 35000,
      deadline: new Date('2024-12-31'),
      isActive: true
    },
    {
      id: '2',
      name: 'Vacation Fund',
      targetAmount: 50000,
      currentAmount: 12000,
      deadline: new Date('2024-06-15'),
      isActive: true
    }
  ]);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.currency) {
          setCurrencyState(settings.currency);
          setLastCurrency(settings.lastCurrency || settings.currency);
        }
        if (settings.budgetReminders) setBudgetReminders(settings.budgetReminders.map((r: any) => ({
          ...r,
          created: new Date(r.created)
        })));
        if (settings.budgetGoals) setBudgetGoals(settings.budgetGoals);
        if (settings.savingsTarget) setSavingsTargetState(settings.savingsTarget);
        if (settings.goalTargets) setGoalTargets(settings.goalTargets.map((g: any) => ({
          ...g,
          deadline: new Date(g.deadline)
        })));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const settings = {
      currency,
      lastCurrency,
      budgetReminders,
      budgetGoals,
      savingsTarget,
      goalTargets
    };
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [currency, lastCurrency, budgetReminders, budgetGoals, savingsTarget, goalTargets]);

  const convertAmount = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;
    
    // Convert to base currency (INR) first
    const inINR = amount / (currencyData[fromCurrency as keyof typeof currencyData]?.rate || 1);
    // Then convert to target currency
    const converted = inINR * (currencyData[toCurrency as keyof typeof currencyData]?.rate || 1);
    
    // Round to 1 decimal place
    return Math.round(converted * 10) / 10;
  };

  const setCurrency = (newCurrency: string, convertExistingData = true) => {
    if (convertExistingData && newCurrency !== currency) {
      // Trigger data conversion in other contexts via custom event
      const event = new CustomEvent('currencyChange', {
        detail: { from: currency, to: newCurrency }
      });
      window.dispatchEvent(event);
      
      // Convert budget goals
      setBudgetGoals(prev => prev.map(goal => ({
        ...goal,
        amount: convertAmount(goal.amount, currency, newCurrency)
      })));
      
      // Convert savings target
      setSavingsTargetState(prev => convertAmount(prev, currency, newCurrency));
      
      // Convert goal targets
      setGoalTargets(prev => prev.map(goal => ({
        ...goal,
        targetAmount: convertAmount(goal.targetAmount, currency, newCurrency),
        currentAmount: convertAmount(goal.currentAmount, currency, newCurrency)
      })));
      
      setLastCurrency(currency);
    }
    
    setCurrencyState(newCurrency);
    toast.success(`Currency changed to ${newCurrency}`);
  };

  const formatAmount = (amount: number): string => {
    // After conversion, amounts are already in the correct currency, so no need to convert again
    const symbol = getCurrencySymbol();
    
    // Format all amounts with exactly 1 decimal place
    return `${symbol}${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 1, 
      maximumFractionDigits: 1 
    })}`;
  };

  const getCurrencySymbol = (): string => {
    return currencyData[currency as keyof typeof currencyData]?.symbol || '₹';
  };

  const addBudgetReminder = (reminder: Omit<BudgetReminder, 'id' | 'created'>) => {
    const newReminder: BudgetReminder = {
      ...reminder,
      id: Date.now().toString(),
      created: new Date()
    };
    setBudgetReminders(prev => [...prev, newReminder]);
    toast.success('Budget reminder added successfully!');
  };

  const removeBudgetReminder = (id: string) => {
    setBudgetReminders(prev => prev.filter(r => r.id !== id));
    toast.success('Budget reminder removed');
  };

  const toggleBudgetReminder = (id: string) => {
    setBudgetReminders(prev => prev.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const updateBudgetGoals = (goals: BudgetGoal[]) => {
    setBudgetGoals(goals);
    toast.success('Budget goals updated successfully!');
  };

  const getBudgetGoal = (category: string): BudgetGoal | undefined => {
    return budgetGoals.find(goal => goal.category === category);
  };

  const setSavingsTarget = (target: number) => {
    setSavingsTargetState(target);
    toast.success('Savings target updated successfully!');
  };

  const addGoalTarget = (goal: Omit<GoalTarget, 'id'>) => {
    const newGoal: GoalTarget = {
      ...goal,
      id: Date.now().toString()
    };
    setGoalTargets(prev => [...prev, newGoal]);
    toast.success('Goal added successfully!');
  };

  const updateGoalTarget = (id: string, updates: Partial<GoalTarget>) => {
    setGoalTargets(prev => prev.map(goal => 
      goal.id === id ? { ...goal, ...updates } : goal
    ));
    toast.success('Goal updated successfully!');
  };

  const removeGoalTarget = (id: string) => {
    setGoalTargets(prev => prev.filter(goal => goal.id !== id));
    toast.success('Goal removed successfully!');
  };

  return (
    <AppSettingsContext.Provider value={{
      currency,
      setCurrency,
      formatAmount,
      getCurrencySymbol,
      convertAmount,
      budgetReminders,
      addBudgetReminder,
      removeBudgetReminder,
      toggleBudgetReminder,
      budgetGoals,
      updateBudgetGoals,
      getBudgetGoal,
      savingsTarget,
      setSavingsTarget,
      goalTargets,
      addGoalTarget,
      updateGoalTarget,
      removeGoalTarget
    }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
}