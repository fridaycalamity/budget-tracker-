import { v4 as uuidv4 } from 'uuid';
import { subDays, format } from 'date-fns';
import type { Transaction } from '../types';

/**
 * Generates sample seed data for initial application load
 * Creates 15-20 realistic transactions spanning current and previous month
 * 
 * Seed data includes:
 * - Mix of income and expense transactions
 * - Variety of categories represented
 * - Realistic Philippine Peso amounts
 * - Dates distributed across current and previous month
 * 
 * @returns Array of sample transactions
 * 
 * @example
 * const seedTransactions = generateSeedData();
 * console.log(seedTransactions.length); // 18 transactions
 */
export function generateSeedData(): Transaction[] {
  const now = new Date();
  const transactions: Transaction[] = [];
  
  // Helper function to create a transaction
  const createTransaction = (
    daysAgo: number,
    description: string,
    amount: number,
    type: 'income' | 'expense',
    category: Transaction['category']
  ): Transaction => {
    const date = subDays(now, daysAgo);
    return {
      id: uuidv4(),
      description,
      amount,
      type,
      category,
      date: format(date, 'yyyy-MM-dd'),
      createdAt: date.toISOString(),
    };
  };
  
  // Income transactions (2-3 per month)
  transactions.push(
    createTransaction(5, 'Monthly Salary', 45000, 'income', 'Salary'),
    createTransaction(35, 'Monthly Salary', 45000, 'income', 'Salary'),
    createTransaction(12, 'Freelance Project', 8500, 'income', 'Freelance')
  );
  
  // Food expenses (frequent, smaller amounts)
  transactions.push(
    createTransaction(1, 'Grocery Shopping', 2500, 'expense', 'Food'),
    createTransaction(3, 'Restaurant Dinner', 1200, 'expense', 'Food'),
    createTransaction(7, 'Coffee Shop', 350, 'expense', 'Food'),
    createTransaction(15, 'Grocery Shopping', 2800, 'expense', 'Food'),
    createTransaction(22, 'Fast Food', 450, 'expense', 'Food'),
    createTransaction(28, 'Grocery Shopping', 2300, 'expense', 'Food')
  );
  
  // Transport expenses
  transactions.push(
    createTransaction(2, 'Grab Rides', 850, 'expense', 'Transport'),
    createTransaction(10, 'Gas Station', 2000, 'expense', 'Transport'),
    createTransaction(25, 'Grab Rides', 650, 'expense', 'Transport')
  );
  
  // Bills (monthly recurring)
  transactions.push(
    createTransaction(8, 'Electricity Bill', 3500, 'expense', 'Bills'),
    createTransaction(9, 'Internet Bill', 1699, 'expense', 'Bills'),
    createTransaction(38, 'Electricity Bill', 3200, 'expense', 'Bills')
  );
  
  // Entertainment
  transactions.push(
    createTransaction(14, 'Movie Tickets', 800, 'expense', 'Entertainment'),
    createTransaction(20, 'Netflix Subscription', 549, 'expense', 'Entertainment')
  );
  
  // Shopping
  transactions.push(
    createTransaction(18, 'Clothing Store', 3500, 'expense', 'Shopping')
  );
  
  // Healthcare
  transactions.push(
    createTransaction(30, 'Pharmacy', 850, 'expense', 'Healthcare')
  );
  
  // Sort transactions by date (newest first)
  transactions.sort((a, b) => b.date.localeCompare(a.date));
  
  return transactions;
}
