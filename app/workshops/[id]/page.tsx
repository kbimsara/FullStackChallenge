'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, UserPlus, Users, Calendar, MapPin, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Permissions, hasPermission } from '@/lib/permissions';
import { Suspense } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/Skeleton';
import dynamic from 'next/dynamic';

const registrationSchema = z.object({
  attendeeName: z.string().min(1, 'Name is required'),
  attendeeEmail: z.string().email('Invalid email'),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
});

// Lazy load the registration history component
const LazyRegistrationHistory = dynamic(() => import('@/components/RegistrationHistory'), {
  loading: () => (
    <div className="p-4 space-y-4">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  ),
  ssr: false, // Client side only for interactive lists
});

function WorkshopDetailsContent() {
  const params = useParams();
  const { data: session } = useSession();
  
  const [regError, setRegError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
  });

  const canRegister = hasPermission(session?.user?.role, Permissions.CAN_REGISTER_ATTENDEE);
  const canCancel = hasPermission(session?.user?.role, Permissions.CAN_CANCEL_REGISTRATION);

  const { data: workshop, error: workshopError, isLoading: loadingWs, mutate: mutateWs } = useSWR(`/api/workshops/${params.id}`, fetcher);
  const { data: registrations, mutate: mutateReg } = useSWR(`/api/registrations?workshopId=${params.id}`, fetcher);

  const onRegister = async (data: RegistrationFormValues) => {
    setRegError(null);
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          workshopId: params.id,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to register');
      }

      reset();
      mutateWs();
      mutateReg();
    } catch (err: any) {
      setRegError(err.message);
    }
  };

  const onCancel = async (registrationId: string) => {
    if (!confirm('Are you sure you want to cancel this registration?')) return;
    
    try {
      const res = await fetch(`/api/registrations/${registrationId}/cancel`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to cancel');
      }

      mutateWs();
      mutateReg();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loadingWs) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-40 rounded-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <Skeleton className="h-6 w-24 rounded-full mb-4" />
              <Skeleton className="h-10 w-3/4 mb-6" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
          <div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (workshopError || !workshop) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 rounded text-sm text-red-700 dark:text-red-400">
        {workshopError?.message || 'Workshop not found'}
      </div>
    );
  }

  const isFull = workshop.registeredCount >= workshop.capacity;
  const isCancelled = workshop.status === 'CANCELLED';
  const registrationDisabled = isFull || isCancelled || !canRegister;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href="/workshops" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Workshops
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
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
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{workshop.title}</h1>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <Calendar className="w-5 h-5 mr-3 text-primary" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Date & Time</p>
                    <p>{new Date(workshop.startAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <MapPin className="w-5 h-5 mr-3 text-primary" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Location</p>
                    <p>{workshop.location}</p>
                  </div>
                </div>
                <div className="flex items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <UserPlus className="w-5 h-5 mr-3 text-primary" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Instructor</p>
                    <p>{workshop.instructor}</p>
                  </div>
                </div>
                <div className="flex items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <Users className="w-5 h-5 mr-3 text-primary" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Capacity</p>
                    <p>{workshop.registeredCount} / {workshop.capacity} Registered</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{workshop.description}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registration History</h2>
            </div>
            {/* Lazy Load Registration History! */}
            <LazyRegistrationHistory registrations={registrations || []} canCancel={canCancel} onCancel={onCancel} />
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Register Attendee</h2>
            
            {regError && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-3 rounded text-sm text-red-700 dark:text-red-400 flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                <p>{regError}</p>
              </motion.div>
            )}

            {isCancelled ? (
              <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 p-4 rounded-md text-sm border border-orange-200 dark:border-orange-900/50">
                This workshop has been cancelled. Registrations are closed.
              </div>
            ) : isFull ? (
              <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 p-4 rounded-md text-sm border border-orange-200 dark:border-orange-900/50">
                This workshop is currently full.
              </div>
            ) : !canRegister ? (
              <div className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 p-4 rounded-md text-sm border border-gray-200 dark:border-gray-700">
                You do not have permission to register attendees.
              </div>
            ) : (
              <form onSubmit={handleSubmit(onRegister)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Attendee Name</label>
                  <input
                    {...register('attendeeName')}
                    type="text"
                    className="block w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white dark:bg-gray-800 sm:text-sm px-3 py-2 border transition"
                  />
                  {errors.attendeeName && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.attendeeName.message}</motion.p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Attendee Email</label>
                  <input
                    {...register('attendeeEmail')}
                    type="email"
                    className="block w-full border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white dark:bg-gray-800 sm:text-sm px-3 py-2 border transition"
                  />
                  {errors.attendeeEmail && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.attendeeEmail.message}</motion.p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || registrationDisabled}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition disabled:opacity-70 mt-2"
                >
                  {isSubmitting ? 'Registering...' : 'Complete Registration'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function WorkshopDetailsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-40 rounded-full" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    }>
      <WorkshopDetailsContent />
    </Suspense>
  );
}
