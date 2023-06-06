const pool = require("../database/index");
const { link } = require("../routes/identity.router");

const identityController = {
  post: async (req, res) => {
    try {
      const { phoneNumber, email } = req.body;
      const [row, field] = await pool.query(
        "select * from contact where email=? or phoneNumber=? order by createdAt asc",
        [email, phoneNumber]
      );

      if (row.length === 0) {
        console.log("inserting data");
        const [row, field] = await pool.query(
          "insert into contact (phoneNumber,email,linkPrecedence) values (?,?,?)",
          [phoneNumber, email, "primary"]
        );
        res.json({ data: row });
        return;
      } else {
        const matchedWithPhoneNumber = [];
        const matchedWithEmail = [];
        let matchedWithBoth = false;
        row.forEach((item) => {
          if (item.phoneNumber === phoneNumber && item.email === email) {
            console.log("matched with both");
            matchedWithBoth = true;
            return;
          } else if (item.phoneNumber === phoneNumber)
            matchedWithPhoneNumber.push(item);
          else matchedWithEmail.push(item);
        });
        if (matchedWithBoth) return;
        const sizePN = matchedWithPhoneNumber.length;
        const sizeEM = matchedWithEmail.length;

        if (sizePN === 0 && sizeEM !== 0) {
          // matched with email
          // insert as secondary
          console.log("matched email");
          const linkedId = matchedWithEmail[0].id;
          const [row, field] = await pool.query(
            "insert into contact (phoneNumber,email,linkPrecedence,linkedId) values (?,?,?,?)",
            [phoneNumber, email, "secondary", linkedId]
          );
        } else if (sizePN !== 0 && sizeEM === 0) {
          // matched with phone number
          // insert as primary
          console.log("matched number");
          const linkedId = matchedWithPhoneNumber[0].id;
          const [row, field] = await pool.query(
            "insert into contact (phoneNumber,email,linkPrecedence,linkedId) values (?,?,?,?)",
            [phoneNumber, email, "secondary", linkedId]
          );
        } else if (sizePN !== 0 && sizeEM !== 0) {
          // update except first as secondary and with linkedId
          console.log("matched both");
          const linkedId = row[0].id;
          const ids = [];
          row.forEach((item) => {
            console.log("item", item.id);
            if (
              item.id !== linkedId &&
              (item.linkedId !== linkedId || item.linkPrecedence === "primary")
            ) {
              console.log(item, linkedId);
              ids.push(item.id);
            }
          });

          for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            console.log("id", id);
            const [row, field] = await pool.query(
              "update contact set linkedId=?, linkPrecedence=? where id=?",
              [linkedId, "secondary", id]
            );
            console.log("row", row);
          }
        }
        res.json({ data: "got it" });
        return;
      }
    } catch (error) {
      console.log(error);
    }
  },
};

module.exports = identityController;
