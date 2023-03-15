/* eslint-disable react/destructuring-assignment */
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar, Pie } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import { Category, Transaction } from './types';

Chart.register(...registerables, ChartDataLabels);

function categoryPieChart(
  categories: Category[],
  transactions: Transaction[],
  type: string
) {
  return (
    <Pie
      data={{
        labels: categories
          .filter((category) => {
            const categoryTransactions = transactions.filter(
              (transaction) => transaction.category === category.name
            );
            return categoryTransactions.length > 0;
          })
          .map((category) => category.name),
        datasets: [
          {
            label: 'Expenses',
            data: categories
              .filter((category) => {
                const categoryTransactions = transactions.filter(
                  (transaction) => transaction.category === category.name
                );
                return categoryTransactions.length > 0;
              })
              .map((category) => {
                const categoryTransactions = transactions.filter(
                  (transaction) => transaction.category === category.name
                );
                if (categoryTransactions.length === 0) {
                  return 0;
                }
                return categoryTransactions.reduce(
                  (acc, transaction) => acc + transaction.amount,
                  0
                );
              }),
            backgroundColor: categories.map(() => {
              const randomColor = Math.floor(Math.random() * 0xffffff).toString(
                16
              );
              return `#${randomColor}`;
            }),
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'left',
          },
          title: {
            display: true,
            text: `${type} by Category`,
            color: 'black',
            position: 'top',
          },
          datalabels: {
            anchor: 'center',
            align: 'center',
            color: 'white',
            clip: false,
            formatter: (value) => `$${Math.round(value)}`,
            font: {
              weight: 'bold',
              size: 16,
            },
          },
        },
      }}
    />
  );
}

function IncomeEarningSavingsComparison(transactions: Transaction[]) {
  const income = transactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((acc, transaction) => acc + transaction.amount, 0);
  const expenses = transactions
    .filter((transaction) => transaction.amount < 0)
    .reduce((acc, transaction) => acc + Math.abs(transaction.amount), 0);
  return (
    // bar graph comparing income, expenses, and savings, the chart will have one bar for each income, expenses, and savings
    // the income bar will be green, the expenses bar will be red, and the savings bar will be blue
    // the income bar will come from the bottom of the chart, the expenses bar will come from the top of the chart, and the savings bar will come from the middle of the chart
    // the income bar will be the sum of all income transactions, the expenses bar will be the sum of all expense transactions, and the savings bar will be the difference between the income and expenses
    <Bar
      data={{
        labels: [''],
        datasets: [
          {
            label: 'Income',
            data: [income],
            backgroundColor: 'green',
            barPercentage: 0.9,
          },
          {
            label: 'Expenses',
            data: [expenses],
            backgroundColor: 'red',
            barPercentage: 0.9,
          },
          {
            label: 'Savings',
            data: [income - expenses],
            backgroundColor: 'blue',
            barPercentage: 0.9,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'left',
          },
          title: {
            display: true,
            text: 'Income, Expenses, and Savings',
            color: 'black',
            position: 'top',
          },
          datalabels: {
            anchor: 'end',
            align: 'top',
            formatter: (value) => `$${Math.round(value)}`,
            font: {
              weight: 'bold',
            },
          },
        },
        // make no gaps between bars
        indexAxis: 'x',

        scales: {
          x: {
            display: true,
            offset: true,
          },
        },
      }}
    />
  );
}

function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoriesIncome, setCategoriesIncome] = useState<Category[]>([]);
  const [categoriesExpense, setCategoriesExpense] = useState<Category[]>([]);

  useEffect(() => {
    window.electron.ipcRenderer.once('db-query-transactions', (resp) => {
      const response = resp as Transaction[];
      setTransactions(response);
    });
    window.electron.ipcRenderer.once('db-query-categories-expense', (resp) => {
      const response = resp as Category[];
      setCategoriesExpense(response);
    });
    window.electron.ipcRenderer.once('db-query-categories-income', (resp) => {
      const response = resp as Category[];
      setCategoriesIncome(response);
    });
    // get categories from db
    window.electron.ipcRenderer.sendMessage('db-query', [
      'db-query-categories-expense',
      `SELECT * FROM CategoriesExpense`,
    ]);
    window.electron.ipcRenderer.sendMessage('db-query', [
      'db-query-categories-income',
      `SELECT * FROM CategoriesIncome`,
    ]);
    // get positive transactions from db
    window.electron.ipcRenderer.sendMessage('db-query', [
      'db-query-transactions',
      `SELECT * FROM Transactions`,
    ]);
  }, []);

  const transactionsExpense = transactions.filter(
    (transaction) => transaction.amount < 0
  );
  const transactionsIncome = transactions.filter(
    (transaction) => transaction.amount > 0
  );
  return (
    // pie chart graphing expense by category
    <div className="dashboard-grid">
      <div className="pie-chart">
        {categoryPieChart(categoriesExpense, transactionsExpense, 'Expenses')}
      </div>
      <div className="pie-chart">
        {categoryPieChart(categoriesIncome, transactionsIncome, 'Income')}
      </div>
      <div className="bar-chart">
        {IncomeEarningSavingsComparison(transactions)}
      </div>
    </div>
  );
}

export default Dashboard;
