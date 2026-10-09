require('dotenv').config();
import connectToDatabase from '../lib/db';
import { User } from '../models/User';
import { Role } from '../lib/roles';
import { Workshop, WorkshopStatus } from '../models/Workshop';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

async function seedData() {
  await connectToDatabase();

  const adminUser = await User.findOne({ role: Role.ADMIN });
  if (!adminUser) {
    console.error('Run seedAdmin first.');
    process.exit(1);
  }

  // Create some sample managers/staff
  const passHash = await bcrypt.hash('password123', 10);
  
  const manager = await User.findOneAndUpdate(
    { email: 'manager@example.com' },
    { name: 'Alice Manager', email: 'manager@example.com', passwordHash: passHash, role: Role.MANAGER, isActive: true },
    { upsert: true, new: true }
  );

  const staff = await User.findOneAndUpdate(
    { email: 'staff@example.com' },
    { name: 'Bob Staff', email: 'staff@example.com', passwordHash: passHash, role: Role.STAFF, isActive: true },
    { upsert: true, new: true }
  );

  // Clear old workshops for a fresh seed state
  await Workshop.deleteMany({});

  const now = new Date();
  
  const workshops = [
    {
      code: 'WS-101',
      title: 'Introduction to Full Stack',
      description: 'A comprehensive intro to building web apps.',
      instructor: 'Jane Doe',
      location: 'Room A',
      startAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Next week
      capacity: 2,
      registeredCount: 0,
      status: WorkshopStatus.SCHEDULED,
      createdBy: manager._id,
      updatedBy: manager._id,
    },
    {
      code: 'WS-102',
      title: 'Advanced React Patterns',
      description: 'Deep dive into React.',
      instructor: 'John Smith',
      location: 'Room B',
      startAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      capacity: 30,
      registeredCount: 30, // Full
      status: WorkshopStatus.SCHEDULED,
      createdBy: manager._id,
      updatedBy: manager._id,
    },
    {
      code: 'WS-103',
      title: 'Node.js Performance',
      description: 'Scaling Node.js apps.',
      instructor: 'Alice Manager',
      location: 'Room C',
      startAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Past
      capacity: 20,
      registeredCount: 15,
      status: WorkshopStatus.COMPLETED,
      createdBy: manager._id,
      updatedBy: manager._id,
    },
    {
      code: 'WS-104',
      title: 'UI/UX Basics',
      description: 'Designing beautiful interfaces.',
      instructor: 'Charlie Design',
      location: 'Online',
      startAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      capacity: 50,
      registeredCount: 10,
      status: WorkshopStatus.CANCELLED,
      createdBy: manager._id,
      updatedBy: manager._id,
    }
  ];

  await Workshop.insertMany(workshops);
  
  console.log('Seed data inserted successfully.');
  process.exit(0);
}

seedData().catch((err) => {
  console.error(err);
  process.exit(1);
});
