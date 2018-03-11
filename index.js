const seedrandom = require('seedrandom');
const uuid = require('uuid/v4');
const _ = require('lodash');

const names = require('./names');
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function makeRandomCustomerID() {
  return uuid();
}

function makeRandomName() {
  return names[Math.floor(Math.random() * names.length)];
}

// make and return an array of customer IDs
function makeCustomerIDs(count = 1000) {
  const ids = [];
  while (ids.length < count) {
    ids.push(makeRandomCustomerID());
  }
  return ids;
}

// Make and return an array of customer objects using the provided array
// of customer IDs
function makeCustomersDatabaseForIDs(ids) {
  const customers = ids.map(id => {
    return {
      firstName: makeRandomName(),
      lastName: makeRandomName(),
      id: id
    };
  });
  return customers;
}

// Randomly pulls out and returns a customer from the customerIDs array
function getRandomCustomerID(customerIDs) {
  return customerIDs[Math.floor(Math.random() * customerIDs.length)];
}

// make and return an array of simple transactions
function makeTransactionsDatabase(customerIDs, transactionCount = 100000) {
  const transactions = [];
  while (transactions.length < transactionCount) {
    transactions.push({
      amount: parseFloat(_.random(-10, 1000, true).toFixed(2)),
      date: Date.now() - _.random(3 * MS_PER_DAY, 733 * MS_PER_DAY),
      customerID: getRandomCustomerID(customerIDs)
    });
  }
  return transactions;
}

// takes an array of transactions and filters out only those that are within
// the date range
function filterTransactionsByDate(transactions, minDate, maxDate) {
  return transactions
    .filter(
      transaction => transaction.date >= minDate && transaction.date <= maxDate
    )
    .sort((a, b) => a.date - b.date);
}

function getTopCustomers(transactions, customersDB, minDate, maxDate) {
  const filteredTransactions = filterTransactionsByDate(
    transactions,
    minDate,
    maxDate
  );
  // now we need to reduce the transactions to a new array, one entry for each customerID
  const aggregates = filteredTransactions.reduce((aggregates, transaction) => {
    // try to find the aggregate for this customer ID
    let thisAggregate = _.find(aggregates, {
      customerID: transaction.customerID
    });
    // or make a new aggregate if we don't find one
    if (!thisAggregate) {
      thisAggregate = {
        customerID: transaction.customerID,
        totalRevenue: 0,
        totalVisits: 0,
        lastVisit: 0
      };
      aggregates.push(thisAggregate);
    }
    thisAggregate.totalRevenue += transaction.amount;
    thisAggregate.totalVisits += 1;
    thisAggregate.lastVisit = transaction.date;
    return aggregates;
  }, []);
  // then we can inflate the customer info for each aggregate
  aggregates.forEach(customer => {
    const customerData = _.find(customerDB, { id: customer.customerID });
    customer.info = customerData;
  });
  return aggregates;
}

const customerIDs = makeCustomerIDs();
const customerDB = makeCustomersDatabaseForIDs(customerIDs);
const transactions = makeTransactionsDatabase(customerIDs);
const topCustomers = getTopCustomers(
  transactions,
  customerDB,
  Date.now() - 100 * MS_PER_DAY,
  Date.now()
);
console.log(
  topCustomers.sort((a, b) => b.totalVisits - a.totalVisits).slice(0, 10)
);
