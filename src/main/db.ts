// sqlite3 db setup
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('user.db');
db.serialize(() => {
  console.log('Initializing database');
  db.run(
    'CREATE TABLE IF NOT EXISTS Transactions (id INTEGER PRIMARY KEY, date TEXT NOT NULL, description TEXT, amount INTEGER NOT NULL, category TEXT)'
  );
  db.run(
    'CREATE TABLE IF NOT EXISTS CategoriesIncome (name TEXT PRIMARY KEY, target INTEGER NOT NULL DEFAULT 0)'
  );
  db.run(
    'CREATE TABLE IF NOT EXISTS CategoriesExpense (name TEXT PRIMARY KEY, target INTEGER NOT NULL DEFAULT 0)'
  );
  db.get('SELECT COUNT(*) FROM CategoriesIncome', (err: any, row: any) => {
    console.log(row);
    if (row['COUNT(*)'] === 0) {
      console.log('Creating default expense categories');
      db.run(
        `INSERT INTO CategoriesExpense (name)
        VALUES
          ('🍞 Groceries'),
          ('💲 Rent'),
          ('⚡ Power'),
          ('🌐 Internet'),
          ('🏠 Household'),
          ('🍽️ Restaurant'),
          ('😎 Leisure'),
          ('🚌 Public transportation'),
          ('📈 Investment'),
          ('📱 Phone'),
          ('👕 Clothing'),
          ('💋 Vanity'),
          ('🚑 Medical'),
          ('✈️ Travel'),
          ('🔔 Subscription'),
          ('🎁 Gifts'),
          ('💸 Debt'),
          ('❓ Other')`
      );
    }
  });
  db.get('SELECT COUNT(*) FROM CategoriesExpense', (err: any, row: any) => {
    console.log(row);
    if (row['COUNT(*)'] === 0) {
      console.log('Creating default income categories');
      db.run(
        `INSERT INTO CategoriesIncome (name)
        VALUES
          ('💰 Job'),
          ('🎁 Gift'),
          ('💲 Tax refund'),
          ('🔁 Expense reimbursement'),
          ('🪙 Student allowance'),
          ('📈 Investment return'),
          ('❓ Other')`
      );
    }
  });
});

export default db;
