'use client';

import { useMemo } from 'react';
import { Transaction, DEFAULT_CATEGORIES } from '@/lib/types';
import { getCurrentMonthTransactions, calculateSpending } from '@/lib/storage';
import SpendingChart from './SpendingChart';

interface DashboardProps {
  transactions: Transaction[];
}

export default function Dashboard({ transactions }: DashboardProps) {
  const currentMonthTransactions = getCurrentMonthTransactions(transactions);
  
  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate spending by category for current month
    const categorySpending = DEFAULT_CATEGORIES.map(category => ({
      category: category.name,
      amount: calculateSpending(currentMonthTransactions, category.name),
      icon: category.icon,
      color: category.color
    })).filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    
    return {
      totalIncome,
      totalExpenses,
      monthlyIncome,
      monthlyExpenses,
      categorySpending,
      totalTransactions: transactions.length,
      monthlyTransactions: currentMonthTransactions.length
    };
  }, [transactions, currentMonthTransactions]);

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome to Your Financial Dashboard
          </h2>
          <p className="text-gray-600">
            Track your spending, manage budgets, and take control of your finances
          </p>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="text-3xl mb-2">💰</div>
          <h3 className="text-lg font-semibold text-gray-800">Total Income</h3>
          <p className="text-2xl font-bold text-green-600">
            ${stats.totalIncome.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">All time</p>
        </div>

        <div className="card text-center">
          <div className="text-3xl mb-2">💸</div>
          <h3 className="text-lg font-semibold text-gray-800">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-600">
            ${stats.totalExpenses.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">All time</p>
        </div>

        <div className="card text-center">
          <div className="text-3xl mb-2">📅</div>
          <h3 className="text-lg font-semibold text-gray-800">This Month</h3>
          <p className="text-2xl font-bold text-primary-600">
            ${stats.monthlyExpenses.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">{currentMonth}</p>
        </div>

        <div className="card text-center">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="text-lg font-semibold text-gray-800">Net Worth</h3>
          <p className={`text-2xl font-bold ${
            stats.totalIncome - stats.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ${(stats.totalIncome - stats.totalExpenses).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">Income - Expenses</p>
        </div>
      </div>

      {/* Monthly Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {currentMonth} Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">💰</span>
                <span className="font-medium text-gray-800">Income</span>
              </div>
              <span className="font-semibold text-green-600">
                ${stats.monthlyIncome.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">💸</span>
                <span className="font-medium text-gray-800">Expenses</span>
              </div>
              <span className="font-semibold text-red-600">
                ${stats.monthlyExpenses.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">💵</span>
                <span className="font-medium text-gray-800">Net Income</span>
              </div>
              <span className={`font-bold ${
                stats.monthlyIncome - stats.monthlyExpenses >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${(stats.monthlyIncome - stats.monthlyExpenses).toFixed(2)}
              </span>
            </div>
            
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Transactions this month:</span>
                <span className="font-medium">{stats.monthlyTransactions}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Categories */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Top Spending Categories
          </h3>
          {stats.categorySpending.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-500">No expenses this month</p>
              <p className="text-gray-400 text-sm">Start tracking to see your spending patterns</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.categorySpending.slice(0, 5).map((item, index) => {
                const percentage = (item.amount / stats.monthlyExpenses) * 100;
                return (
                  <div key={item.category} className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                      <span className="text-sm">{item.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-800">{item.category}</span>
                        <div className="text-right">
                          <span className="font-semibold text-gray-900">
                            ${item.amount.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ 
                            backgroundColor: item.color,
                            width: `${percentage}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {stats.categorySpending.length > 5 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  And {stats.categorySpending.length - 5} more categories...
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Spending Chart */}
      {stats.categorySpending.length > 0 && (
        <SpendingChart 
          categorySpending={stats.categorySpending}
          title={`${currentMonth} Spending Breakdown`}
        />
      )}

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <div className="text-3xl mb-2">📝</div>
            <h4 className="font-semibold text-gray-800 mb-2">Add Expense</h4>
            <p className="text-sm text-gray-600">
              Track a new purchase or expense
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <div className="text-3xl mb-2">🎯</div>
            <h4 className="font-semibold text-gray-800 mb-2">Set Budgets</h4>
            <p className="text-sm text-gray-600">
              Plan your monthly spending goals
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <div className="text-3xl mb-2">📈</div>
            <h4 className="font-semibold text-gray-800 mb-2">View Reports</h4>
            <p className="text-sm text-gray-600">
              Analyze your financial patterns
            </p>
          </div>
        </div>
      </div>

      {/* Tips */}
      {stats.totalTransactions < 10 && (
        <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Getting Started Tips
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Add your regular expenses (rent, groceries, utilities)</li>
                <li>• Set realistic monthly budgets for each category</li>
                <li>• Check your progress weekly to stay on track</li>
                <li>• Use the transaction filters to analyze spending patterns</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}