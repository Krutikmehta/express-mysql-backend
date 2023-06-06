const pool = require("../database/index");
const { link } = require("../routes/identity.router");

const insertAsSecondary = async ({ phoneNumber, email, linkedId }) => {
  const [row, field] = await pool.query(
    "insert into contact (phoneNumber,email,linkPrecedence,linkedId) values (?,?,?,?)",
    [phoneNumber, email, "secondary", linkedId]
  );
  console.log("hiehihrie");
};

const insertAsPrimary = async ({ phoneNumber, email }) => {
  const [row, field] = await pool.query(
    "insert into contact (phoneNumber,email,linkPrecedence) values (?,?,?)",
    [phoneNumber, email, "primary"]
  );
  return [row, field];
};

const getPrimaryId = (item) => {
  console.log(item);
  if (item.linkPrecedence === "primary") return item.id;
  return item.linkedId;
};
const updateLinkPrecedence = async ({ linkedId, id }) => {
  console.log(id, linkedId);
  const [row, field] = await pool.query(
    "update contact set linkedId=?, linkPrecedence=? where id=?",
    [linkedId, "secondary", id]
  );
};

const getResponse = async (primaryId) => {
  console.log("getresp", primaryId);
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

const identityController = {
  post: async (req, res) => {
    try {
      const { phoneNumber, email } = req.body;
      const [row, field] = await pool.query(
        "select * from contact where email=? or phoneNumber=? order by createdAt asc",
        [email, phoneNumber]
      );

      if (row.length === 0) {
        const [row, field] = await insertAsPrimary({ phoneNumber, email });
        res.json({
          contact: {
            primaryContatctId: row.insertId,
            emails: [email],
            phoneNumbers: [phoneNumber],
            secondaryContactIds: [],
          },
        });
        return;
      } else {
        const matchedWithPhoneNumber = [];
        const matchedWithEmail = [];
        let matchedWithBoth = false;
        let matchedWithBothObj = {};
        row.forEach((item) => {
          if (item.phoneNumber === phoneNumber && item.email === email) {
            matchedWithBoth = true;
            matchedWithBothObj = item;
            return;
          } else if (item.phoneNumber === phoneNumber)
            matchedWithPhoneNumber.push(item);
          else matchedWithEmail.push(item);
        });

        let primaryId = -1;
        if (matchedWithBoth) {
          primaryId = getPrimaryId(matchedWithBothObj);
        } else {
          const sizePN = matchedWithPhoneNumber.length;
          const sizeEM = matchedWithEmail.length;
          if (sizePN === 0 && sizeEM !== 0) {
            // matched with email, insert as secondary
            const linkedId = matchedWithEmail[0].id;
            primaryId = getPrimaryId(matchedWithEmail[0]);
            console.log("pid", primaryId);
            await insertAsSecondary({ phoneNumber, email, linkedId });
          } else if (sizePN !== 0 && sizeEM === 0) {
            // matched with phone number, insert as primary

            const linkedId = matchedWithPhoneNumber[0].id;
            primaryId = getPrimaryId(matchedWithPhoneNumber[0]);
            await insertAsSecondary({ phoneNumber, email, linkedId });
          } else if (sizePN !== 0 && sizeEM !== 0) {
            // update all (except first) as secondary and with linkedId

            const linkedId = row[0].id;
            primaryId = getPrimaryId(row[0]);
            const ids = [];

            // find the ids to update from primary to secondary
            row.forEach((item) => {
              if (
                item.id !== linkedId &&
                (item.linkedId !== linkedId ||
                  item.linkPrecedence === "primary")
              ) {
                ids.push(item.id);
              }
            });

            // update linkedIds and linkPrecedence
            for (let i = 0; i < ids.length; i++) {
              const id = ids[i];
              await updateLinkPrecedence({ linkedId, id });
            }
          }
        }

        const contact = await getResponse(primaryId);
        res.json({ data: contact });
        return;
      }
    } catch (error) {
      console.log(error);
    }
  },
};

module.exports = identityController;
