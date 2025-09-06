import React, { useState } from 'react';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Plus, Edit2, Trash2, MoreVertical, Utensils, ShoppingCart, Car, TrendingUp, Home, Zap, Heart, GamepadIcon } from 'lucide-react';
import { useTransactions, Transaction } from '../contexts/TransactionContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { TransactionForm } from './TransactionForm';

export function Transactions() {
  const { transactions, deleteTransaction } = useTransactions();
  const { formatAmount } = useAppSettings();
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expenses'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: any } = {
      'Food': Utensils,
      'Shopping': ShoppingCart,
      'Transport': Car,
      'Salary': TrendingUp,
      'Rent': Home,
      'Utilities': Zap,
      'Healthcare': Heart,
      'Entertainment': GamepadIcon,
      'Freelance': TrendingUp,
      'Investment': TrendingUp,
      'Gift': Heart,
      'Other': Car
    };
    return iconMap[category] || Car;
  };

  const getCategoryColor = (category: string, type: 'income' | 'expense') => {
    if (type === 'income') {
      return 'bg-green-100 text-green-600';
    }
    
    const colorMap: { [key: string]: string } = {
      'Food': 'bg-orange-100 text-orange-600',
      'Shopping': 'bg-purple-100 text-purple-600',
      'Transport': 'bg-blue-100 text-blue-600',
      'Rent': 'bg-indigo-100 text-indigo-600',
      'Utilities': 'bg-yellow-100 text-yellow-600',
      'Healthcare': 'bg-red-100 text-red-600',
      'Entertainment': 'bg-pink-100 text-pink-600',
      'Other': 'bg-gray-100 text-gray-600'
    };
    return colorMap[category] || 'bg-gray-100 text-gray-600';
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'income') return transaction.type === 'income';
    if (activeFilter === 'expenses') return transaction.type === 'expense';
    return true;
  });

  const filters = [
    { id: 'all' as const, label: 'All' },
    { id: 'income' as const, label: 'Income' },
    { id: 'expenses' as const, label: 'Expenses' }
  ];

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl mb-0">Transactions</h1>
        <Button 
          onClick={() => setIsFormOpen(true)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.id}
            variant={activeFilter === filter.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(filter.id)}
            className={`rounded-full ${
              activeFilter === filter.id 
                ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {transactions.length === 0 ? (
              <>
                <p>No transactions yet</p>
                <p className="text-sm">Upload bank statements in Settings or add transactions manually</p>
              </>
            ) : (
              <>
                <p>No {activeFilter} transactions found</p>
                <p className="text-sm">Try changing the filter or add a new transaction</p>
              </>
            )}
          </div>
        ) : (
          filteredTransactions.map((transaction) => {
            const Icon = getCategoryIcon(transaction.category);
            const colorClass = getCategoryColor(transaction.category, transaction.type);
            
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="mb-1">{transaction.description}</h4>
                    <p className="text-sm text-gray-500">
                      {transaction.category} • {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className={`text-lg ${
                      transaction.type === 'income' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatAmount(Math.abs(transaction.amount))}
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this transaction? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(transaction.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Transaction Form */}
      <TransactionForm 
        isOpen={isFormOpen}
        onClose={handleFormClose}
        transaction={editingTransaction}
      />
    </div>
  );
}