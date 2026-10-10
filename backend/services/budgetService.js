const { Budget, FinancialTransaction } = require('../models');

/** Recalculate utilizedAmount of a budget line from COMPLETED expense transactions. */
async function recalcBudget(villageId, financialYear, category) {
  if (!financialYear || !category) return;
  const budget = await Budget.findOne({ villageId, financialYear, category });
  if (!budget) return;
  budget.utilizedAmount = Number(await FinancialTransaction.sum('amount', {
    where: { villageId, financialYear, category, type: 'EXPENSE', status: 'COMPLETED' },
  }) || 0);
  await budget.save();
}

async function recalcAll(villageId) {
  const budgets = await Budget.find({ villageId });
  for (const b of budgets) await recalcBudget(villageId, b.financialYear, b.category);
}

module.exports = { recalcBudget, recalcAll };
