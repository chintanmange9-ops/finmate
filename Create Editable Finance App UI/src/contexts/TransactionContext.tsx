import React, { createContext, useContext, useState } from 'react';

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'income' | 'expense';
  source?: string; // Added to track source of transaction (file name, manual, etc.)
}

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addTransactions: (transactions: Omit<Transaction, 'id'>[]) => Promise<void>;
  updateTransaction: (id: string, transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  getTransactionsByPeriod: (startDate: Date, endDate: Date) => Transaction[];
  clearAllTransactions: () => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString()
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const addTransactions = async (newTransactions: Omit<Transaction, 'id'>[]): Promise<void> => {
    return new Promise((resolve) => {
      const transactionsWithIds = newTransactions.map((transaction, index) => ({
        ...transaction,
        id: `${Date.now()}-${index}`
      }));
      
      setTransactions(prev => {
        // Clear all existing transactions (including mock data) when adding bank statement data
        const combined = [...transactionsWithIds];
        return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
      
      // Simulate async operation
      setTimeout(resolve, 100);
    });
  };

  const updateTransaction = (id: string, updatedTransaction: Omit<Transaction, 'id'>) => {
    setTransactions(prev => 
      prev.map(transaction => 
        transaction.id === id 
          ? { ...updatedTransaction, id }
          : transaction
      )
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(transaction => transaction.id !== id));
  };

  const getTransactionsByPeriod = (startDate: Date, endDate: Date): Transaction[] => {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  };

  const clearAllTransactions = () => {
    setTransactions([]);
  };

  return (
    <TransactionContext.Provider value={{
      transactions,
      addTransaction,
      addTransactions,
      updateTransaction,
      deleteTransaction,
      getTransactionsByPeriod,
      clearAllTransactions
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}