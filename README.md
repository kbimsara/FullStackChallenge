# Workshop Registration Service

A robust, full-stack Next.js application for a community training centre to manage workshop registrations securely with strict role-based access control and concurrency protection.

## Features

- **Role-based Access Control (RBAC):** Admin, Manager, and Staff roles with distinct backend-enforced permissions.
- **Concurrency-Safe Registrations:** Uses MongoDB multi-document transactions to guarantee that active registrations never exceed workshop capacity, even under heavy concurrent load.
- **Permanent Audit History:** Registrations are never physically deleted. Cancellations are tracked and seats are accurately returned. All critical actions (creation, updates, cancellations) are written to a secure audit log.
- **Modern UI:** Built with Tailwind CSS, Radix UI colors (via HSL variables), Lucide icons, and React Hook Form.

## Prerequisites

- Node.js (v18 or higher)
- A MongoDB Atlas cluster **configured as a Replica Set** (required for MongoDB transactions). The default free tier (M0) supports transactions.

## Database Setup (MongoDB Atlas)

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under "Database Access", create a database user with read and write privileges. Note the password.
3. Under "Network Access", allow access from anywhere (`0.0.0.0/0`) or your specific IP address.
4. Click "Connect", choose "Connect your application", and copy the connection string.
5. Create a `.env` file in the root directory and set your environment variables (see below).

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/
MONGODB_DB=workshop_registration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-development-key-here
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=securepassword123
```

*(Ensure you replace `<username>` and `<password>` with your Atlas credentials. Do not include the database name in the URI itself, as we use `MONGODB_DB` separately).*

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Seed the Database:**
   Ensure your `.env` has valid `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Then run:
   ```bash
   npm run seed:admin
   npm run seed:data
   ```
   *(This will create the initial Admin account, a test Manager, a test Staff, and sample workshops).*

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```

4. **Access the Application:**
   Open [http://localhost:3000](http://localhost:3000) and log in.
   
   *Test Accounts (password is `password123` for manager/staff unless changed):*
   - Admin: as defined in your `.env`
   - Manager: `manager@example.com`
   - Staff: `staff@example.com`

## Testing

To verify the concurrency guarantees of the registration logic, run the automated integration tests.
**Note:** Ensure your test environment is pointed to a safe test database before running tests. You can override `MONGODB_URI` during test execution.

```bash
npm run test
```

The concurrency test fires multiple instantaneous registration requests at a workshop with only 1 seat remaining. The test verifies that exactly 1 request succeeds and the rest are correctly rejected, preserving the capacity limit.
