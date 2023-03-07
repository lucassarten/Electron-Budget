import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import './App.css';

type Tab = 'dashboard' | 'income' | 'expenses' | 'budgetTargets';

function Dashboard() {
  return <h1>Dashboard view</h1>;
}

function Income() {
  return <h1>Income view</h1>;
}

function Expenses() {
  return <h1>Expenses view</h1>;
}

function BudgetTargets() {
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
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabClick('dashboard')}
        >
          Dashboard
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'income' ? 'active' : ''}`}
          onClick={() => handleTabClick('income')}
        >
          Income
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => handleTabClick('expenses')}
        >
          Expenses
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'budgetTargets' ? 'active' : ''}`}
          onClick={() => handleTabClick('budgetTargets')}
        >
          Budget Targets
        </button>
      </div>

      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'income' && <Income />}
      {activeTab === 'expenses' && <Expenses />}
      {activeTab === 'budgetTargets' && <BudgetTargets />}
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
