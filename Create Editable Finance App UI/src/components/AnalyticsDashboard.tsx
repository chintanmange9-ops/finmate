import React, { useMemo, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Filter, Download } from 'lucide-react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useTimePeriod } from '../contexts/TimePeriodContext';
import { AnalyticsEngine } from '../utils/analytics';

export function AnalyticsDashboard() {
  const { formatAmount } = useAppSettings();
  const { transactions } = useTransactions();
  const { timePeriod } = useTimePeriod();
  const [viewType, setViewType] = useState<'overview' | 'categories' | 'trends'>('overview');
  
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
  const trends = useMemo(() => analytics.getSpendingTrends(), [analytics]);
  const categoryComparison = useMemo(() => analytics.getCategoryComparison(), [analytics]);

  if (transactions.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-medium mb-2">No Analytics Data</h2>
          <p className="text-gray-600 mb-4">
            Upload your bank statements in Settings to see detailed analytics
          </p>
        </div>
      </div>
    );
  }

  const spendingCategories = periodData.topCategories.map((cat, index) => ({
    name: cat.category,
    value: cat.amount,
    percentage: cat.percentage,
    color: `hsl(${index * 45}, 70%, 60%)`
  }));

  const trendData = trends.map(trend => ({
    ...trend,
    net: trend.income - trend.expenses
  }));

  const categoryTrendData = categoryComparison.slice(0, 8).map(cat => ({
    category: cat.category,
    current: cat.currentMonth,
    previous: cat.previousMonth,
    change: cat.change
  }));

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <h3 className="text-sm text-gray-600 mb-1">Total Income</h3>
            <p className="text-lg font-medium text-green-600">{formatAmount(periodData.totalIncome)}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <h3 className="text-sm text-gray-600 mb-1">Total Expenses</h3>
            <p className="text-lg font-medium text-red-600">{formatAmount(periodData.totalExpenses)}</p>
          </div>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card className="p-4">
        <h3 className="mb-4">6-Month Trend</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatAmount(value)} />
              <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} />
              <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs">Expenses</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" style={{background: 'repeating-linear-gradient(90deg, #3B82F6 0px, #3B82F6 5px, transparent 5px, transparent 10px)'}}></div>
            <span className="text-xs">Net</span>
          </div>
        </div>
      </Card>

      {/* Savings Rate */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3>Savings Rate</h3>
          <Badge variant={periodData.savingsRate >= 20 ? 'default' : 'destructive'}>
            {periodData.savingsRate.toFixed(1)}%
          </Badge>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full ${periodData.savingsRate >= 20 ? 'bg-green-500' : 'bg-yellow-500'}`}
            style={{ width: `${Math.min(periodData.savingsRate, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {periodData.savingsRate >= 20 ? 'Great job!' : 'Aim for 20% or higher'}
        </p>
      </Card>
    </div>
  );

  const renderCategories = () => (
    <div className="space-y-4">
      {/* Category Pie Chart */}
      <Card className="p-4">
        <h3 className="mb-4">Spending by Category</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={spendingCategories}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                strokeWidth={0}
              >
                {spendingCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatAmount(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {spendingCategories.map((category, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: category.color }}
              ></div>
              <span className="text-gray-600">{category.name}</span>
              <span className="font-medium">{category.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Category Comparison */}
      <Card className="p-4">
        <h3 className="mb-4">Category Comparison (This vs Last Month)</h3>
        <div className="space-y-3">
          {categoryTrendData.map((cat, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">{cat.category}</p>
                <p className="text-xs text-gray-600">{formatAmount(cat.current)}</p>
              </div>
              <div className="flex items-center gap-2">
                {cat.change >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-red-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-600" />
                )}
                <span className={`text-sm font-medium ${
                  cat.change >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {Math.abs(cat.change).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderTrends = () => (
    <div className="space-y-4">
      {/* Spending Trend Chart */}
      <Card className="p-4">
        <h3 className="mb-4">Monthly Spending Trend</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatAmount(value)} />
              <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Average Daily Spending */}
      <Card className="p-4">
        <h3 className="mb-2">Average Daily Spending</h3>
        <p className="text-2xl font-medium">{formatAmount(periodData.averageDaily)}</p>
        <p className="text-sm text-gray-600 mt-1">
          Based on {periodData.transactionCount} transactions this period
        </p>
      </Card>

      {/* Transaction Volume */}
      <Card className="p-4">
        <h3 className="mb-4">Transaction Volume by Month</h3>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="income" fill="#10B981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="expenses" fill="#EF4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl mb-0">Analytics</h1>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* View Type Selector */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'categories', label: 'Categories' },
          { key: 'trends', label: 'Trends' }
        ].map((view) => (
          <Button
            key={view.key}
            variant={viewType === view.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewType(view.key as any)}
            className="whitespace-nowrap"
          >
            {view.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      {viewType === 'overview' && renderOverview()}
      {viewType === 'categories' && renderCategories()}
      {viewType === 'trends' && renderTrends()}
    </div>
  );
}