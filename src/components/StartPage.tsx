import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { useAppSettings } from '../contexts/AppSettingsContext';

interface StartPageProps {
  onSalarySubmit: (salary: number) => void;
}

export function StartPage({ onSalarySubmit }: StartPageProps) {
  const [salary, setSalary] = useState('');
  const { getCurrencySymbol } = useAppSettings();

  const handleSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const salaryNumber = parseFloat(salary.replace(/,/g, ''));
    if (salaryNumber > 0) {
      onSalarySubmit(salaryNumber);
    }
  };

  const formatSalary = (value: string) => {
    const number = value.replace(/[^\d]/g, '');
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatSalary(e.target.value);
    setSalary(formatted);
  };

  return (
    <div className="p-6 h-screen flex flex-col justify-center">
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-3xl">{getCurrencySymbol()}</span>
        </div>
        <h1 className="text-2xl mb-2">Welcome to Smart Finance</h1>
        <p className="text-gray-600">Let's get started by setting up your monthly salary</p>
        <p className="text-sm text-gray-500 mt-2">
          You can upload bank statements later in Settings for automatic analysis
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSalarySubmit} className="space-y-6">
          <div>
            <label htmlFor="salary" className="block mb-2">
              Monthly Salary
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">{getCurrencySymbol()}</span>
              <Input
                id="salary"
                type="text"
                value={salary}
                onChange={handleSalaryChange}
                placeholder="50,000"
                className="pl-8 text-lg"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
            disabled={!salary || parseFloat(salary.replace(/,/g, '')) <= 0}
          >
            Continue
          </Button>
        </form>
      </Card>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Your financial information is stored securely on your device
        </p>
      </div>
    </div>
  );
}