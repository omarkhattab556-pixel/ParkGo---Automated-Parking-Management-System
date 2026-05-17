/**
 * Helper to generate a bcrypt hash from the command line.
 * Usage:  node src/utils/hashPassword.js "MyPassword123"
 */
import bcrypt from 'bcryptjs';

const plain = process.argv[2];
if (!plain) {
  console.error('Usage: node src/utils/hashPassword.js "<password>"');
  process.exit(1);
}

const hash = await bcrypt.hash(plain, 10);
console.log(hash);
