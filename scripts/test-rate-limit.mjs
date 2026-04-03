const URL = 'http://127.0.0.1:3000/api/gold-price';

async function test() {
  const codes = [];
  for (let i = 0; i < 25; i++) {
    try {
      const res = await fetch(URL);
      codes.push(res.status);
    } catch (e) {
      codes.push(`ERR(${e.message})`);
    }
  }
  console.log('Status Codes:', codes.join(' '));
  console.log('Rate Limit Test Complete.');
}

test();
