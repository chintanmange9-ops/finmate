import React from 'react';
import { Home, List, Brain, TrendingUp, Settings } from 'lucide-react';
import { Page } from '../App';

interface BottomNavigationProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export function BottomNavigation({ currentPage, onPageChange }: BottomNavigationProps) {
  const navItems = [
    { id: 'dashboard' as Page, icon: Home, label: 'Dashboard' },
    { id: 'transactions' as Page, icon: List, label: 'Transactions' },
    { id: 'insights' as Page, icon: Brain, label: 'AI Insights' },
    { id: 'reports' as Page, icon: TrendingUp, label: 'Analytics' },
    { id: 'settings' as Page, icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className="flex flex-col items-center py-2 px-3 min-w-0 flex-1"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-colors ${
                isActive 
                  ? item.id === 'insights' 
                    ? 'bg-green-100' 
                    : 'bg-blue-100'
                  : 'bg-transparent'
              }`}>
                <Icon 
                  className={`w-5 h-5 ${
                    isActive 
                      ? item.id === 'insights'
                        ? 'text-green-600'
                        : 'text-blue-600'
                      : 'text-gray-400'
                  }`} 
                />
              </div>
              <span className={`text-xs ${
                isActive 
                  ? item.id === 'insights'
                    ? 'text-green-600'
                    : 'text-blue-600'
                  : 'text-gray-400'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}