import { BakongKHQR, khqrData, IndividualInfo } from 'bakong-khqr';
import qrcode from 'qrcode-terminal';

async function testBakong() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║       Bakong KHQR Generator Test       ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    const individualInfo = new IndividualInfo(
      'vannak_seun@bkrt',
      khqrData.currency.usd,
      'Vannak Tech',
      'Phnom Penh',
      {
        amount: 1.0,
        storeLabel: 'ITsharing'
      }
    );

    const khqr = new BakongKHQR();
    const result = khqr.generateIndividual(individualInfo);

    if (result.status.code === 0) {
      const qrString = result.data.qr;
      const md5Hash = result.data.md5;

      console.log('✅ QR Generation Successful!\n');
      console.log('📋 Account ID   : vannak_seun@bkrt');
      console.log('💵 Amount       : $1.00 USD');
      console.log('🔑 QR String    :', qrString);
      console.log('🔒 MD5 Hash     :', md5Hash);

      // Verify
      const verify = BakongKHQR.verify(qrString);
      console.log('✔️  Is Valid      :', verify.isValid ? 'YES ✅' : 'NO ❌');

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
