'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/lib/types';
import { storage } from '@/lib/storage';
import Dashboard from '@/components/Dashboard';
import ExpenseForm from '@/components/ExpenseForm';
import TransactionList from '@/components/TransactionList';
import BudgetManager from '@/components/BudgetManager';

type Tab = 'dashboard' | 'add-expense' | 'transactions' | 'budgets';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Load transactions on component mount
    const loadedTransactions = storage.getTransactions();
    setTransactions(loadedTransactions);
  }, []);

  const refreshTransactions = () => {
    const updatedTransactions = storage.getTransactions();
    setTransactions(updatedTransactions);
  };

  const TabButton = ({ tab, label, icon }: { tab: Tab; label: string; icon: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
        activeTab === tab
          ? 'bg-primary-600 text-white'
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 p-1 bg-gray-100 rounded-lg">
        <TabButton tab="dashboard" label="Dashboard" icon="📊" />
        <TabButton tab="add-expense" label="Add Expense" icon="➕" />
        <TabButton tab="transactions" label="History" icon="📋" />
        <TabButton tab="budgets" label="Budgets" icon="🎯" />
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <Dashboard transactions={transactions} />
      )}

      {activeTab === 'add-expense' && (
        <div className="max-w-lg mx-auto">
          <ExpenseForm onTransactionAdded={refreshTransactions} />
        </div>
      )}

      {activeTab === 'transactions' && (
        <TransactionList 
          transactions={transactions}
          onTransactionDeleted={refreshTransactions}
        />
      )}

      {activeTab === 'budgets' && (
        <BudgetManager transactions={transactions} />
      )}

      {/* Footer */}
      <footer className="text-center py-8 text-gray-500 text-sm">
        <p>
          Built with ❤️ to help you take control of your finances
        </p>
        <p className="mt-2">
          Your data is stored locally in your browser for privacy
        </p>
      </footer>
    </div>
  );
}