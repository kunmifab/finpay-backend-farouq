const mailgunMailer = require("./mailgunMailer");
const smtpMailer = require("./smtpMailer");

const providers = {
  mailgun: mailgunMailer,
  smtp: smtpMailer,
};

const sendEmail = async (options) => {
  const primary = process.env.MAIL_PROVIDER || "mailgun";

  const trySend = async (providerName) => {
    const mailer = providers[providerName];
    if (!mailer) throw new Error(`Unsupported mail provider: ${providerName}`);
    return await mailer.send(options);
  };

  try {
    return await trySend(primary);
  } catch (err) {
      throw err;
  }
};

module.exports = { sendEmail };
