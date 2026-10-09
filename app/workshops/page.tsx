'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Search, Plus, Calendar, MapPin, Users } from 'lucide-react';
import { Permissions, hasPermission } from '@/lib/permissions';

interface Workshop {
  _id: string;
  code: string;
  title: string;
  startAt: string;
  location: string;
  capacity: number;
  registeredCount: number;
  status: string;
}

export default function WorkshopsPage() {
  const { data: session } = useSession();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  const canCreate = hasPermission(session?.user?.role, Permissions.CAN_CREATE_WORKSHOP);

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    try {
      const res = await fetch('/api/workshops');
      if (res.ok) {
        const data = await res.json();
        setWorkshops(data);
      }
    } catch (error) {
      console.error('Failed to fetch workshops', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkshops = workshops.filter((w) => {
    const matchesSearch = w.code.toLowerCase().includes(search.toLowerCase()) || w.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? w.status === statusFilter : true;
    const matchesAvailable = availableOnly ? w.capacity > w.registeredCount : true;
    return matchesSearch && matchesStatus && matchesAvailable;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Workshops</h1>
        {canCreate && (
          <Link href="/workshops/new" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 transition">
            <Plus className="w-4 h-4 mr-2" />
            Create Workshop
          </Link>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Search by code or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <label className="flex items-center space-x-2 text-sm text-gray-700 whitespace-nowrap cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary focus:ring-primary"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
          />
          <span>Available seats only</span>
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredWorkshops.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
          <p className="text-gray-500">No workshops found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkshops.map((workshop) => {
            const seatsRemaining = workshop.capacity - workshop.registeredCount;
            const isFull = seatsRemaining === 0;
            const isCancelled = workshop.status === 'CANCELLED';

            return (
              <Link href={`/workshops/${workshop._id}`} key={workshop._id} className="block group">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {workshop.code}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${workshop.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' : ''}
                        ${workshop.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800' : ''}
                        ${workshop.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' : ''}
                        ${workshop.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {workshop.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                      {workshop.title}
                    </h3>
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {new Date(workshop.startAt).toLocaleDateString()} at {new Date(workshop.startAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {workshop.location}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="mr-1.5 h-4 w-4" />
                      {workshop.registeredCount} / {workshop.capacity} Registered
                    </div>
                    {isCancelled ? (
                      <span className="text-sm font-medium text-red-600">Cancelled</span>
                    ) : isFull ? (
                      <span className="text-sm font-medium text-orange-600">Full</span>
                    ) : (
                      <span className="text-sm font-medium text-green-600">{seatsRemaining} seats left</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
