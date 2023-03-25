// sqlite3 db setup
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('user.db');
db.serialize(() => {
  console.log('Initializing database');
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
    console.log(row);
    if (row['COUNT(*)'] === 0) {
      console.log('Creating default expense categories');
      db.run(
        `INSERT INTO CategoriesExpense (name, target, colour)
        VALUES
          ('🍞 Groceries', 0, '#E0BBE4'),
          ('💲 Rent', 0, '#957DAD'),
          ('⚡ Power', 0, '#D291BC'),
          ('🌐 Internet', 0, '#FEC8D8'),
          ('🏠 Household', 0, '#FFDFD3'),
          ('🍽️ Restaurant', 0, '#FEC8D8'),
          ('😎 Leisure', 0, '#E0BBE4'),
          ('🚌 Public transportation', 0, '#957DAD'),
          ('📈 Investment', 0, '#957DAD'),
          ('📱 Phone', 0, '#D291BC'),
          ('👕 Clothing', 0, '#FEC8D8'),
          ('💋 Vanity', 0, '#FFDFD3'),
          ('🚑 Medical', 0, '#FEC8D8'),
          ('✈️ Travel', 0, '#E0BBE4'),
          ('🔔 Subscription', 0, '#957DAD'),
          ('🎁 Gifts', 0, '#D291BC'),
          ('💸 Debt', 0, '#FEC8D8'),
          ('❓ Other', 0, '#FFDFD3')`
      );
    }
  });
  db.get('SELECT COUNT(*) FROM CategoriesIncome', (err: any, row: any) => {
    console.log(row);
    if (row['COUNT(*)'] === 0) {
      console.log('Creating default income categories');
      db.run(
        `INSERT INTO CategoriesIncome (name, target, colour)
        VALUES
          ('💰 Job', 0, '#E0BBE4'),
          ('🎁 Gift', 0, '#957DAD'),
          ('💲 Tax refund', 0, '#D291BC'),
          ('🔁 Expense reimbursement', 0, '#FEC8D8'),
          ('🪙 Student allowance', 0, '#FFDFD3'),
          ('📈 Investment return', 0, '#FEC8D8'),
          ('❓ Other', 0, '#E0BBE4')`
      );
    }
  });
});

export default db;
