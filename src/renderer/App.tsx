import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';

import './styles/App.css';
import TransactionsTable from './TransactionsTable';
import Dashboard from './Dashboard';
import TargetTables from './TargetTable';

type Tab = 'dashboard' | 'income' | 'expenses' | 'budgetTargets';

function DashboardView() {
  return <Dashboard />;
}

function IncomeView() {
  return <TransactionsTable type="income" />;
}

function ExpensesView() {
  return <TransactionsTable type="expense" />;
}

function BudgetTargetsView() {
  return <TargetTables />;
}

function MainLayout() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
  };

  return (
    <div>
      <div className="tabs-container">
        <button
          type="button"
          id="tab"
          className={`tab-dashboard ${
            activeTab === 'dashboard' ? 'active' : ''
          }`}
          onClick={() => handleTabClick('dashboard')}
        >
          Dashboard
        </button>
        <button
          type="button"
          id="tab"
          className={`tab-income ${activeTab === 'income' ? 'active' : ''}`}
          onClick={() => handleTabClick('income')}
        >
          Income
        </button>
        <button
          type="button"
          id="tab"
          className={`tab-expenses ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => handleTabClick('expenses')}
        >
          Expenses
        </button>
        <button
          type="button"
          id="tab"
          className={`tab-budgetTargets ${
            activeTab === 'budgetTargets' ? 'active' : ''
          }`}
          onClick={() => handleTabClick('budgetTargets')}
        >
          Budget Targets
        </button>
      </div>

      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'income' && <IncomeView />}
      {activeTab === 'expenses' && <ExpensesView />}
      {activeTab === 'budgetTargets' && <BudgetTargetsView />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />} />
      </Routes>
    </Router>
  );
}
