import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';

import './App.css';
import './TransactionsTable.css';
import './TabBar.css';
import './Dashboard.css';
import TransactionsTable from './TransactionsTable';
import Dashboard from './Dashboard';

type Tab = 'dashboard' | 'income' | 'expenses' | 'budgetTargets';

function DashboardView() {
  return <Dashboard />;
}

function IncomeView() {
  return <TransactionsTable />;
}

function ExpensesView() {
  return <h1>Expenses view</h1>;
}

function BudgetTargetsView() {
  return <h1>Budget Targets view</h1>;
}

function MainLayout() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="App">
      <div className="tabs">
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
