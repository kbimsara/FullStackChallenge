import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { Workshop } from '../models/Workshop';
import { Registration } from '../models/Registration';
import { registerAttendee } from '../services/registrationService';
import { config } from 'dotenv';
config();

describe('Concurrency Registration Tests', () => {
  let workshopId: string;
  let testUserId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI must be set for tests');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Create a workshop with exactly 1 seat left
    const workshop = new Workshop({
      code: 'TEST-CONCURRENCY-' + Date.now(),
      title: 'Test Workshop',
      description: 'Test',
      instructor: 'Test',
      location: 'Test',
      startAt: new Date(),
      capacity: 1, // Only 1 seat
      registeredCount: 0,
      status: 'SCHEDULED',
      createdBy: testUserId,
      updatedBy: testUserId,
    });
    
    await workshop.save();
    workshopId = workshop._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.db?.dropDatabase(); // Caution: Use only on isolated test DBs
    await mongoose.disconnect();
  });

  it('should only allow exactly 1 registration when capacity is 1, even under concurrent load', async () => {
    // Fire 5 concurrent registration attempts
    const attempts = Array.from({ length: 5 }).map((_, i) => {
      return registerAttendee(
        workshopId,
        `Attendee ${i}`,
        `attendee${i}@example.com`,
        testUserId
      ).catch((e) => e); // Catch errors so Promise.all completes
    });

    const results = await Promise.all(attempts);
    
    // Exactly one should succeed (return an object), the others should be errors
    const successes = results.filter((r) => !(r instanceof Error));
    const errors = results.filter((r) => r instanceof Error);

    expect(successes).toHaveLength(1);
    expect(errors).toHaveLength(4);

    // Verify DB state
    const ws = await Workshop.findById(workshopId);
    expect(ws?.registeredCount).toBe(1);

    const regs = await Registration.find({ workshopId });
    expect(regs).toHaveLength(1);
  });
});
