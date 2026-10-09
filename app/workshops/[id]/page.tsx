'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, UserPlus, Users, Calendar, MapPin, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Permissions, hasPermission } from '@/lib/permissions';

const registrationSchema = z.object({
  attendeeName: z.string().min(1, 'Name is required'),
  attendeeEmail: z.string().email('Invalid email'),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

import { Suspense } from 'react';

function WorkshopDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [workshop, setWorkshop] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
  });

  const canRegister = hasPermission(session?.user?.role, Permissions.CAN_REGISTER_ATTENDEE);
  const canCancel = hasPermission(session?.user?.role, Permissions.CAN_CANCEL_REGISTRATION);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [wsRes, regRes] = await Promise.all([
        fetch(`/api/workshops/${params.id}`),
        fetch(`/api/registrations?workshopId=${params.id}`)
      ]);

      if (!wsRes.ok) throw new Error('Failed to fetch workshop');
      
      const wsData = await wsRes.json();
      setWorkshop(wsData);

      if (regRes.ok) {
        setRegistrations(await regRes.json());
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
      fetchData(); // Refresh data
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

      fetchData(); // Refresh data
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !workshop) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded text-sm text-red-700">
        {error || 'Workshop not found'}
      </div>
    );
  }

  const isFull = workshop.registeredCount >= workshop.capacity;
  const isCancelled = workshop.status === 'CANCELLED';
  const registrationDisabled = isFull || isCancelled || !canRegister;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href="/workshops" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Workshops
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
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
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{workshop.title}</h1>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm text-gray-600">
                <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <Calendar className="w-5 h-5 mr-3 text-primary" />
                  <div>
                    <p className="font-medium text-gray-900">Date & Time</p>
                    <p>{new Date(workshop.startAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <MapPin className="w-5 h-5 mr-3 text-primary" />
                  <div>
                    <p className="font-medium text-gray-900">Location</p>
                    <p>{workshop.location}</p>
                  </div>
                </div>
                <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <UserPlus className="w-5 h-5 mr-3 text-primary" />
                  <div>
                    <p className="font-medium text-gray-900">Instructor</p>
                    <p>{workshop.instructor}</p>
                  </div>
                </div>
                <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <Users className="w-5 h-5 mr-3 text-primary" />
                  <div>
                    <p className="font-medium text-gray-900">Capacity</p>
                    <p>{workshop.registeredCount} / {workshop.capacity} Registered</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{workshop.description}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Registration History</h2>
            </div>
            
            {registrations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No registrations yet.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {registrations.map((reg) => (
                  <li key={reg._id} className="p-4 hover:bg-gray-50 transition flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{reg.attendeeName}</p>
                      <p className="text-sm text-gray-500">{reg.attendeeEmail}</p>
                      <div className="mt-1 flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                          ${reg.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {reg.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          Registered: {new Date(reg.registeredAt).toLocaleString()}
                        </span>
                        {reg.status === 'CANCELLED' && reg.cancelledAt && (
                          <span className="text-xs text-gray-400">
                            (Cancelled: {new Date(reg.cancelledAt).toLocaleString()})
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {reg.status === 'ACTIVE' && canCancel && (
                      <button
                        onClick={() => onCancel(reg._id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition bg-white rounded-md border border-gray-200 hover:border-red-200"
                        title="Cancel Registration"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Register Attendee</h2>
            
            {regError && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded text-sm text-red-700 flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                <p>{regError}</p>
              </div>
            )}

            {isCancelled ? (
              <div className="bg-orange-50 text-orange-800 p-4 rounded-md text-sm">
                This workshop has been cancelled. Registrations are closed.
              </div>
            ) : isFull ? (
              <div className="bg-orange-50 text-orange-800 p-4 rounded-md text-sm">
                This workshop is currently full.
              </div>
            ) : !canRegister ? (
              <div className="bg-gray-50 text-gray-600 p-4 rounded-md text-sm">
                You do not have permission to register attendees.
              </div>
            ) : (
              <form onSubmit={handleSubmit(onRegister)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attendee Name</label>
                  <input
                    {...register('attendeeName')}
                    type="text"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2 border"
                  />
                  {errors.attendeeName && <p className="mt-1 text-sm text-red-600">{errors.attendeeName.message}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attendee Email</label>
                  <input
                    {...register('attendeeEmail')}
                    type="email"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2 border"
                  />
                  {errors.attendeeEmail && <p className="mt-1 text-sm text-red-600">{errors.attendeeEmail.message}</p>}
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
    </div>
  );
}

export default function WorkshopDetailsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <WorkshopDetailsContent />
    </Suspense>
  );
}
