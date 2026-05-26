import nodemailer from 'nodemailer';

interface SendMailArgs {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export async function sendMail({ to, subject, html, text }: SendMailArgs) {
  let host = process.env.SMTP_HOST;
  let port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  let user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASSWORD;
  let fromEmail = process.env.SMTP_FROM_EMAIL || user;
  let fromName = process.env.SMTP_FROM_NAME || "SmartBid";

  try {
    const { prisma } = await import('./prisma');
    const dbAccount = await prisma.smtpAccount.findFirst({
      where: { active: true }
    });

    if (dbAccount) {
      host = dbAccount.host;
      port = dbAccount.port;
      user = dbAccount.user;
      pass = dbAccount.password;
      fromEmail = dbAccount.fromEmail;
      fromName = dbAccount.fromName;
    }
  } catch (error) {
    console.warn("⚠️ Error fetching SMTP account from DB, falling back to env:", error);
  }

  if (!host || !user || !pass || !fromEmail) {
    console.warn("⚠️ SMTP credentials not fully configured in env variables or database. Simulating email send.");
    console.log(`[SIMULATED EMAIL] To: ${to} | Subject: ${subject}`);
    console.log(`[SIMULATED BODY] ${text || html}`);
    return { success: true, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for 587 (TLS)
      auth: {
        user,
        pass,
      },
      tls: {
        // Do not fail on invalid certificates if custom domain SMTP is used
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("📧 Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("❌ Error sending email via SMTP:", error);
    return { success: false, error: error.message || String(error) };
  }
}
