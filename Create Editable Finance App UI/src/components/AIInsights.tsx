import React, { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Bot, Plus, Clock, Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useTimePeriod } from '../contexts/TimePeriodContext';
import { AnalyticsEngine } from '../utils/analytics';

export function AIInsights() {
  const { budgetReminders, addBudgetReminder, formatAmount, getCurrencySymbol } = useAppSettings();
  const { transactions } = useTransactions();
  const { timePeriod } = useTimePeriod();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    category: 'Food',
    amount: '',
    period: 'monthly' as 'weekly' | 'monthly'
  });

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
  const categoryComparison = useMemo(() => analytics.getCategoryComparison(), [analytics]);
  const healthScore = useMemo(() => analytics.getFinancialHealthScore(), [analytics]);

  // Handle empty transactions case
  if (transactions.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center py-12">
          <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-medium mb-2">No AI Insights Yet</h2>
          <p className="text-gray-600 mb-4">
            Upload your bank statements in Settings to get personalized AI insights
          </p>
        </div>
      </div>
    );
  }

  const handleAddReminder = () => {
    if (reminderForm.amount && parseFloat(reminderForm.amount) > 0) {
      addBudgetReminder({
        category: reminderForm.category,
        amount: parseFloat(reminderForm.amount),
        period: reminderForm.period,
        isActive: true
      });
      setReminderForm({ category: 'Food', amount: '', period: 'monthly' });
      setIsDialogOpen(false);
    }
  };

  // Generate AI insights based on actual data
  const generateInsights = () => {
    const insights = [];
    
    // Spending increase insights
    const highSpendingCategories = categoryComparison
      .filter(cat => cat.change > 20)
      .sort((a, b) => b.change - a.change);
    
    if (highSpendingCategories.length > 0) {
      const topCategory = highSpendingCategories[0];
      insights.push({
        type: 'warning',
        message: `You spent ${topCategory.change.toFixed(1)}% more on ${topCategory.category} this month`,
        detail: `That's ${formatAmount(topCategory.currentMonth - topCategory.previousMonth)} more than last month.`,
        action: 'Set Budget Reminder',
        category: topCategory.category
      });
    }

    // Savings rate insights
    if (periodData.savingsRate < 10) {
      insights.push({
        type: 'alert',
        message: `Your savings rate is only ${periodData.savingsRate.toFixed(1)}%`,
        detail: `Financial experts recommend saving at least 20% of your income.`,
        action: 'Review Expenses',
        category: 'Savings'
      });
    } else if (periodData.savingsRate > 30) {
      insights.push({
        type: 'positive',
        message: `Excellent savings rate of ${periodData.savingsRate.toFixed(1)}%! 🎉`,
        detail: `You're saving ${formatAmount(periodData.netAmount)} this period.`,
        action: 'Investment Tips',
        category: 'Savings'
      });
    }

    // Category optimization insights
    const topExpenseCategory = periodData.topCategories[0];
    if (topExpenseCategory && topExpenseCategory.percentage > 40) {
      insights.push({
        type: 'suggestion',
        message: `${topExpenseCategory.category} takes up ${topExpenseCategory.percentage.toFixed(1)}% of your expenses`,
        detail: `Consider ways to optimize your ${topExpenseCategory.category.toLowerCase()} spending.`,
        action: 'Get Suggestions',
        category: topExpenseCategory.category
      });
    }

    return insights.length > 0 ? insights : [
      {
        type: 'positive',
        message: 'Your spending patterns look balanced! 💚',
        detail: 'Keep up the good financial habits.',
        action: 'View Analytics',
        category: 'General'
      }
    ];
  };

  const insights = generateInsights();
  const mainInsight = insights[0];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl mb-0">AI Insights</h1>
      </div>

      {/* AI Avatar and Insight */}
      <div className="flex gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
          mainInsight.type === 'positive' ? 'bg-green-100' :
          mainInsight.type === 'warning' ? 'bg-orange-100' :
          mainInsight.type === 'alert' ? 'bg-red-100' : 'bg-blue-100'
        }`}>
          <Bot className={`w-6 h-6 ${
            mainInsight.type === 'positive' ? 'text-green-600' :
            mainInsight.type === 'warning' ? 'text-orange-600' :
            mainInsight.type === 'alert' ? 'text-red-600' : 'text-blue-600'
          }`} />
        </div>
        <Card className={`flex-1 p-4 ${
          mainInsight.type === 'positive' ? 'bg-green-50 border-green-200' :
          mainInsight.type === 'warning' ? 'bg-orange-50 border-orange-200' :
          mainInsight.type === 'alert' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {mainInsight.message}
            </p>
            <p className="text-sm text-gray-600">
              {mainInsight.detail}
            </p>
          </div>
        </Card>
      </div>

      {/* Financial Health Score */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg">Financial Health Score</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              healthScore.score >= 80 ? 'bg-green-100 text-green-800' :
              healthScore.score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
            }`}>
              {healthScore.score}/100
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{healthScore.score}</span>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {healthScore.score >= 80 ? 'Excellent' :
                   healthScore.score >= 60 ? 'Good' : 'Needs Work'}
                </p>
                <p className="text-xs text-gray-600">Financial Health</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  healthScore.score >= 80 ? 'bg-green-500' :
                  healthScore.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${healthScore.score}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-2">
            {healthScore.factors.slice(0, 2).map((factor, index) => (
              <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3">
                <div className="flex items-center gap-2">
                  {factor.impact === 'positive' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : factor.impact === 'negative' ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : (
                    <Target className="w-4 h-4 text-yellow-600" />
                  )}
                  <span className="text-sm font-medium">{factor.name}</span>
                </div>
                <span className="text-sm text-gray-600">{factor.score.toFixed(0)}</span>
              </div>
            ))}
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-purple-400 hover:bg-purple-500 text-white rounded-full">
                Set Budget Reminder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Budget Reminder</DialogTitle>
                <DialogDescription>
                  Create a budget reminder to help you stay on track with your spending goals.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2">Category</label>
                  <Select 
                    value={reminderForm.category} 
                    onValueChange={(value) => setReminderForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Food">Food</SelectItem>
                      <SelectItem value="Transport">Transport</SelectItem>
                      <SelectItem value="Shopping">Shopping</SelectItem>
                      <SelectItem value="Entertainment">Entertainment</SelectItem>
                      <SelectItem value="Bills">Bills</SelectItem>
                      <SelectItem value="Health">Health</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block mb-2">Budget Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      {getCurrencySymbol()}
                    </span>
                    <Input
                      type="number"
                      value={reminderForm.amount}
                      onChange={(e) => setReminderForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="5000"
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-2">Period</label>
                  <Select 
                    value={reminderForm.period} 
                    onValueChange={(value: 'weekly' | 'monthly') => setReminderForm(prev => ({ ...prev, period: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddReminder}>
                  Add Reminder
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Budget Reminders */}
      {budgetReminders.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg">Your Budget Reminders</h3>
          </div>
          <div className="space-y-2">
            {budgetReminders.filter(r => r.isActive).map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{reminder.category}</p>
                  <p className="text-xs text-gray-600 capitalize">{reminder.period} budget</p>
                </div>
                <p className="font-medium text-blue-600">{formatAmount(reminder.amount)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Additional AI Insights */}
      <div className="space-y-3">
        {insights.slice(1).map((insight, index) => (
          <Card key={index} className={`p-4 ${
            insight.type === 'positive' ? 'bg-green-50 border-green-200' :
            insight.type === 'warning' ? 'bg-orange-50 border-orange-200' :
            insight.type === 'alert' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                insight.type === 'positive' ? 'bg-green-100' :
                insight.type === 'warning' ? 'bg-orange-100' :
                insight.type === 'alert' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                {insight.type === 'positive' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : insight.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                ) : insight.type === 'alert' ? (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                ) : (
                  <Bot className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm mb-1 font-medium">
                  {insight.type === 'positive' ? 'Great Job!' :
                   insight.type === 'warning' ? 'Heads Up' :
                   insight.type === 'alert' ? 'Action Needed' : 'Smart Tip'}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  {insight.message}
                </p>
                <p className="text-xs text-gray-500">
                  {insight.detail}
                </p>
              </div>
            </div>
          </Card>
        ))}

        {/* Data-driven insights */}
        {periodData.topCategories.length > 0 && (
          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm mb-1 font-medium">Category Analysis</p>
                <p className="text-sm text-gray-600">
                  Your top spending category is {periodData.topCategories[0].category} at {formatAmount(periodData.topCategories[0].amount)} 
                  ({periodData.topCategories[0].percentage.toFixed(1)}% of expenses).
                </p>
              </div>
            </div>
          </Card>
        )}

        {comparison.growth.savings < -10 && (
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm mb-1 font-medium">Savings Alert</p>
                <p className="text-sm text-gray-600">
                  Your savings decreased by {Math.abs(comparison.growth.savings).toFixed(1)}% compared to last month. 
                  Consider reviewing your recent expenses.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}