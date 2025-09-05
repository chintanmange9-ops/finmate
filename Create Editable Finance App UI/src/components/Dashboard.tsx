import React, { useMemo, useState } from 'react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { BarChart, Bar, XAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Target, DollarSign, Calendar } from 'lucide-react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useTimePeriod } from '../contexts/TimePeriodContext';
import { AnalyticsEngine } from '../utils/analytics';

interface DashboardProps {
  salary: number;
}

export function Dashboard({ salary }: DashboardProps) {
  const { formatAmount, savingsTarget } = useAppSettings();
  const { transactions } = useTransactions();
  const { timePeriod, setTimePeriod, getPeriodLabel, getSavingsGoalLabel } = useTimePeriod();
  
  const analytics = useMemo(() => new AnalyticsEngine(transactions), [transactions]);
  const periodData = useMemo(() => {
    switch (timePeriod) {
      case 'weekly':
        return analytics.getWeeklyAnalytics();
      case 'monthly':
        return analytics.getMonthlyAnalytics();
      case 'half-yearly':
        return analytics.getHalfYearlyAnalytics();
      case 'yearly':
        return analytics.getAnnualAnalytics();
      default:
        return analytics.getMonthlyAnalytics();
    }
  }, [analytics, timePeriod]);
  
  const comparison = useMemo(() => {
    switch (timePeriod) {
      case 'weekly':
        return analytics.getWeeklyComparison();
      case 'monthly':
        return analytics.getMonthlyComparison();
      case 'half-yearly':
        return analytics.getHalfYearlyComparison();
      case 'yearly':
        return analytics.getYearlyComparison();
      default:
        return analytics.getMonthlyComparison();
    }
  }, [analytics, timePeriod]);
  
  const trends = useMemo(() => analytics.getSpendingTrends().slice(-3), [analytics]); // Last 3 months

  // Calculate period-specific savings target
  const getPeriodSavingsTarget = () => {
    switch (timePeriod) {
      case 'weekly': return savingsTarget / 4.33; // Monthly target / weeks per month
      case 'monthly': return savingsTarget;
      case 'half-yearly': return savingsTarget * 6;
      case 'yearly': return savingsTarget * 12;
      default: return savingsTarget;
    }
  };

  // Show message when no transaction data is available
  if (transactions.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center py-12">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-medium mb-2">No Transaction Data</h2>
          <p className="text-gray-600 mb-4">
            Upload your bank statements in Settings to see your financial dashboard
          </p>
          <div className="text-sm text-gray-500">
            <p>Your current salary: {formatAmount(salary)}</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Calculate total balance from actual transaction data
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalExpensesAll = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalBalance = totalIncome - totalExpensesAll;
  const currentSavings = Math.max(0, periodData.netAmount);
  const periodSavingsTarget = getPeriodSavingsTarget();
  const savingsProgress = periodSavingsTarget > 0 ? (currentSavings / periodSavingsTarget) * 100 : 0;

  const incomeVsExpenses = [
    { name: 'Income', value: periodData.totalIncome, color: '#10B981' },
    { name: 'Expenses', value: periodData.totalExpenses, color: '#EF4444' }
  ];

  const spendingCategories = periodData.topCategories.map((cat, index) => ({
    name: cat.category,
    value: cat.percentage,
    amount: cat.amount,
    color: `hsl(${index * 60}, 70%, 60%)`
  }));

  return (
    <div className="p-4 space-y-4">
      {/* Time Period Selector */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3>Time Period</h3>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: 'weekly', label: 'Weekly' },
            { key: 'monthly', label: 'Monthly' },
            { key: 'half-yearly', label: 'Half Year' },
            { key: 'yearly', label: 'Yearly' }
          ].map((period) => (
            <Button
              key={period.key}
              variant={timePeriod === period.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimePeriod(period.key as any)}
              className="whitespace-nowrap"
            >
              {period.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Balance Card */}
        <Card className="p-4 bg-gradient-to-r from-green-100 to-blue-100 border-none">
          <div className="text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="text-sm text-gray-600 mb-1">Total Balance</p>
            <h3 className="text-lg font-medium">{formatAmount(totalBalance)}</h3>
          </div>
        </Card>

        {/* Period Savings */}
        <Card className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 border-none">
          <div className="text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600 mb-1">{getPeriodLabel()}</p>
            <h3 className={`text-lg font-medium ${
              periodData.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatAmount(periodData.netAmount)}
            </h3>
          </div>
        </Card>
      </div>

      {/* Period Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">{getPeriodLabel()} Summary</h3>
          <Badge className={`${
            comparison.growth.savings >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {comparison.growth.savings >= 0 ? '+' : ''}{comparison.growth.savings.toFixed(1)}% vs last {timePeriod.replace('-', ' ')}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600 mb-1">Income</p>
            <p className="font-medium text-green-600">{formatAmount(periodData.totalIncome)}</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              {comparison.growth.income >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
              <span className={`text-xs ${
                comparison.growth.income >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {Math.abs(comparison.growth.income).toFixed(1)}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Expenses</p>
            <p className="font-medium text-red-600">{formatAmount(periodData.totalExpenses)}</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              {comparison.growth.expenses >= 0 ? (
                <TrendingUp className="w-3 h-3 text-red-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-green-600" />
              )}
              <span className={`text-xs ${
                comparison.growth.expenses >= 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {Math.abs(comparison.growth.expenses).toFixed(1)}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Savings Rate</p>
            <p className="font-medium text-blue-600">{periodData.savingsRate.toFixed(1)}%</p>
            <Badge variant={periodData.savingsRate >= 20 ? 'default' : 'destructive'} className="text-xs mt-1">
              {periodData.savingsRate >= 20 ? 'Good' : 'Low'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-4">
        {/* Income vs Expenses */}
        <Card className="p-4">
          <h3 className="mb-3">Income vs Expenses</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsExpenses}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={false} />
                <Tooltip formatter={(value: any) => formatAmount(value)} />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                >
                  {incomeVsExpenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Income</span>
              <span className="text-green-600 font-medium">{formatAmount(periodData.totalIncome)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Expenses</span>
              <span className="text-red-600 font-medium">{formatAmount(periodData.totalExpenses)}</span>
            </div>
          </div>
        </Card>

        {/* Spending Categories */}
        <Card className="p-4">
          <h3 className="mb-3">Spending Categories</h3>
          <div className="h-24 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spendingCategories}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={40}
                  strokeWidth={0}
                >
                  {spendingCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1">
            {spendingCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-gray-600">{category.name}</span>
                </div>
                <span>({category.value.toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Savings Goal */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3>{getSavingsGoalLabel()}</h3>
          </div>
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Goal: {formatAmount(periodSavingsTarget)}</span>
              <span>{Math.round(savingsProgress)}%</span>
            </div>
            <Progress value={savingsProgress} className="h-2 mb-2" />
            <p className="text-lg">{formatAmount(currentSavings)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}