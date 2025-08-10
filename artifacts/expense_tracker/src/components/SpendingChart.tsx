'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

interface CategorySpending {
  category: string;
  amount: number;
  icon: string;
  color: string;
}

interface SpendingChartProps {
  categorySpending: CategorySpending[];
  title: string;
}

export default function SpendingChart({ categorySpending, title }: SpendingChartProps) {
  if (categorySpending.length === 0) {
    return null;
  }

  // Prepare data for doughnut chart
  const doughnutData = {
    labels: categorySpending.map(item => item.category),
    datasets: [
      {
        data: categorySpending.map(item => item.amount),
        backgroundColor: categorySpending.map(item => item.color),
        borderColor: categorySpending.map(item => item.color),
        borderWidth: 2,
        hoverBackgroundColor: categorySpending.map(item => item.color + '80'),
        hoverBorderWidth: 3,
      },
    ],
  };

  // Prepare data for bar chart
  const barData = {
    labels: categorySpending.map(item => `${item.icon} ${item.category}`),
    datasets: [
      {
        label: 'Amount Spent ($)',
        data: categorySpending.map(item => item.amount),
        backgroundColor: categorySpending.map(item => item.color + '80'),
        borderColor: categorySpending.map(item => item.color),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const total = categorySpending.reduce((sum, item) => sum + item.amount, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: $${context.parsed.toFixed(2)} (${percentage}%)`;
          },
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Amount: $${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value;
          },
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
        {title}
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Doughnut Chart */}
        <div>
          <h4 className="text-lg font-medium text-gray-700 mb-4 text-center">
            Category Distribution
          </h4>
          <div className="relative" style={{ height: '300px' }}>
            <Doughnut data={doughnutData} options={chartOptions} />
          </div>
        </div>

        {/* Bar Chart */}
        <div>
          <h4 className="text-lg font-medium text-gray-700 mb-4 text-center">
            Spending by Category
          </h4>
          <div className="relative" style={{ height: '300px' }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">Total Spent</p>
            <p className="text-lg font-semibold text-gray-900">
              ${categorySpending.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Categories</p>
            <p className="text-lg font-semibold text-gray-900">
              {categorySpending.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Avg per Category</p>
            <p className="text-lg font-semibold text-gray-900">
              ${(categorySpending.reduce((sum, item) => sum + item.amount, 0) / categorySpending.length).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}