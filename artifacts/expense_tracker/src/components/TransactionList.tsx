'use client';

import { useState, useMemo } from 'react';
import { Transaction, DEFAULT_CATEGORIES } from '@/lib/types';
import { storage } from '@/lib/storage';
import { format } from 'date-fns';

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionDeleted: () => void;
}

export default function TransactionList({ transactions, onTransactionDeleted }: TransactionListProps) {
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by category
    if (filterCategory) {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Sort transactions
    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return b.amount - a.amount;
      }
    });
  }, [transactions, filterCategory, filterType, sortBy]);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      storage.deleteTransaction(id);
      onTransactionDeleted();
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = DEFAULT_CATEGORIES.find(c => c.name === categoryName);
    return category?.icon || '📦';
  };

  const totalAmount = filteredAndSortedTransactions.reduce((sum, t) => {
    return t.type === 'expense' ? sum - t.amount : sum + t.amount;
  }, 0);

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">
          Transaction History
        </h2>
        <div className="text-right">
          <p className="text-sm text-gray-500">Filtered Total</p>
          <p className={`text-lg font-semibold ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Math.abs(totalAmount).toFixed(2)}
            {totalAmount >= 0 ? ' ↗️' : ' ↘️'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Category
          </label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field text-sm"
          >
            <option value="">All Categories</option>
            {DEFAULT_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Type
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="input-field text-sm"
          >
            <option value="all">All Types</option>
            <option value="expense">💸 Expenses Only</option>
            <option value="income">💰 Income Only</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort by
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="input-field text-sm"
          >
            <option value="date">📅 Date</option>
            <option value="amount">💵 Amount</option>
          </select>
        </div>
      </div>

      {/* Transaction List */}
      {filteredAndSortedTransactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-500 text-lg">No transactions found</p>
          <p className="text-gray-400 text-sm">Start by adding your first expense or income</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="text-2xl">
                  {getCategoryIcon(transaction.category)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {transaction.description}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{transaction.category}</span>
                    <span>•</span>
                    <span>{format(new Date(transaction.date), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {transaction.type === 'expense' ? '-' : '+'}${transaction.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    {transaction.type}
                  </p>
                </div>
                
                <button
                  onClick={() => handleDelete(transaction.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete transaction"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}