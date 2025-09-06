import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { toast } from 'sonner@2.0.3';
import { 
  User, 
  Bell, 
  Palette, 
  Globe, 
  Target, 
  Shield, 
  LogOut, 
  Trash2, 
  Download,
  ChevronRight,
  Mail,
  Lock,
  Smartphone,
  Upload,
  FileText,
  DollarSign
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { FileUpload } from './FileUpload';
import { PDFExport } from './PDFExport';

interface SettingsProps {
  userSalary: number;
  onUpdateSalary: (salary: number) => void;
  onClearAllData: () => void;
}

export function Settings({ userSalary, onUpdateSalary, onClearAllData }: SettingsProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { transactions, addTransactions, clearAllTransactions } = useTransactions();
  const [isUploadLoading, setIsUploadLoading] = useState(false);
  const { 
    currency, 
    setCurrency, 
    formatAmount, 
    getCurrencySymbol,
    savingsTarget, 
    setSavingsTarget,
    budgetGoals,
    updateBudgetGoals,
    goalTargets,
    addGoalTarget,
    updateGoalTarget,
    removeGoalTarget
  } = useAppSettings();
  
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [notifications, setNotifications] = useState({
    overspending: true,
    monthlyReport: true,
    goalReminders: true,
    budgetAlerts: true
  });
  const [savingsTargetInput, setSavingsTargetInput] = useState(savingsTarget.toString());
  const [budgetGoalsLocal, setBudgetGoalsLocal] = useState(budgetGoals);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: ''
  });
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+91 98765 43210'
  });
  const [salaryInput, setSalaryInput] = useState(userSalary.toString());

  // Update salary input when userSalary prop changes
  React.useEffect(() => {
    setSalaryInput(userSalary.toString());
  }, [userSalary]);

  const settingsGroups = [
    {
      title: 'Profile & Account',
      icon: User,
      items: [
        { label: 'Edit Profile', icon: User, action: 'profile' },
        { label: 'Update Salary', icon: DollarSign, action: 'salary' },
        { label: 'Email & Password', icon: Lock, action: 'security' },
        { label: 'Linked Accounts', icon: Smartphone, action: 'accounts' },
        { label: 'Sign Out', icon: LogOut, action: 'logout', danger: true }
      ]
    },
    {
      title: 'Preferences',
      icon: Palette,
      items: [
        { label: 'Currency', icon: Globe, action: 'currency' },
        { label: 'Theme', icon: Palette, action: 'theme' },
        { label: 'Notifications', icon: Bell, action: 'notifications' }
      ]
    },
    {
      title: 'Goals & Targets',
      icon: Target,
      items: [
        { label: 'Savings Target', icon: Target, action: 'savings' },
        { label: 'Budget Goals', icon: Target, action: 'budget' }
      ]
    },
    {
      title: 'Bank Statements',
      icon: FileText,
      items: [
        { label: 'Upload Statements', icon: Upload, action: 'upload' },
        { label: 'View Import History', icon: FileText, action: 'history' }
      ]
    },
    {
      title: 'Data & Privacy',
      icon: Shield,
      items: [
        { label: 'Export PDF Report', icon: Download, action: 'export' },
        { label: 'Clear Data', icon: Trash2, action: 'clear', danger: true },
        { label: 'Privacy Policy', icon: Shield, action: 'privacy' }
      ]
    }
  ];

  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully!');
    setActiveSection(null);
  };

  const handleUpdateSavingsTarget = () => {
    const target = parseFloat(savingsTargetInput);
    if (target && target > 0) {
      setSavingsTarget(target);
      setActiveSection(null);
    }
  };

  const handleSaveBudgetGoals = () => {
    updateBudgetGoals(budgetGoalsLocal);
    setActiveSection(null);
  };

  const handleAddGoalTarget = () => {
    if (newGoal.name && newGoal.targetAmount && newGoal.deadline) {
      addGoalTarget({
        name: newGoal.name,
        targetAmount: parseFloat(newGoal.targetAmount),
        currentAmount: parseFloat(newGoal.currentAmount) || 0,
        deadline: new Date(newGoal.deadline),
        isActive: true
      });
      setNewGoal({ name: '', targetAmount: '', currentAmount: '', deadline: '' });
    }
  };

  const handleFilesParsed = async (newTransactions: any[]) => {
    setIsUploadLoading(true);
    try {
      await addTransactions(newTransactions);
      toast.success(`Successfully imported ${newTransactions.length} transactions!`);
      setActiveSection(null);
    } catch (error) {
      toast.error('Error importing transactions. Please try again.');
      console.error('Transaction import error:', error);
    } finally {
      setIsUploadLoading(false);
    }
  };



  const handleClearData = () => {
    // Clear all transactions and app data including salary
    clearAllTransactions();
    onClearAllData();
    toast.success('All data cleared successfully!');
  };

  const handleSignOut = () => {
    // In a real app, this would handle user logout
    localStorage.clear();
    toast.success('Signed out successfully!');
  };

  const renderSettingDetail = (action: string) => {
    switch (action) {
      case 'upload':
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="mb-2">Upload Bank Statements</h3>
              <p className="text-sm text-gray-600">
                Import PDF, Excel, or CSV files to automatically analyze your transactions
              </p>
            </div>
            <FileUpload 
              onFilesParsed={handleFilesParsed} 
              isLoading={isUploadLoading} 
            />
            {transactions.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  Currently tracking {transactions.length} transactions
                </p>
              </div>
            )}
          </div>
        );

      case 'history':
        return (
          <div className="space-y-4">
            <h3 className="mb-4">Import History</h3>
            {transactions.length > 0 ? (
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Latest Import</p>
                      <p className="text-sm text-gray-600">
                        {transactions.length} transactions imported
                      </p>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">No bank statements uploaded yet</p>
                <Button 
                  variant="outline" 
                  className="mt-3"
                  onClick={() => setActiveSection('upload')}
                >
                  Upload Your First Statement
                </Button>
              </div>
            )}
          </div>
        );

      case 'salary':
        return (
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Monthly Salary</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">{getCurrencySymbol()}</span>
                <Input 
                  type="number"
                  value={salaryInput} 
                  onChange={(e) => setSalaryInput(e.target.value)}
                  placeholder="Enter your monthly salary"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Current salary: {formatAmount(userSalary)}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Update your salary to get accurate financial insights and budget recommendations.
              </p>
            </div>
            <Button 
              onClick={() => {
                const newSalary = parseFloat(salaryInput);
                if (newSalary && newSalary > 0) {
                  onUpdateSalary(newSalary);
                  setActiveSection(null);
                  toast.success('Salary updated successfully!');
                } else {
                  toast.error('Please enter a valid salary amount');
                }
              }} 
              className="w-full"
            >
              Update Salary
            </Button>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Full Name</label>
              <Input 
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block mb-2">Email</label>
              <Input 
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                type="email" 
              />
            </div>
            <div>
              <label className="block mb-2">Phone</label>
              <Input 
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <Button onClick={handleSaveProfile} className="w-full">Save Changes</Button>
          </div>
        );

      case 'currency':
        return (
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Select Currency</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">₹ Indian Rupee (INR)</SelectItem>
                  <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
                  <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
                  <SelectItem value="GBP">£ British Pound (GBP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Changing currency will convert all amounts throughout the app using current exchange rates.
              </p>
            </div>
          </div>
        );

      case 'theme':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p>Dark Mode</p>
                <p className="text-sm text-gray-600">Switch to dark theme</p>
              </div>
              <Switch 
                checked={isDarkMode} 
                onCheckedChange={(checked) => {
                  toggleDarkMode();
                  toast.success(`Switched to ${checked ? 'dark' : 'light'} mode!`);
                }} 
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p>AI Suggestions</p>
                <p className="text-sm text-gray-600">Enable AI-powered insights</p>
              </div>
              <Switch 
                checked={aiSuggestions} 
                onCheckedChange={(checked) => {
                  setAiSuggestions(checked);
                  toast.success(`AI suggestions ${checked ? 'enabled' : 'disabled'}!`);
                }}
              />
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p>Overspending Alerts</p>
                <p className="text-sm text-gray-600">Get notified when you exceed budget</p>
              </div>
              <Switch 
                checked={notifications.overspending} 
                onCheckedChange={(checked) => {
                  setNotifications(prev => ({ ...prev, overspending: checked }));
                  toast.success(`Overspending alerts ${checked ? 'enabled' : 'disabled'}!`);
                }} 
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p>Monthly Reports</p>
                <p className="text-sm text-gray-600">Receive monthly spending summary</p>
              </div>
              <Switch 
                checked={notifications.monthlyReport} 
                onCheckedChange={(checked) => {
                  setNotifications(prev => ({ ...prev, monthlyReport: checked }));
                  toast.success(`Monthly reports ${checked ? 'enabled' : 'disabled'}!`);
                }} 
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p>Goal Reminders</p>
                <p className="text-sm text-gray-600">Reminders for your financial goals</p>
              </div>
              <Switch 
                checked={notifications.goalReminders} 
                onCheckedChange={(checked) => {
                  setNotifications(prev => ({ ...prev, goalReminders: checked }));
                  toast.success(`Goal reminders ${checked ? 'enabled' : 'disabled'}!`);
                }} 
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p>Budget Alerts</p>
                <p className="text-sm text-gray-600">Notifications when approaching budget limits</p>
              </div>
              <Switch 
                checked={notifications.budgetAlerts} 
                onCheckedChange={(checked) => {
                  setNotifications(prev => ({ ...prev, budgetAlerts: checked }));
                  toast.success(`Budget alerts ${checked ? 'enabled' : 'disabled'}!`);
                }} 
              />
            </div>
          </div>
        );

      case 'savings':
        return (
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Monthly Savings Target</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">{getCurrencySymbol()}</span>
                <Input 
                  type="number"
                  value={savingsTargetInput} 
                  onChange={(e) => setSavingsTargetInput(e.target.value)}
                  placeholder="15000"
                  className="pl-8"
                />
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Current target: {formatAmount(savingsTarget)}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Setting a realistic savings target helps you track your financial progress better.
              </p>
            </div>
            
            {/* Goals List */}
            <div className="space-y-3">
              <h4>Your Goals</h4>
              {goalTargets.map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                  <div key={goal.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{goal.name}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeGoalTarget(goal.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{formatAmount(goal.currentAmount)}</span>
                        <span>{formatAmount(goal.targetAmount)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600">
                        Target: {goal.deadline.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New Goal */}
            <div className="p-3 bg-green-50 rounded-lg space-y-3">
              <h4>Add New Goal</h4>
              <Input
                placeholder="Goal name (e.g., Emergency Fund)"
                value={newGoal.name}
                onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">{getCurrencySymbol()}</span>
                <Input
                  type="number"
                  placeholder="Target amount"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: e.target.value }))}
                  className="pl-8"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">{getCurrencySymbol()}</span>
                <Input
                  type="number"
                  placeholder="Current amount (optional)"
                  value={newGoal.currentAmount}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, currentAmount: e.target.value }))}
                  className="pl-8"
                />
              </div>
              <Input
                type="date"
                value={newGoal.deadline}
                onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
              />
              <Button onClick={handleAddGoalTarget} className="w-full" size="sm">
                Add Goal
              </Button>
            </div>

            <Button onClick={handleUpdateSavingsTarget} className="w-full">Update Savings Target</Button>
          </div>
        );

      case 'export':
        return <PDFExport userSalary={userSalary} />;

      case 'privacy':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="mb-2">Privacy Policy</h4>
              <p className="text-sm text-gray-600 mb-4">
                Your privacy is important to us. All your financial data is stored locally on your device and is never shared with third parties.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Data is stored locally on your device</li>
                <li>• No personal information is shared</li>
                <li>• You can export or delete your data anytime</li>
                <li>• We use secure encryption for data protection</li>
              </ul>
            </div>
          </div>
        );

      case 'accounts':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="mb-2">Linked Accounts</h4>
              <p className="text-sm text-gray-600 mb-4">
                Connect your bank accounts and other financial services for automatic transaction sync.
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Add Bank Account
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Add Credit Card
                </Button>
              </div>
            </div>
          </div>
        );

      case 'budget':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="mb-2">Budget Goals</h4>
              <p className="text-sm text-gray-600 mb-4">
                Set category-wise budget limits to better control your spending.
              </p>
              <div className="space-y-3">
                {budgetGoalsLocal.map((goal, index) => (
                  <div key={goal.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{goal.category}</span>
                      <Switch
                        checked={goal.isActive}
                        onCheckedChange={(checked) => {
                          setBudgetGoalsLocal(prev => prev.map((g, i) => 
                            i === index ? { ...g, isActive: checked } : g
                          ));
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{getCurrencySymbol()}</span>
                      <Input 
                        type="number"
                        className="w-24 h-8 text-sm" 
                        value={goal.amount}
                        onChange={(e) => {
                          setBudgetGoalsLocal(prev => prev.map((g, i) => 
                            i === index ? { ...g, amount: parseFloat(e.target.value) || 0 } : g
                          ));
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={handleSaveBudgetGoals} className="w-full mt-4">Save Budget Goals</Button>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Current Password</label>
              <Input type="password" placeholder="Enter current password" />
            </div>
            <div>
              <label className="block mb-2">New Password</label>
              <Input type="password" placeholder="Enter new password" />
            </div>
            <div>
              <label className="block mb-2">Confirm New Password</label>
              <Input type="password" placeholder="Confirm new password" />
            </div>
            <Button className="w-full">Update Password</Button>
          </div>
        );

      default:
        return null;
    }
  };

  if (activeSection) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveSection(null)}
            className="p-2 h-auto"
          >
            ←
          </Button>
          <h1 className="text-xl capitalize">{activeSection.replace(/([A-Z])/g, ' $1').trim()}</h1>
        </div>
        <Card className="p-4">
          {renderSettingDetail(activeSection)}
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="text-center py-4">
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
          <User className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl mb-1">{profileData.name}</h1>
        <p className="text-gray-600">{profileData.email}</p>
      </div>

      {/* Settings Groups */}
      {settingsGroups.map((group, groupIndex) => (
        <Card key={groupIndex} className="overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <group.icon className="w-5 h-5 text-gray-600" />
              <h3>{group.title}</h3>
            </div>
          </div>
          <div className="divide-y">
            {group.items.map((item, itemIndex) => (
              <div key={itemIndex}>
                {item.action === 'logout' || item.action === 'clear' ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                          item.danger ? 'text-red-600' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {item.action === 'logout' ? 'Sign Out' : 'Clear All Data'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {item.action === 'logout' 
                            ? 'Are you sure you want to sign out? You will need to sign in again to access your account.'
                            : 'This action will permanently delete all your financial data, transactions, and settings. This cannot be undone.'
                          }
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          className={item.danger ? 'bg-red-600 hover:bg-red-700' : ''}
                          onClick={item.action === 'logout' ? handleSignOut : handleClearData}
                        >
                          {item.action === 'logout' ? 'Sign Out' : 'Delete All Data'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <button
                    onClick={() => setActiveSection(item.action)}
                    className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                      item.danger ? 'text-red-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* App Info */}
      <Card className="p-4 text-center">
        <p className="text-sm text-gray-600 mb-2">FinMate</p>
        <p className="text-xs text-gray-500">Version 1.0.0</p>
        <p className="text-xs text-gray-500 mt-2">Made with ❤️ for better financial management</p>
      </Card>
    </div>
  );
}