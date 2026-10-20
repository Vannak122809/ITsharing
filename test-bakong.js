import { KHQR, TAG, CURRENCY } from 'ts-khqr';
import qrcode from 'qrcode-terminal';

async function testBakong() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║    Bakong KHQR Generator (ts-khqr)     ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    const payload = {
      tag: TAG.INDIVIDUAL,
      accountID: 'vannak_seun@bkrt',
      merchantName: 'Vannak Tech',
      merchantCity: 'Phnom Penh',
      currency: CURRENCY.USD,
      amount: 1.0,
      expirationTimestamp: Date.now() + 10 * 60 * 1000,
      additionalData: {
        storeLabel: 'ITsharing'
      }
    };

    const result = KHQR.generate(payload);

    if (result.status.code === 0) {
      const qrString = result.data.qr;
      const md5Hash = result.data.md5;

      console.log('✅ QR Generation Successful!\n');
      console.log('📋 Account ID   : vannak_seun@bkrt');
      console.log('💵 Amount       : $1.00 USD');
      console.log('🔑 QR String    :', qrString);
      console.log('🔒 MD5 Hash     :', md5Hash);

      // Verify
      const verify = KHQR.verify(qrString);
      console.log('✔️  Is Valid      :', verify.isValid ? 'YES ✅' : 'NO ❌');

      // Parse verification
      const parsed = KHQR.parse(qrString);
      console.log('🔍 Parsed Data  :', {
        merchant: parsed.data.merchantName,
        currency: parsed.data.transactionCurrency === '840' ? 'USD' : 'KHR',
        amount: parsed.data.transactionAmount,
        store: parsed.data.storeLabel
      });

      console.log('\n─────────── Scan with Bakong App ───────────\n');

      // Render QR code visually in terminal
      qrcode.generate(qrString, { small: true }, (qr) => {
        console.log(qr);
        console.log('────────────────────────────────────────────\n');
        console.log('📱 Open Bakong / ABA / any KHQR app and scan\n');
      });

    } else {
      console.error('❌ Generation Failed:', result.status.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBakong();
