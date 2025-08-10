'use client';

import { useState, useEffect } from 'react';
import { Budget, DEFAULT_CATEGORIES, Transaction } from '@/lib/types';
import { storage, calculateSpending, getCurrentMonthTransactions } from '@/lib/storage';

interface BudgetManagerProps {
  transactions: Transaction[];
}

export default function BudgetManager({ transactions }: BudgetManagerProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [editingCategory, setEditingCategory] = useState<string>('');
  const [editAmount, setEditAmount] = useState<string>('');

  useEffect(() => {
    // Load budgets from storage
    const storedBudgets = storage.getBudgets();
    
    // Calculate current spending for each category
    const currentMonthTransactions = getCurrentMonthTransactions(transactions);
    const updatedBudgets = DEFAULT_CATEGORIES.map(category => {
      const existingBudget = storedBudgets.find(b => b.category === category.name);
      const spent = calculateSpending(currentMonthTransactions, category.name);
      
      return {
        category: category.name,
        amount: existingBudget?.amount || 0,
        spent: spent,
        period: 'monthly' as const
      };
    });
    
    setBudgets(updatedBudgets);
  }, [transactions]);

  const handleSaveBudget = (category: string) => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid amount');
      return;
    }

    storage.updateBudget(category, amount);
    
    // Update local state
    setBudgets(budgets.map(b => 
      b.category === category ? { ...b, amount } : b
    ));
    
    setEditingCategory('');
    setEditAmount('');
  };

  const getBudgetStatus = (budget: Budget) => {
    if (budget.amount === 0) return 'no-budget';
    
    const percentage = (budget.spent / budget.amount) * 100;
    if (percentage <= 50) return 'good';
    if (percentage <= 80) return 'warning';
    return 'danger';
  };

  const getBudgetColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'danger': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = DEFAULT_CATEGORIES.find(c => c.name === categoryName);
    return category?.icon || '📦';
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Monthly Budget Tracker
        </h2>
        <div className="text-right">
          <p className="text-sm text-gray-500">Overall Budget</p>
          <p className={`font-semibold ${totalSpent > totalBudget ? 'text-red-600' : 'text-green-600'}`}>
            ${totalSpent.toFixed(2)} / ${totalBudget.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Overall Progress */}
      {totalBudget > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Total Monthly Progress
            </span>
            <span className="text-sm text-gray-600">
              {((totalSpent / totalBudget) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                totalSpent > totalBudget ? 'bg-red-500' : 'bg-primary-500'
              }`}
              style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Budget Categories */}
      <div className="space-y-4">
        {budgets.map((budget) => {
          const status = getBudgetStatus(budget);
          const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
          const isEditing = editingCategory === budget.category;

          return (
            <div key={budget.category} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{getCategoryIcon(budget.category)}</span>
                  <span className="font-medium text-gray-900">{budget.category}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">$</span>
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                      <button
                        onClick={() => handleSaveBudget(budget.category)}
                        className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => {
                          setEditingCategory('');
                          setEditAmount('');
                        }}
                        className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ${budget.spent.toFixed(2)} / ${budget.amount.toFixed(2)}
                        </p>
                        {budget.amount > 0 && (
                          <p className="text-xs text-gray-500">
                            ${(budget.amount - budget.spent).toFixed(2)} remaining
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setEditingCategory(budget.category);
                          setEditAmount(budget.amount.toString());
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        title="Edit budget"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {budget.amount > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{percentage.toFixed(1)}% used</span>
                    {percentage > 100 && (
                      <span className="text-red-600 font-medium">
                        ${(budget.spent - budget.amount).toFixed(2)} over budget
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getBudgetColor(status)}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">No budget set</p>
                  <button
                    onClick={() => {
                      setEditingCategory(budget.category);
                      setEditAmount('');
                    }}
                    className="text-primary-600 text-sm hover:underline"
                  >
                    Set a budget
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {budgets.some(b => b.amount === 0) && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            💡 Pro Tips for Better Budget Management
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Start with the 50/30/20 rule: 50% needs, 30% wants, 20% savings</li>
            <li>• Set realistic budgets based on your past spending patterns</li>
            <li>• Review and adjust your budgets monthly</li>
            <li>• Use the yellow warning zone (80%) to stay on track</li>
          </ul>
        </div>
      )}
    </div>
  );
}