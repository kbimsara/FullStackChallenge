'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { LayoutDashboard, LogOut, Users, BookOpen } from 'lucide-react';
import { Permissions, hasPermission } from '@/lib/permissions';

export function Navbar() {
  const { data: session } = useSession();

  if (!session) return null;

  const role = session.user?.role;
  const canManageUsers = hasPermission(role, Permissions.CAN_MANAGE_USERS);
  const canViewWorkshops = hasPermission(role, Permissions.CAN_VIEW_WORKSHOPS);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-primary">Training Centre</span>
            </div>
            <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/dashboard" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
              {canViewWorkshops && (
                <Link href="/workshops" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Workshops
                </Link>
              )}
              {canManageUsers && (
                <Link href="/users" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  <Users className="w-4 h-4 mr-2" />
                  Users
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <span className="text-sm text-gray-500 mr-4">
              {session.user?.name} ({session.user?.role})
            </span>
            <button
              onClick={() => signOut()}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none transition ease-in-out duration-150"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
