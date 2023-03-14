// sqlite3 db setup
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('user.db');
db.serialize(() => {
  console.log('Initializing database');
  db.run('PRAGMA journal_mode = DELETE');
  db.run(
    'CREATE TABLE IF NOT EXISTS Transactions (id INTEGER PRIMARY KEY, date TEXT NOT NULL, description TEXT, amount INTEGER NOT NULL, category TEXT)'
  );
  db.run(
    'CREATE TABLE IF NOT EXISTS Categories (id INTEGER PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, target INTEGER NULL DEFAULT NULL)'
  );
  // do this only if the table is empty
  db.get('SELECT COUNT(*) FROM Categories', (err: any, row: any) => {
    console.log(row);
    if (row['COUNT(*)'] === 0) {
      console.log('Creating default categories');
      db.run(
        `INSERT INTO Categories (name, type)
        VALUES
          ('🍞 Groceries', 'expense'),
          ('💲 Rent', 'expense'),
          ('⚡ Power', 'expense'),
          ('🌐 Internet', 'expense'),
          ('🏠 Household', 'expense'),
          ('🍽️ Restaurant', 'expense'),
          ('😎 Leisure', 'expense'),
          ('🚌 Public transportation', 'expense'),
          ('📈 Investment', 'expense'),
          ('📱 Phone', 'expense'),
          ('👕 Clothing', 'expense'),
          ('💋 Vanity', 'expense'),
          ('🚑 Medical', 'expense'),
          ('✈️ Travel', 'expense'),
          ('🔔 Subscription', 'expense'),
          ('🎁 Gifts', 'expense'),
          ('💸 Debt', 'expense'),
          ('❓ Other', 'expense')`
      );
    }
    db.run(
      `INSERT INTO Categories (name, type)
      VALUES
        ('💰 Job', 'income'),
        ('🎁 Gift', 'income'),
        ('💲 Tax refund', 'income'),
        ('🔁 Expense reimbursement', 'income'),
        ('🪙 Student allowance', 'income'),
        ('📈 Investment return', 'income'),
        ('❓ Other', 'income')`
    );
  });
});

export default db;
