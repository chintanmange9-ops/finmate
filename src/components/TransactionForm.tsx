import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useTransactions, Transaction } from '../contexts/TransactionContext';
import { useAppSettings } from '../contexts/AppSettingsContext';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
}

export function TransactionForm({ isOpen, onClose, transaction }: TransactionFormProps) {
  const { addTransaction, updateTransaction } = useTransactions();
  const { getCurrencySymbol } = useAppSettings();
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'income' | 'expense'
  });

  const categories = {
    expense: ['Food', 'Transport', 'Shopping', 'Rent', 'Utilities', 'Entertainment', 'Healthcare', 'Other'],
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']
  };

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: Math.abs(transaction.amount).toString(),
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
        type: transaction.type
      });
    } else {
      setFormData({
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        type: 'expense'
      });
    }
  }, [transaction, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category || !formData.description) {
      return;
    }

    const amount = parseFloat(formData.amount);
    const transactionData = {
      amount: formData.type === 'expense' ? -amount : amount,
      category: formData.category,
      description: formData.description,
      date: formData.date,
      type: formData.type
    };

    if (transaction) {
      updateTransaction(transaction.id, transactionData);
    } else {
      addTransaction(transactionData);
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Edit Transaction' : 'Add New Transaction'}
          </DialogTitle>
          <DialogDescription>
            {transaction ? 'Update the transaction details below.' : 'Fill in the details to add a new transaction.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2">Type</label>
            <Select 
              value={formData.type} 
              onValueChange={(value: 'income' | 'expense') => setFormData(prev => ({ ...prev, type: value, category: '' }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">{getCurrencySymbol()}</span>
              <Input
                type="number"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="pl-8"
                required
              />
            </div>
          </div>

          <div>
            <label className="block mb-2">Category</label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories[formData.type].map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block mb-2">Description</label>
            <Input
              placeholder="Enter description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block mb-2">Date</label>
            <Input
              type="date"
              value={formData.date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {transaction ? 'Update' : 'Add'} Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}