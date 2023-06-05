const pool = require("../database/index");

const identityController = {
  post: async (req, res) => {
    try {
      const { phoneNumber, email } = req.body;
      const [row, field] = await pool.query(
        "select * from contact where email=? or phoneNumber=?",
        [email, phoneNumber]
      );

      if (row.length === 0) {
        console.log("inserting data");
        const [row, field] = await pool.query(
          "insert into contact (phoneNumber,email,linkPrecedence) values (?,?,?)",
          [phoneNumber, email, "primary"],
          [email, phoneNumber]
        );
      }
      res.json({ data: row });
    } catch (error) {
      console.log(error);
    }
  },
};

module.exports = identityController;
