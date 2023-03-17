/* eslint-disable react/destructuring-assignment */
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar, Pie } from 'react-chartjs-2';
import React = require('react');
import { useEffect, useState } from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
} from '@mui/material';
import { Category, Transaction } from './types';

interface TimePeriod {
  startDate: Date;
  endDate: Date;
}

interface TimePeriodSelectorProps {
  // eslint-disable-next-line no-unused-vars
  onTimePeriodChange: (timePeriod: TimePeriod) => void;
}

const validateDate = (value: Date) => {
  try {
    value.toISOString();
    return true;
  } catch (e) {
    return false;
  }
};

function TimePeriodSelector({ onTimePeriodChange }: TimePeriodSelectorProps) {
  const [selectedOption, setSelectedOption] = useState('all');
  const [startDate, setStartDate] = useState<Date>(new Date(0));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const handleOptionChange = (event: SelectChangeEvent<string>) => {
    setSelectedOption(event.target.value);
    // print start end dates
    let startDateCalc = new Date(0);
    const endDateCalc = new Date();
    switch (event.target.value) {
      case 'lastWeek':
        startDateCalc = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        onTimePeriodChange({
          startDate: startDateCalc,
          endDate: endDateCalc,
        });
        break;
      case 'lastMonth':
        startDateCalc = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        onTimePeriodChange({
          startDate: startDateCalc,
          endDate: endDateCalc,
        });
        setStartDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        break;
      case 'lastThreeMonths':
        startDateCalc = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        onTimePeriodChange({
          startDate: startDateCalc,
          endDate: endDateCalc,
        });
        break;
      case 'lastSixMonths':
        startDateCalc = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
        onTimePeriodChange({
          startDate: startDateCalc,
          endDate: endDateCalc,
        });
        break;
      case 'lastYear':
        startDateCalc = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        onTimePeriodChange({
          startDate: startDateCalc,
          endDate: endDateCalc,
        });
        break;
      case 'custom':
        // do nothing, wait for user to select custom dates
        break;
      default:
        onTimePeriodChange({
          startDate: startDateCalc,
          endDate: endDateCalc,
        });
        break;
    }
    setStartDate(startDateCalc);
    setEndDate(endDateCalc);
  };

  const handleCustomDatesChange = () => {
    onTimePeriodChange({
      startDate,
      endDate,
    });
  };

  const handleStartDateChange = (date: Date) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date: Date) => {
    setEndDate(date);
  };

  return (
    <>
      <FormControl>
        <InputLabel id="timePeriodSelectLabel">Time Period</InputLabel>
        <Select
          labelId="timePeriodSelectLabel"
          className="time-period-selector"
          id="timePeriodSelect"
          value={selectedOption}
          label="Time Period"
          onChange={handleOptionChange}
        >
          <MenuItem value="lastWeek">Last Week</MenuItem>
          <MenuItem value="lastMonth">Last Month</MenuItem>
          <MenuItem value="lastThreeMonths">Last 3 Months</MenuItem>
          <MenuItem value="lastSixMonths">Last 6 Months</MenuItem>
          <MenuItem value="lastYear">Last Year</MenuItem>
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="custom">Custom</MenuItem>
        </Select>
      </FormControl>
      <div className="time-period-custom-container">
        <TextField
          label="Start Date"
          id="startDatePicker"
          onChange={(e) => {
            handleStartDateChange(new Date(e.target.value));
            handleCustomDatesChange();
          }}
          type="date"
          InputLabelProps={{
            shrink: true,
          }}
          disabled={selectedOption !== 'custom'}
          value={
            validateDate(startDate) ? startDate.toISOString().split('T')[0] : ''
          }
        />
        <TextField
          label="End Date"
          id="endDatePicker"
          onChange={(e) => {
            handleEndDateChange(new Date(e.target.value));
            handleCustomDatesChange();
          }}
          type="date"
          InputLabelProps={{
            shrink: true,
          }}
          disabled={selectedOption !== 'custom'}
          value={
            validateDate(endDate) ? endDate.toISOString().split('T')[0] : ''
          }
        />
      </div>
    </>
  );
}

Chart.register(...registerables, ChartDataLabels);

function categoryPieChart(
  type: string,
  categories: Category[],
  transactions: Transaction[]
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
            text: `${type ? 'Income' : 'Expenses'} by Category`,
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
  const [timePeriod, setTimePeriod] = useState<TimePeriod>({
    startDate: new Date(0),
    endDate: new Date(),
  });

  useEffect(() => {
    // get transactions from db between time period
    window.electron.ipcRenderer.once('db-query-transactions', (resp) => {
      const response = resp as Transaction[];
      // filter out transactions that are not in the time period
      const filteredTransactions = response.filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          transactionDate >= timePeriod.startDate &&
          transactionDate <= timePeriod.endDate
        );
      });
      console.log(filteredTransactions.length);
      setTransactions(filteredTransactions);
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
    // get transactions from db between time period
    window.electron.ipcRenderer.sendMessage('db-query', [
      'db-query-transactions',
      `SELECT * FROM Transactions`,
    ]);
  }, [timePeriod]);

  const transactionsExpense = transactions.filter(
    (transaction) => transaction.amount < 0
  );
  const transactionsIncome = transactions.filter(
    (transaction) => transaction.amount > 0
  );
  return (
    <div className="dashboard-container">
      <div className="time-period-selector-container">
        <TimePeriodSelector onTimePeriodChange={setTimePeriod} />
      </div>
      <div className="dashboard-grid">
        <div className="pie-chart-container">
          {categoryPieChart('Expense', categoriesExpense, transactionsExpense)}
        </div>
        <div className="pie-chart-container">
          {categoryPieChart('Income', categoriesIncome, transactionsIncome)}
        </div>
        <div className="bar-chart-container">
          {IncomeEarningSavingsComparison(transactions)}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
