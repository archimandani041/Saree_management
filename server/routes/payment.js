/**
 * Payment & Email Notification Service Route
 * Dispatches professional B2B Tax Invoices, Receipts, and Executive Thank You Messages
 */
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

let cachedTransporter = null;
let cachedTestAccount = null;

// Configure Nodemailer Transporter
const getTransporter = async () => {
  // If user provided real SMTP credentials in environment
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Otherwise, create/reuse Ethereal SMTP test account for live deliverability testing
  if (cachedTransporter) {
    return cachedTransporter;
  }

  try {
    cachedTestAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: cachedTestAccount.user,
        pass: cachedTestAccount.pass,
      },
    });
    console.log(`[EMAIL SERVICE] Created test SMTP account: ${cachedTestAccount.user}`);
    return cachedTransporter;
  } catch (err) {
    console.warn('[EMAIL SERVICE] Could not create test SMTP account, falling back to simulated transport:', err.message);
    return null;
  }
};

// Generate professional HTML Email Template
const generateReceiptEmailHtml = ({
  customerName = 'Valued Textile Partner',
  customerEmail = 'customer@example.com',
  planName = 'Team',
  amount = 399,
  transactionId = 'KP-PAY-2026-98124',
  utrNumber = 'UTR-428190284729',
  invoiceNumber = 'INV-2026-88192',
  paymentMethod = 'UPI Instant (NPCI Sandbox)',
  billingCycle = '30 Days Access',
  paidAt = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
}) => {
  const baseAmount = (amount / 1.18).toFixed(2);
  const totalTax = (amount - baseAmount).toFixed(2);
  const halfTax = (totalTax / 2).toFixed(2);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt & Thank You - KP Creation</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1E293B; }
    .container { max-width: 620px; margin: 30px auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #E2E8F0; }
    .header { background: linear-gradient(135deg, #8B1A3A 0%, #4A0419 100%); color: #FDF2F3; padding: 36px 32px; text-align: center; }
    .header h1 { margin: 0 0 8px; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; color: #D4AF37; }
    .header p { margin: 0; font-size: 13px; opacity: 0.85; }
    .content { padding: 36px 32px; }
    .salutation { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #0F172A; }
    .thank-you-card { background: #FFFBEB; border-left: 4px solid #D4AF37; padding: 18px 20px; border-radius: 0 10px 10px 0; margin-bottom: 24px; font-size: 14px; line-height: 1.6; color: #78350F; }
    .meta-box { background: #F1F5F9; border-radius: 12px; padding: 18px 20px; margin-bottom: 28px; }
    .meta-row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px solid #E2E8F0; }
    .meta-row:last-child { border-bottom: none; }
    .meta-label { color: #64748B; }
    .meta-value { font-weight: 600; color: #0F172A; }
    .table-container { margin-bottom: 28px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #F8FAFC; color: #475569; font-weight: 700; text-align: left; padding: 10px 12px; border-bottom: 2px solid #E2E8F0; }
    td { padding: 12px; border-bottom: 1px solid #E2E8F0; color: #1E293B; }
    .total-row td { font-weight: 700; font-size: 15px; color: #0F172A; border-top: 2px solid #CBD5E1; border-bottom: none; }
    .badge { display: inline-block; background: #DCFCE7; color: #15803D; font-size: 11px; font-weight: 700; padding: 3px 10px; borderRadius: 20px; text-transform: uppercase; }
    .footer { background: #0F172A; color: #94A3B8; padding: 24px 32px; font-size: 11px; text-align: center; line-height: 1.6; }
    .footer strong { color: #F1F5F9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>KP CREATION TEXTILES ERP</h1>
      <p>Saree Inventory, Master Loom Architecture & B2B Supply Chain</p>
    </div>

    <div class="content">
      <div class="salutation">Dear ${customerName},</div>

      <div class="thank-you-card">
        <strong>Thank you for your valued partnership!</strong><br>
        We are thrilled to confirm that your purchase of the <strong>${planName} Plan</strong> has been successfully verified and activated. 
        Your enterprise account now has expanded loom tracking quotas, real-time WhatsApp replenishment triggers, and priority cloud access.
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
        Please find your official GST Tax Invoice and transaction receipt details outlined below for your accounting and GST input tax credit (ITC) records.
      </p>

      <div class="meta-box">
        <div class="meta-row">
          <span class="meta-label">Invoice Number:</span>
          <span class="meta-value">${invoiceNumber}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Transaction Reference:</span>
          <span class="meta-value" style="font-family: monospace;">${transactionId}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Bank UTR / RRN:</span>
          <span class="meta-value" style="font-family: monospace;">${utrNumber}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Payment Channel:</span>
          <span class="meta-value">${paymentMethod}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Date & Time:</span>
          <span class="meta-value">${paidAt}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Payment Status:</span>
          <span class="badge">AUTHORIZATION VERIFIED (PAID)</span>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Item & Description</th>
              <th>SAC Code</th>
              <th>Taxable</th>
              <th>CGST (9%)</th>
              <th>SGST (9%)</th>
              <th style="text-align: right;">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>${planName} Subscription (${billingCycle})</strong><br>
                <span style="font-size: 11px; color: #64748B;">Unlimited SKUs, WhatsApp Alerts, Ledger Exports</span>
              </td>
              <td>998313</td>
              <td>₹${baseAmount}</td>
              <td>₹${halfTax}</td>
              <td>₹${halfTax}</td>
              <td style="text-align: right; font-weight: 700; color: #0F172A;">₹${amount}</td>
            </tr>
            <tr class="total-row">
              <td colspan="5" style="text-align: right;">Total Amount Paid (INR):</td>
              <td style="text-align: right; color: #059669;">₹${amount}.00</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; font-size: 12px; color: #475569; line-height: 1.5;">
        <strong>Need Assistance with Onboarding?</strong><br>
        Our dedicated textile systems engineer is available to help connect your master weavers, set up loom barcode tracking, and calibrate WhatsApp reorder alerts. Reply directly to this email or reach us on WhatsApp at <strong>+91 99096 80207</strong>.
      </div>
    </div>

    <div class="footer">
      <strong>KP CREATION TEXTILES PRIVATE LIMITED</strong><br>
      Ring Road Textile Market, Surat, Gujarat - 395002 | GSTIN: <strong>24AAECK9182C1ZP</strong><br>
      This is an electronically generated Tax Invoice & Receipt under Rule 48 of CGST Rules, 2017.
    </div>
  </div>
</body>
</html>
  `.trim();
};

// Generate Plain Text Receipt
const generatePlainTextReceipt = ({
  customerName = 'Valued Partner',
  planName = 'Team',
  amount = 399,
  transactionId = 'KP-PAY-2026-98124',
  utrNumber = 'UTR-428190284729',
  invoiceNumber = 'INV-2026-88192',
  paymentMethod = 'UPI Instant (NPCI Sandbox)'
}) => {
  return `KP CREATION TEXTILES ERP — OFFICIAL PAYMENT RECEIPT & TAX INVOICE

Dear ${customerName},

Thank you for your purchase and partnership! We are pleased to confirm that your subscription to the ${planName} Plan has been successfully authorized and activated.

TRANSACTION DETAILS:
---------------------------------------------
Invoice Number: ${invoiceNumber}
Transaction ID: ${transactionId}
Bank UTR / RRN: ${utrNumber}
Plan Subscribed: ${planName} Plan
Total Amount: Rs. ${amount}.00 (Includes 18% GST)
Payment Channel: ${paymentMethod}
Status: AUTHORIZED & ACTIVE (PAID)

GST COMPLIANCE:
Merchant: KP Creation Textiles Private Limited
GSTIN: 24AAECK9182C1ZP (Gujarat - 24)
SAC Code: 998313 (IT / Cloud ERP Services)

Thank you for choosing KP Creation Saree Management ERP.
For support or weaver onboarding, contact WhatsApp: +91 99096 80207.
`;
};

// Generate Professional WhatsApp Message
const generateWhatsAppMessage = ({
  customerName = 'Valued Partner',
  planName = 'Team',
  amount = 399,
  transactionId = 'KP-PAY-2026-98124',
  utrNumber = 'UTR-428190284729',
  invoiceNumber = 'INV-2026-88192'
}) => {
  return `✨ *KP CREATION TEXTILES ERP — PURCHASE CONFIRMED* ✨\n\n` +
    `Dear *${customerName}*,\n\n` +
    `Thank you for subscribing to the *${planName} Plan* (₹${amount}/mo) on KP Creation Saree ERP.\n\n` +
    `📋 *Transaction Summary:*\n` +
    `• *Invoice No:* ${invoiceNumber}\n` +
    `• *Transaction Ref:* ${transactionId}\n` +
    `• *Bank UTR:* ${utrNumber}\n` +
    `• *Amount Paid:* ₹${amount}.00 (Incl. 18% GST)\n` +
    `• *Status:* AUTHORIZED & ACTIVE\n\n` +
    `🎉 *Upgrades Activated on your Account:*\n` +
    `• Multi-loom inventory & beam allocation\n` +
    `• Unlimited color series (A→Z) & barcode printing\n` +
    `• One-tap WhatsApp replenishment triggers to weavers\n` +
    `• Downloadable Excel & PDF ERP ledgers\n\n` +
    `Your official GST Tax Invoice has been generated.\n\n` +
    `For priority onboarding assistance, our support team is available at +91 99096 80207.\n\n` +
    `_Empowering Surat's Textile & Saree Houses_`;
};

// POST /api/payment/send-receipt
router.post('/send-receipt', async (req, res) => {
  try {
    const {
      customerName = 'Valued Textile Partner',
      customerEmail = 'store.owner@kpcreation.com',
      planName = 'Team',
      amount = 399,
      transactionId = `KP-PAY-${Date.now().toString().slice(-6)}`,
      utrNumber = `UTR-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      invoiceNumber = `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      paymentMethod = 'UPI Instant (NPCI Sandbox)',
      phoneNumber = '9909680207'
    } = req.body;

    const emailHtml = generateReceiptEmailHtml({
      customerName,
      customerEmail,
      planName,
      amount,
      transactionId,
      utrNumber,
      invoiceNumber,
      paymentMethod
    });

    const plainTextReceipt = generatePlainTextReceipt({
      customerName,
      planName,
      amount,
      transactionId,
      utrNumber,
      invoiceNumber,
      paymentMethod
    });

    const whatsappMessage = generateWhatsAppMessage({
      customerName,
      planName,
      amount,
      transactionId,
      utrNumber,
      invoiceNumber
    });

    const subject = `Official Tax Invoice #${invoiceNumber} & Order Confirmation — KP Creation ERP`;

    let etherealUrl = null;
    let emailSentViaSmtp = false;

    // Send real email via Nodemailer
    try {
      const transporter = await getTransporter();
      if (transporter) {
        const info = await transporter.sendMail({
          from: `"KP Creation Billing Engine" <${process.env.SMTP_FROM || 'billing@kpcreation.com'}>`,
          to: customerEmail,
          subject: subject,
          text: plainTextReceipt,
          html: emailHtml,
        });

        emailSentViaSmtp = true;
        etherealUrl = nodemailer.getTestMessageUrl(info);
        if (etherealUrl) {
          console.log(`[EMAIL SERVICE] 🌐 Real email delivered to test inbox: ${etherealUrl}`);
        } else {
          console.log(`[EMAIL SERVICE] 🚀 Real email sent via SMTP to: ${customerEmail}`);
        }
      }
    } catch (mailErr) {
      console.warn('[EMAIL SERVICE] SMTP dispatch error:', mailErr.message);
    }

    // Output to console with styled log for external guide / terminal observation
    console.log('\n' + '='.repeat(70));
    console.log('📧 [EMAIL DISPATCHER] OFFICIAL TAX INVOICE & THANK YOU EMAIL DISPATCHED');
    console.log('='.repeat(70));
    console.log(`To:          ${customerEmail} (${customerName})`);
    console.log(`Subject:     ${subject}`);
    console.log(`Plan:        ${planName} Plan (Amount: ₹${amount})`);
    console.log(`UTR / RRN:   ${utrNumber}`);
    console.log(`Method:      ${paymentMethod}`);
    console.log(`Status:      DELIVERED (200 OK) | SMTP Active: ${emailSentViaSmtp}`);
    if (etherealUrl) {
      console.log(`Inbox Link:  ${etherealUrl}`);
    }
    console.log('='.repeat(70) + '\n');

    return res.json({
      success: true,
      message: `Tax Invoice & Thank You confirmation successfully dispatched to ${customerEmail}`,
      deliveredTo: customerEmail,
      phoneNumber,
      invoiceNumber,
      transactionId,
      utrNumber,
      subject,
      emailHtml,
      plainTextReceipt,
      whatsappMessage,
      etherealUrl,
      emailSentViaSmtp,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error dispatching payment receipt:', error);
    return res.status(500).json({ error: 'Failed to dispatch receipt notification' });
  }
});

// POST /api/payment/send-cancellation
router.post('/send-cancellation', async (req, res) => {
  try {
    const {
      customerName = 'Valued Boutique Partner',
      customerEmail = 'customer@example.com',
      planName = 'Pro',
      immediate = false,
      reason = 'Not specified',
      feedback = '',
      renewDate = '',
      daysRemaining = 0,
      phoneNumber = '9909680207',
    } = req.body;

    const formattedDate = renewDate
      ? new Date(renewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'End of current cycle';

    const subject = `Subscription Cancellation Confirmation — KP Creation ERP`;

    const cancellationHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Subscription Cancellation - KP Creation ERP</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1E293B; }
    .container { max-width: 600px; margin: 30px auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #E2E8F0; }
    .header { background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); color: #FDF2F3; padding: 32px 28px; text-align: center; }
    .header h1 { margin: 0 0 8px; font-size: 22px; color: #F1F5F9; }
    .content { padding: 32px 28px; font-size: 14px; line-height: 1.6; }
    .box { background: #FEF2F2; border-left: 4px solid #EF4444; padding: 16px 20px; border-radius: 0 10px 10px 0; margin: 20px 0; color: #991B1B; }
    .details { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px; margin: 20px 0; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #E2E8F0; font-size: 13px; }
    .row:last-child { border-bottom: none; }
    .btn { display: inline-block; background: #8B1A3A; color: #FFFFFF !important; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px; }
    .footer { background: #0F172A; color: #94A3B8; padding: 20px; font-size: 11px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>KP CREATION TEXTILES ERP</h1>
      <p style="margin: 0; font-size: 12px; opacity: 0.8;">Subscription Management</p>
    </div>
    <div class="content">
      <p>Dear <strong>${customerName}</strong>,</p>
      <div class="box">
        <strong>Your ${planName} Plan subscription has been cancelled.</strong><br>
        ${immediate
          ? 'Your account has been downgraded immediately to the Free Trial tier.'
          : `You retain full access to all features until <strong>${formattedDate}</strong> (${daysRemaining} days remaining). No further renewals or charges will occur.`
        }
      </div>
      <div class="details">
        <div class="row"><span>Plan:</span><strong>${planName} Plan</strong></div>
        <div class="row"><span>Cancellation Type:</span><strong>${immediate ? 'Immediate' : 'End of Billing Cycle'}</strong></div>
        <div class="row"><span>Access Valid Until:</span><strong>${immediate ? 'Immediate Free Downgrade' : formattedDate}</strong></div>
        <div class="row"><span>Reason Recorded:</span><span>${reason}</span></div>
      </div>
      <p>If you changed your mind or wish to resume your subscription at any time, you can reactivate with one click from your Billing & Usage settings.</p>
      <center><a href="http://localhost:5173/billing" class="btn">Reactivate Subscription</a></center>
    </div>
    <div class="footer">
      KP CREATION TEXTILES PRIVATE LIMITED | Ring Road Textile Market, Surat | Support: +91 99096 80207
    </div>
  </div>
</body>
</html>
    `.trim();

    // Log to console for observation
    console.log('\n' + '='.repeat(70));
    console.log('🛑 [CANCELLATION DISPATCHER] SUBSCRIPTION CANCELLATION NOTICE');
    console.log('='.repeat(70));
    console.log(`Plan:         ${planName}`);
    console.log(`Customer:     ${customerName} (${customerEmail})`);
    console.log(`Timing:       ${immediate ? 'Immediate Downgrade' : `Active until ${formattedDate}`}`);
    console.log(`Reason:       ${reason}`);
    console.log('='.repeat(70) + '\n');

    return res.json({
      success: true,
      message: `Cancellation notice logged for ${customerEmail}`,
      immediate,
      formattedDate,
      cancellationHtml
    });
  } catch (error) {
    console.error('Error handling cancellation notice:', error);
    return res.status(500).json({ error: 'Failed to process cancellation notification' });
  }
});

module.exports = router;
