import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Download, FileText, TrendingUp, Brain, DollarSign, BarChart3 } from 'lucide-react';
import { useTransactions } from '../contexts/TransactionContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { toast } from 'sonner@2.0.3';
import { generateAnalytics } from '../utils/analytics';

interface PDFExportProps {
  userSalary: number;
}

export function PDFExport({ userSalary }: PDFExportProps) {
  const { transactions, getTransactionsByPeriod } = useTransactions();
  const { formatAmount, getCurrencySymbol, savingsTarget } = useAppSettings();
  
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  });
  
  const [exportSections, setExportSections] = useState({
    transactions: true,
    analytics: true,
    aiInsights: true,
    goals: true,
    summary: true
  });
  
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!exportSections.transactions && !exportSections.analytics && !exportSections.aiInsights && !exportSections.goals && !exportSections.summary) {
      toast.error('Please select at least one section to export');
      return;
    }

    setIsExporting(true);
    
    try {
      // Import jsPDF and related libraries dynamically
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Get filtered transactions
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      const filteredTransactions = getTransactionsByPeriod(startDate, endDate);
      
      // Generate analytics
      const analytics = generateAnalytics(filteredTransactions, userSalary);

      // Helper function to add page break if needed
      const checkPageBreak = (additionalHeight: number) => {
        if (yPosition + additionalHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
      };

      // Title Page
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Financial Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Summary Section
      if (exportSections.summary) {
        checkPageBreak(40);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Executive Summary', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        
        const summaryData = [
          [`Total Transactions:`, `${filteredTransactions.length}`],
          [`Total Income:`, `${formatAmount(analytics.totalIncome)}`],
          [`Total Expenses:`, `${formatAmount(Math.abs(analytics.totalExpenses))}`],
          [`Net Amount:`, `${formatAmount(analytics.totalIncome + analytics.totalExpenses)}`],
          [`Monthly Salary:`, `${formatAmount(userSalary)}`],
          [`Savings Target:`, `${formatAmount(savingsTarget)}`],
          [`Period Duration:`, `${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`]
        ];

        summaryData.forEach(([label, value]) => {
          pdf.text(label, 25, yPosition);
          pdf.text(value, 120, yPosition);
          yPosition += 7;
        });
        yPosition += 10;
      }

      // Transactions Section
      if (exportSections.transactions && filteredTransactions.length > 0) {
        checkPageBreak(30);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Transactions', 20, yPosition);
        yPosition += 15;

        // Table headers
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Date', 25, yPosition);
        pdf.text('Description', 55, yPosition);
        pdf.text('Category', 115, yPosition);
        pdf.text('Amount', 155, yPosition);
        yPosition += 7;

        // Draw header line
        pdf.line(20, yPosition - 2, pageWidth - 20, yPosition - 2);
        yPosition += 3;

        pdf.setFont('helvetica', 'normal');
        filteredTransactions.slice(0, 50).forEach((transaction) => { // Limit to 50 transactions to avoid too many pages
          checkPageBreak(7);
          
          const date = new Date(transaction.date).toLocaleDateString();
          const description = transaction.description.length > 25 ? transaction.description.substring(0, 25) + '...' : transaction.description;
          const category = transaction.category.length > 12 ? transaction.category.substring(0, 12) + '...' : transaction.category;
          const amount = formatAmount(transaction.amount);
          
          pdf.text(date, 25, yPosition);
          pdf.text(description, 55, yPosition);
          pdf.text(category, 115, yPosition);
          
          // Color code amounts
          if (transaction.amount > 0) {
            pdf.setTextColor(0, 128, 0); // Green for income
          } else {
            pdf.setTextColor(255, 0, 0); // Red for expenses
          }
          pdf.text(amount, 155, yPosition);
          pdf.setTextColor(0, 0, 0); // Reset to black
          
          yPosition += 6;
        });

        if (filteredTransactions.length > 50) {
          yPosition += 5;
          pdf.setFont('helvetica', 'italic');
          pdf.text(`... and ${filteredTransactions.length - 50} more transactions`, 25, yPosition);
          pdf.setFont('helvetica', 'normal');
        }
        yPosition += 15;
      }

      // Analytics Section
      if (exportSections.analytics) {
        checkPageBreak(50);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Analytics & Insights', 20, yPosition);
        yPosition += 15;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');

        // Category breakdown
        pdf.setFont('helvetica', 'bold');
        pdf.text('Expense Breakdown by Category:', 25, yPosition);
        yPosition += 10;
        pdf.setFont('helvetica', 'normal');

        analytics.categoryBreakdown.forEach(([category, amount, percentage]) => {
          checkPageBreak(7);
          pdf.text(`${category}:`, 30, yPosition);
          pdf.text(`${formatAmount(amount)} (${percentage.toFixed(1)}%)`, 120, yPosition);
          yPosition += 7;
        });
        yPosition += 10;

        // Monthly comparison if data spans multiple months
        const monthlyData = analytics.monthlyComparison;
        if (monthlyData.length > 1) {
          pdf.setFont('helvetica', 'bold');
          pdf.text('Monthly Comparison:', 25, yPosition);
          yPosition += 10;
          pdf.setFont('helvetica', 'normal');

          monthlyData.forEach(month => {
            checkPageBreak(7);
            pdf.text(`${month.month}:`, 30, yPosition);
            pdf.text(`Income: ${formatAmount(month.income)} | Expenses: ${formatAmount(Math.abs(month.expenses))}`, 80, yPosition);
            yPosition += 7;
          });
          yPosition += 10;
        }
      }

      // AI Insights Section
      if (exportSections.aiInsights) {
        checkPageBreak(30);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('AI-Powered Insights', 20, yPosition);
        yPosition += 15;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');

        const insights = [
          {
            title: 'Spending Pattern Analysis',
            content: analytics.totalExpenses < 0 
              ? `Your spending is ${Math.abs(analytics.totalExpenses) > userSalary * 0.8 ? 'high' : 'moderate'} compared to your income. ${Math.abs(analytics.totalExpenses) > userSalary ? 'Consider reducing expenses to meet your savings goals.' : 'You\'re on track for healthy savings.'}`
              : 'No significant expenses recorded in this period.'
          },
          {
            title: 'Category Recommendations',
            content: analytics.categoryBreakdown.length > 0 
              ? `Your highest expense category is ${analytics.categoryBreakdown[0][0]} at ${formatAmount(analytics.categoryBreakdown[0][1])}. Consider tracking this category more closely.`
              : 'Start categorizing your expenses for better insights.'
          },
          {
            title: 'Savings Potential',
            content: analytics.totalIncome + analytics.totalExpenses > 0 
              ? `You saved ${formatAmount(analytics.totalIncome + analytics.totalExpenses)} this period. ${analytics.totalIncome + analytics.totalExpenses >= savingsTarget ? 'Great job meeting your savings target!' : 'Try to reach your savings target of ' + formatAmount(savingsTarget) + '.'}`
              : 'Focus on reducing expenses to improve your savings rate.'
          }
        ];

        insights.forEach(insight => {
          checkPageBreak(20);
          pdf.setFont('helvetica', 'bold');
          pdf.text(insight.title, 25, yPosition);
          yPosition += 8;
          
          pdf.setFont('helvetica', 'normal');
          const lines = pdf.splitTextToSize(insight.content, pageWidth - 50);
          pdf.text(lines, 25, yPosition);
          yPosition += lines.length * 5 + 10;
        });
      }

      // Goals Section
      if (exportSections.goals) {
        checkPageBreak(30);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Financial Goals', 20, yPosition);
        yPosition += 15;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        
        pdf.text(`Monthly Savings Target: ${formatAmount(savingsTarget)}`, 25, yPosition);
        yPosition += 7;
        
        const actualSavings = analytics.totalIncome + analytics.totalExpenses;
        const savingsProgress = savingsTarget > 0 ? (actualSavings / savingsTarget) * 100 : 0;
        
        pdf.text(`Actual Savings This Period: ${formatAmount(actualSavings)}`, 25, yPosition);
        yPosition += 7;
        pdf.text(`Savings Progress: ${savingsProgress.toFixed(1)}%`, 25, yPosition);
        yPosition += 15;
      }

      // Footer on last page
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Generated by Smart Finance App', pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Save the PDF
      const fileName = `financial-report-${dateRange.start}-to-${dateRange.end}.pdf`;
      pdf.save(fileName);
      
      toast.success('PDF report generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="w-12 h-12 mx-auto mb-3 text-blue-600" />
        <h3 className="mb-2">Export PDF Report</h3>
        <p className="text-sm text-gray-600">
          Generate a comprehensive PDF report with charts, analytics, and insights
        </p>
      </div>

      {/* Date Range Selection */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4" />
          <h4>Select Date Range</h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Start Date</label>
            <Input
              type="date"
              value={dateRange.start}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">End Date</label>
            <Input
              type="date"
              value={dateRange.end}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>
      </Card>

      {/* Section Selection */}
      <Card className="p-4">
        <h4 className="mb-3">Select Sections to Include</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="summary"
              checked={exportSections.summary}
              onCheckedChange={(checked) => 
                setExportSections(prev => ({ ...prev, summary: !!checked }))
              }
            />
            <label htmlFor="summary" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Executive Summary
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="transactions"
              checked={exportSections.transactions}
              onCheckedChange={(checked) => 
                setExportSections(prev => ({ ...prev, transactions: !!checked }))
              }
            />
            <label htmlFor="transactions" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Transaction Details
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="analytics"
              checked={exportSections.analytics}
              onCheckedChange={(checked) => 
                setExportSections(prev => ({ ...prev, analytics: !!checked }))
              }
            />
            <label htmlFor="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics & Charts
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="aiInsights"
              checked={exportSections.aiInsights}
              onCheckedChange={(checked) => 
                setExportSections(prev => ({ ...prev, aiInsights: !!checked }))
              }
            />
            <label htmlFor="aiInsights" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Insights & Recommendations
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="goals"
              checked={exportSections.goals}
              onCheckedChange={(checked) => 
                setExportSections(prev => ({ ...prev, goals: !!checked }))
              }
            />
            <label htmlFor="goals" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Goals & Targets
            </label>
          </div>
        </div>
      </Card>

      {/* Preview Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="mb-2 text-blue-800">Report Preview</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>📅 Period: {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}</p>
          <p>📊 Transactions: {getTransactionsByPeriod(new Date(dateRange.start), new Date(dateRange.end)).length}</p>
          <p>📄 Sections: {Object.values(exportSections).filter(Boolean).length} selected</p>
        </div>
      </Card>

      {/* Export Button */}
      <Button 
        onClick={handleExportPDF} 
        disabled={isExporting}
        className="w-full"
        size="lg"
      >
        <Download className="w-4 h-4 mr-2" />
        {isExporting ? 'Generating PDF...' : 'Generate PDF Report'}
      </Button>
    </div>
  );
}