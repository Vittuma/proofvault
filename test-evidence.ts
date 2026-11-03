import { getEvidenceById, getTotalEvidenceCount } from './src/lib/aptos/views';
import { MODULE_ADDRESS } from './src/lib/aptos/client';

async function main() {
  const count = await getTotalEvidenceCount(MODULE_ADDRESS);
  console.log("Total Count:", count);
  for (let i = count; i > 0; i--) {
    const ev = await getEvidenceById(MODULE_ADDRESS, i);
    console.log(`ID ${i}:`, ev ? ev.title : "Not Found");
  }
}
main();
