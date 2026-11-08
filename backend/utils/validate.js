const STATUSES = ["todo", "in_progress", "done"];
const PRIORITIES = ["low", "medium", "high"];
const ROLES = ["admin", "member"];

// Today's date as YYYY-MM-DD
function today() {
  return new Date().toISOString().slice(0, 10);
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function isPastDate(value) {
  return value < today();
}

module.exports = { STATUSES, PRIORITIES, ROLES, today, isValidEmail, isValidDate, isPastDate };
