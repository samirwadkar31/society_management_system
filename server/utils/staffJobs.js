const TRADE = {
  plumbing: 'plumber',
  electrical: 'electrician',
  housekeeping: 'housekeeping',
  lift: 'lift',
  other: 'general',
  security: 'general'
};

function catsForStaff(staffType) {
  return Object.entries(TRADE)
    .filter(([, t]) => t === staffType)
    .map(([c]) => c);
}

function staffJobFilter(user) {
  const cats = catsForStaff(user.staffType);
  const q = [{ assignedTo: user._id }];
  if (cats.length) {
    q.push({ assignedTo: null, category: { $in: cats } });
    q.push({ assignedTo: { $exists: false }, category: { $in: cats } });
  }
  return { $or: q };
}

function canTake(user, complaint) {
  if (String(complaint.assignedTo) === String(user._id)) return true;
  return !complaint.assignedTo && TRADE[complaint.category] === user.staffType;
}

module.exports = { TRADE, catsForStaff, staffJobFilter, canTake };
