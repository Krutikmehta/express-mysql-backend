const pool = require("../database/index");

const insertAsSecondary = async ({ phoneNumber, email, linkedId }) => {
  const [row, field] = await pool.query(
    "insert into contact (phoneNumber,email,linkPrecedence,linkedId) values (?,?,?,?)",
    [phoneNumber, email, "secondary", linkedId]
  );
};

const insertAsPrimary = async ({ phoneNumber, email }) => {
  const [row, field] = await pool.query(
    "insert into contact (phoneNumber,email,linkPrecedence) values (?,?,?)",
    [phoneNumber, email, "primary"]
  );
  return [row, field];
};

const getPrimaryId = (item) => {
  if (item.linkPrecedence === "primary") return item.id;
  return item.linkedId;
};
const updateLinkPrecedence = async ({ linkedId, id }) => {
  const [row, field] = await pool.query(
    "update contact set linkedId=?, linkPrecedence=? where id=?",
    [linkedId, "secondary", id]
  );
};

const getResponse = async (primaryId) => {
  const contact = {
    primaryContatctId: primaryId,
    emails: [],
    phoneNumbers: [],
    secondaryContactIds: [],
  };

  const [row, field] = await pool.query(
    "select email, phoneNumber,id from contact where linkedId = ? or id = ?",
    [primaryId, primaryId]
  );
  row.forEach((item) => {
    if (item.id === primaryId) {
      contact.emails.unshift(item.email);
      contact.phoneNumbers.unshift(item.phoneNumber);
      return;
    }
    contact.emails.push(item.email);
    contact.phoneNumbers.push(item.phoneNumber);
    contact.secondaryContactIds.push(item.id);
  });

  return contact;
};

module.exports = {
  getPrimaryId,
  insertAsPrimary,
  insertAsSecondary,
  updateLinkPrecedence,
  getResponse,
};
