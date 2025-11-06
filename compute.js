'use strict';

function toNumberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function fixed6(n) {
  return +Number(n).toFixed(6);
}

function computeLineValues(line) {
  const soQty = toNumberOrZero(line?.so_qty);
  const soRate = toNumberOrZero(line?.so_rate);
  const approvedQty = toNumberOrZero(line?.approved_qty);
  const approvedRate = toNumberOrZero(line?.approved_rate);

  return {
    so_val: fixed6(soQty * soRate),
    approved_val: fixed6(approvedQty * approvedRate)
  };
}

module.exports = {
  computeLineValues
};



