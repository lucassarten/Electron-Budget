// sqlite3 db setup
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('user.db');
db.serialize(() => {
  db.run(
    'CREATE TABLE IF NOT EXISTS Transactions (id INTEGER PRIMARY KEY, date TEXT NOT NULL, description TEXT, amount INTEGER NOT NULL, category TEXT)'
  );
  db.run(
    'CREATE TABLE IF NOT EXISTS CategoriesIncome (name TEXT PRIMARY KEY, target INTEGER NOT NULL DEFAULT 0, colour TEXT NOT NULL DEFAULT "#E0BBE4")'
  );
  db.run(
    'CREATE TABLE IF NOT EXISTS CategoriesExpense (name TEXT PRIMARY KEY, target INTEGER NOT NULL DEFAULT 0, colour TEXT NOT NULL DEFAULT "#E0BBE4")'
  );
  db.get('SELECT COUNT(*) FROM CategoriesIncome', (err: any, row: any) => {
    if (row['COUNT(*)'] === 0) {
      db.run(
        `INSERT INTO CategoriesExpense (name, target, colour)
        VALUES
          ('🍞 Groceries', 0, '#9ba9ff'),
          ('💲 Rent', 0, '#a5adff'),
          ('⚡ Power', 0, '#afb1ff'),
          ('🌐 Internet', 0, '#b9b5ff'),
          ('🏠 Household', 0, '#c4baff'),
          ('🍽️ Restaurant', 0, '#cebeff'),
          ('😎 Leisure', 0, '#d8c2ff'),
          ('🚌 Public transportation', 0, '#e2c6ff'),
          ('📈 Investment', 0, '#eccaff'),
          ('📱 Phone', 0, '#c4c7ff'),
          ('👕 Clothing', 0, '#c1cdf9'),
          ('💋 Vanity', 0, '#c0e1f9'),
          ('🚑 Medical', 0, '#bbdef9'),
          ('✈️ Travel', 0, '#acdcff'),
          ('🔔 Subscription', 0, '#9cd2f7'),
          ('🎁 Gifts', 0, '#89ccf6'),
          ('💸 Debt', 0, '#6aa1f4'),
          ('❓ Other', 0, '#5d97d1')`
      );
    }
  });
  db.get('SELECT COUNT(*) FROM CategoriesIncome', (err: any, row: any) => {
    if (row['COUNT(*)'] === 0) {
      db.run(
        `INSERT INTO CategoriesIncome (name, target, colour)
        VALUES
          ('💰 Job', 0, '#96d289'),
          ('🎁 Gift', 0, '#a9e99b'),
          ('💲 Tax refund', 0, '#bbefa9'),
          ('🔁 Expense reimbursement', 0, '#cdf5b7'),
          ('🪙 Student allowance', 0, '#dbfdd8'),
          ('📈 Investment return', 0, '#ffcae9'),
          ('❓ Other', 0, '#ffa8d9')`
      );
    }
  });
});

export default db;
