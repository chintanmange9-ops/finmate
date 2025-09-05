import { Transaction } from '../contexts/TransactionContext';

export interface TimeBasedAnalytics {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
  topCategories: CategorySummary[];
  averageDaily: number;
  savingsRate: number;
}

export interface CategorySummary {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface MonthlyComparison {
  current: TimeBasedAnalytics;
  previous: TimeBasedAnalytics;
  growth: {
    income: number;
    expenses: number;
    savings: number;
  };
}

export class AnalyticsEngine {
  private transactions: Transaction[];

  constructor(transactions: Transaction[]) {
    this.transactions = transactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  // Get transactions for a specific time period
  private getTransactionsInPeriod(startDate: Date, endDate: Date): Transaction[] {
    return this.transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }

  // Calculate analytics for a given period
  private calculatePeriodAnalytics(
    transactions: Transaction[], 
    periodName: string, 
    days: number
  ): TimeBasedAnalytics {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netAmount = income - expenses;
    const savingsRate = income > 0 ? (netAmount / income) * 100 : 0;
    const averageDaily = expenses / days;

    // Category analysis
    const categoryMap = new Map<string, { amount: number; count: number }>();
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const existing = categoryMap.get(t.category) || { amount: 0, count: 0 };
        categoryMap.set(t.category, {
          amount: existing.amount + Math.abs(t.amount),
          count: existing.count + 1
        });
      });

    const topCategories: CategorySummary[] = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: expenses > 0 ? (data.amount / expenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      period: periodName,
      totalIncome: income,
      totalExpenses: expenses,
      netAmount,
      transactionCount: transactions.length,
      topCategories,
      averageDaily,
      savingsRate
    };
  }

  // Weekly analytics
  getWeeklyAnalytics(): TimeBasedAnalytics {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weeklyTransactions = this.getTransactionsInPeriod(startOfWeek, endOfWeek);
    return this.calculatePeriodAnalytics(weeklyTransactions, 'This Week', 7);
  }

  // Monthly analytics
  getMonthlyAnalytics(): TimeBasedAnalytics {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const monthlyTransactions = this.getTransactionsInPeriod(startOfMonth, endOfMonth);
    const daysInMonth = endOfMonth.getDate();
    
    return this.calculatePeriodAnalytics(monthlyTransactions, 'This Month', daysInMonth);
  }

  // Half-yearly analytics
  getHalfYearlyAnalytics(): TimeBasedAnalytics {
    const now = new Date();
    const startOfHalfYear = new Date(now.getFullYear(), Math.floor(now.getMonth() / 6) * 6, 1);
    const endOfHalfYear = new Date(now.getFullYear(), Math.floor(now.getMonth() / 6) * 6 + 6, 0);
    endOfHalfYear.setHours(23, 59, 59, 999);

    const halfYearlyTransactions = this.getTransactionsInPeriod(startOfHalfYear, endOfHalfYear);
    const days = Math.ceil((endOfHalfYear.getTime() - startOfHalfYear.getTime()) / (1000 * 60 * 60 * 24));
    
    return this.calculatePeriodAnalytics(halfYearlyTransactions, 'This Half Year', days);
  }

  // Annual analytics
  getAnnualAnalytics(): TimeBasedAnalytics {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    endOfYear.setHours(23, 59, 59, 999);

    const annualTransactions = this.getTransactionsInPeriod(startOfYear, endOfYear);
    const isLeapYear = now.getFullYear() % 4 === 0;
    const daysInYear = isLeapYear ? 366 : 365;
    
    return this.calculatePeriodAnalytics(annualTransactions, 'This Year', daysInYear);
  }

  // Monthly comparison (current vs previous)
  getMonthlyComparison(): MonthlyComparison {
    const now = new Date();
    
    // Current month
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfCurrentMonth.setHours(23, 59, 59, 999);
    
    // Previous month
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    endOfPreviousMonth.setHours(23, 59, 59, 999);

    const currentTransactions = this.getTransactionsInPeriod(startOfCurrentMonth, endOfCurrentMonth);
    const previousTransactions = this.getTransactionsInPeriod(startOfPreviousMonth, endOfPreviousMonth);

    const current = this.calculatePeriodAnalytics(
      currentTransactions, 
      'Current Month', 
      endOfCurrentMonth.getDate()
    );
    
    const previous = this.calculatePeriodAnalytics(
      previousTransactions, 
      'Previous Month', 
      endOfPreviousMonth.getDate()
    );

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      current,
      previous,
      growth: {
        income: calculateGrowth(current.totalIncome, previous.totalIncome),
        expenses: calculateGrowth(current.totalExpenses, previous.totalExpenses),
        savings: calculateGrowth(current.netAmount, previous.netAmount)
      }
    };
  }

  // Weekly comparison (current vs previous)
  getWeeklyComparison(): MonthlyComparison {
    const now = new Date();
    
    // Current week
    const startOfCurrentWeek = new Date(now);
    startOfCurrentWeek.setDate(now.getDate() - now.getDay());
    startOfCurrentWeek.setHours(0, 0, 0, 0);
    
    const endOfCurrentWeek = new Date(startOfCurrentWeek);
    endOfCurrentWeek.setDate(startOfCurrentWeek.getDate() + 6);
    endOfCurrentWeek.setHours(23, 59, 59, 999);
    
    // Previous week
    const startOfPreviousWeek = new Date(startOfCurrentWeek);
    startOfPreviousWeek.setDate(startOfCurrentWeek.getDate() - 7);
    
    const endOfPreviousWeek = new Date(startOfPreviousWeek);
    endOfPreviousWeek.setDate(startOfPreviousWeek.getDate() + 6);
    endOfPreviousWeek.setHours(23, 59, 59, 999);

    const currentTransactions = this.getTransactionsInPeriod(startOfCurrentWeek, endOfCurrentWeek);
    const previousTransactions = this.getTransactionsInPeriod(startOfPreviousWeek, endOfPreviousWeek);

    const current = this.calculatePeriodAnalytics(currentTransactions, 'Current Week', 7);
    const previous = this.calculatePeriodAnalytics(previousTransactions, 'Previous Week', 7);

    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      current,
      previous,
      growth: {
        income: calculateGrowth(current.totalIncome, previous.totalIncome),
        expenses: calculateGrowth(current.totalExpenses, previous.totalExpenses),
        savings: calculateGrowth(current.netAmount, previous.netAmount)
      }
    };
  }

  // Half-yearly comparison (current vs previous)
  getHalfYearlyComparison(): MonthlyComparison {
    const now = new Date();
    
    // Current half-year
    const currentHalfStart = Math.floor(now.getMonth() / 6) * 6;
    const startOfCurrentHalf = new Date(now.getFullYear(), currentHalfStart, 1);
    const endOfCurrentHalf = new Date(now.getFullYear(), currentHalfStart + 6, 0);
    endOfCurrentHalf.setHours(23, 59, 59, 999);
    
    // Previous half-year
    const prevHalfStart = currentHalfStart - 6;
    const startOfPreviousHalf = new Date(
      prevHalfStart < 0 ? now.getFullYear() - 1 : now.getFullYear(),
      prevHalfStart < 0 ? prevHalfStart + 12 : prevHalfStart,
      1
    );
    const endOfPreviousHalf = new Date(
      prevHalfStart < 0 ? now.getFullYear() - 1 : now.getFullYear(),
      (prevHalfStart < 0 ? prevHalfStart + 12 : prevHalfStart) + 6,
      0
    );
    endOfPreviousHalf.setHours(23, 59, 59, 999);

    const currentTransactions = this.getTransactionsInPeriod(startOfCurrentHalf, endOfCurrentHalf);
    const previousTransactions = this.getTransactionsInPeriod(startOfPreviousHalf, endOfPreviousHalf);

    const currentDays = Math.ceil((endOfCurrentHalf.getTime() - startOfCurrentHalf.getTime()) / (1000 * 60 * 60 * 24));
    const previousDays = Math.ceil((endOfPreviousHalf.getTime() - startOfPreviousHalf.getTime()) / (1000 * 60 * 60 * 24));

    const current = this.calculatePeriodAnalytics(currentTransactions, 'Current Half Year', currentDays);
    const previous = this.calculatePeriodAnalytics(previousTransactions, 'Previous Half Year', previousDays);

    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      current,
      previous,
      growth: {
        income: calculateGrowth(current.totalIncome, previous.totalIncome),
        expenses: calculateGrowth(current.totalExpenses, previous.totalExpenses),
        savings: calculateGrowth(current.netAmount, previous.netAmount)
      }
    };
  }

  // Yearly comparison (current vs previous)
  getYearlyComparison(): MonthlyComparison {
    const now = new Date();
    
    // Current year
    const startOfCurrentYear = new Date(now.getFullYear(), 0, 1);
    const endOfCurrentYear = new Date(now.getFullYear(), 11, 31);
    endOfCurrentYear.setHours(23, 59, 59, 999);
    
    // Previous year
    const startOfPreviousYear = new Date(now.getFullYear() - 1, 0, 1);
    const endOfPreviousYear = new Date(now.getFullYear() - 1, 11, 31);
    endOfPreviousYear.setHours(23, 59, 59, 999);

    const currentTransactions = this.getTransactionsInPeriod(startOfCurrentYear, endOfCurrentYear);
    const previousTransactions = this.getTransactionsInPeriod(startOfPreviousYear, endOfPreviousYear);

    const currentIsLeapYear = now.getFullYear() % 4 === 0;
    const previousIsLeapYear = (now.getFullYear() - 1) % 4 === 0;
    const currentDays = currentIsLeapYear ? 366 : 365;
    const previousDays = previousIsLeapYear ? 366 : 365;

    const current = this.calculatePeriodAnalytics(currentTransactions, 'Current Year', currentDays);
    const previous = this.calculatePeriodAnalytics(previousTransactions, 'Previous Year', previousDays);

    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      current,
      previous,
      growth: {
        income: calculateGrowth(current.totalIncome, previous.totalIncome),
        expenses: calculateGrowth(current.totalExpenses, previous.totalExpenses),
        savings: calculateGrowth(current.netAmount, previous.netAmount)
      }
    };
  }

  // Get spending trends over last 6 months
  getSpendingTrends(): Array<{
    month: string;
    income: number;
    expenses: number;
    savings: number;
  }> {
    const trends = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const monthTransactions = this.getTransactionsInPeriod(startOfMonth, endOfMonth);
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      trends.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        income,
        expenses,
        savings: income - expenses
      });
    }

    return trends;
  }

  // Get category-wise spending comparison
  getCategoryComparison(): Array<{
    category: string;
    currentMonth: number;
    previousMonth: number;
    change: number;
  }> {
    const now = new Date();
    
    // Current month transactions
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfCurrentMonth.setHours(23, 59, 59, 999);
    
    // Previous month transactions
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    endOfPreviousMonth.setHours(23, 59, 59, 999);

    const currentTransactions = this.getTransactionsInPeriod(startOfCurrentMonth, endOfCurrentMonth)
      .filter(t => t.type === 'expense');
    const previousTransactions = this.getTransactionsInPeriod(startOfPreviousMonth, endOfPreviousMonth)
      .filter(t => t.type === 'expense');

    // Get all categories
    const allCategories = new Set([
      ...currentTransactions.map(t => t.category),
      ...previousTransactions.map(t => t.category)
    ]);

    return Array.from(allCategories).map(category => {
      const currentAmount = currentTransactions
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const previousAmount = previousTransactions
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const change = previousAmount > 0 
        ? ((currentAmount - previousAmount) / previousAmount) * 100 
        : currentAmount > 0 ? 100 : 0;

      return {
        category,
        currentMonth: currentAmount,
        previousMonth: previousAmount,
        change
      };
    }).sort((a, b) => b.currentMonth - a.currentMonth);
  }

  // Get financial health score
  getFinancialHealthScore(): {
    score: number;
    factors: Array<{
      name: string;
      score: number;
      impact: 'positive' | 'negative' | 'neutral';
      description: string;
    }>;
  } {
    const monthlyAnalytics = this.getMonthlyAnalytics();
    const factors = [];
    let totalScore = 0;

    // Savings Rate Factor (30% weight)
    const savingsScore = Math.min(monthlyAnalytics.savingsRate * 2, 100);
    factors.push({
      name: 'Savings Rate',
      score: savingsScore,
      impact: savingsScore >= 60 ? 'positive' : savingsScore >= 30 ? 'neutral' : 'negative' as const,
      description: `You're saving ${monthlyAnalytics.savingsRate.toFixed(1)}% of your income`
    });
    totalScore += savingsScore * 0.3;

    // Expense Consistency Factor (25% weight)
    const trends = this.getSpendingTrends();
    const expenseVariation = this.calculateVariation(trends.map(t => t.expenses));
    const consistencyScore = Math.max(0, 100 - expenseVariation);
    factors.push({
      name: 'Spending Consistency',
      score: consistencyScore,
      impact: consistencyScore >= 70 ? 'positive' : consistencyScore >= 40 ? 'neutral' : 'negative' as const,
      description: `Your spending pattern is ${consistencyScore >= 70 ? 'consistent' : 'variable'}`
    });
    totalScore += consistencyScore * 0.25;

    // Income Growth Factor (20% weight)
    const comparison = this.getMonthlyComparison();
    const incomeGrowthScore = Math.min(Math.max(50 + comparison.growth.income, 0), 100);
    factors.push({
      name: 'Income Growth',
      score: incomeGrowthScore,
      impact: comparison.growth.income > 5 ? 'positive' : comparison.growth.income < -5 ? 'negative' : 'neutral' as const,
      description: `Income ${comparison.growth.income >= 0 ? 'increased' : 'decreased'} by ${Math.abs(comparison.growth.income).toFixed(1)}%`
    });
    totalScore += incomeGrowthScore * 0.2;

    // Category Balance Factor (25% weight)
    const categoryBalance = this.calculateCategoryBalance(monthlyAnalytics.topCategories);
    factors.push({
      name: 'Expense Balance',
      score: categoryBalance,
      impact: categoryBalance >= 70 ? 'positive' : categoryBalance >= 40 ? 'neutral' : 'negative' as const,
      description: `Your expenses are ${categoryBalance >= 70 ? 'well distributed' : 'concentrated'} across categories`
    });
    totalScore += categoryBalance * 0.25;

    return {
      score: Math.round(totalScore),
      factors
    };
  }

  private calculateVariation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    return mean > 0 ? (standardDeviation / mean) * 100 : 0;
  }

  private calculateCategoryBalance(categories: CategorySummary[]): number {
    if (categories.length === 0) return 100;
    
    // Calculate how evenly distributed the spending is
    const maxPercentage = Math.max(...categories.map(c => c.percentage));
    
    // Ideal would be even distribution, penalize heavy concentration
    if (maxPercentage > 50) return 30;
    if (maxPercentage > 40) return 50;
    if (maxPercentage > 30) return 70;
    return 90;
  }
}