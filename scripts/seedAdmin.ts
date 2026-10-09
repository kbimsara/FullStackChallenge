require('dotenv').config();
import connectToDatabase from '../lib/db';
import { User } from '../models/User';
import { Role } from '../lib/roles';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  await connectToDatabase();

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be provided in the environment variables.');
    process.exit(1);
  }

  const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
  if (existingAdmin) {
    console.log(`Admin user with email ${adminEmail} already exists.`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await User.create({
    name: 'System Admin',
    email: adminEmail.toLowerCase(),
    passwordHash,
    role: Role.ADMIN,
    isActive: true,
  });

  console.log(`Admin user ${adminEmail} created successfully.`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
