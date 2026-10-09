import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
export const instant = false;
import connectToDatabase from '@/lib/db';
import { Workshop } from '@/models/Workshop';
import { Registration } from '@/models/Registration';
import { Users, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { Permissions, hasPermission } from '@/lib/permissions';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  await connectToDatabase();

  const totalWorkshops = await Workshop.countDocuments();
  const upcomingWorkshops = await Workshop.countDocuments({ startAt: { $gt: new Date() }, status: 'SCHEDULED' as any });
  const activeRegistrations = await Registration.countDocuments({ status: 'ACTIVE' as any });
  
  // Workshops with no remaining seats
  const fullWorkshops = await Workshop.countDocuments({
    $expr: { $eq: ['$capacity', '$registeredCount'] } as any,
    status: { $in: ['SCHEDULED', 'IN_PROGRESS'] as any }
  } as any);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-xl p-5 border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 truncate">Total Workshops</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{totalWorkshops}</p>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-xl p-5 border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 truncate">Upcoming Scheduled</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{upcomingWorkshops}</p>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-xl p-5 border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 truncate">Active Registrations</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{activeRegistrations}</p>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-xl p-5 border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 truncate">Full Workshops</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{fullWorkshops}</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-xl p-6 mt-8 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Welcome back, {session.user.name}</h2>
        <p className="text-gray-600">
          You are logged in as <span className="font-medium px-2 py-1 bg-gray-100 rounded text-sm">{session.user.role}</span>.
        </p>
        <p className="mt-4 text-gray-600">
          Use the navigation bar to manage workshops, registrations, and administrative tasks according to your permissions.
        </p>
      </div>
    </div>
  );
}
