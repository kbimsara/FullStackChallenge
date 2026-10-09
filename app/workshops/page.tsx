'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Search, Plus, Calendar, MapPin, Users } from 'lucide-react';
import { Permissions, hasPermission } from '@/lib/permissions';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/Skeleton';

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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function WorkshopsPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  const { data: workshops, error, isLoading } = useSWR<Workshop[]>('/api/workshops', fetcher, {
    revalidateOnFocus: false, // caching
    dedupingInterval: 60000, // cache for 1 minute
  });

  const canCreate = hasPermission(session?.user?.role, Permissions.CAN_CREATE_WORKSHOP);

  const filteredWorkshops = (workshops || []).filter((w) => {
    const matchesSearch = w.code.toLowerCase().includes(search.toLowerCase()) || w.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? w.status === statusFilter : true;
    const matchesAvailable = availableOnly ? w.capacity > w.registeredCount : true;
    return matchesSearch && matchesStatus && matchesAvailable;
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Workshops</h1>
        {canCreate && (
          <Link href="/workshops/new" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 transition">
            <Plus className="w-4 h-4 mr-2" />
            Create Workshop
          </Link>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition"
            placeholder="Search by code or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md transition"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap cursor-pointer hover:opacity-80 transition">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary focus:ring-primary"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
          />
          <span>Available seats only</span>
        </label>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 h-[220px] flex flex-col p-5">
              <Skeleton className="h-5 w-1/3 mb-4 rounded-full" />
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-red-200 border-dashed">
          <p className="text-red-500">Failed to load workshops.</p>
        </div>
      ) : filteredWorkshops.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-dashed">
          <p className="text-gray-500 dark:text-gray-400">No workshops found matching your criteria.</p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkshops.map((workshop) => {
            const seatsRemaining = workshop.capacity - workshop.registeredCount;
            const isFull = seatsRemaining === 0;
            const isCancelled = workshop.status === 'CANCELLED';

            return (
              <motion.div variants={itemAnim} key={workshop._id}>
                <Link href={`/workshops/${workshop._id}`} className="block group h-full">
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                    <div className="p-5 flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                          {workshop.code}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${workshop.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                          ${workshop.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
                          ${workshop.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' : ''}
                          ${workshop.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
                        `}>
                          {workshop.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                        {workshop.title}
                      </h3>
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {new Date(workshop.startAt).toLocaleDateString()} at {new Date(workshop.startAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {workshop.location}
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between transition-colors group-hover:bg-primary/5">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <Users className="mr-1.5 h-4 w-4" />
                        {workshop.registeredCount} / {workshop.capacity}
                      </div>
                      {isCancelled ? (
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">Cancelled</span>
                      ) : isFull ? (
                        <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Full</span>
                      ) : (
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">{seatsRemaining} left</span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
