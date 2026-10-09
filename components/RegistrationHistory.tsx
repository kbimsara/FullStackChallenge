import { XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegistrationHistory({ registrations, canCancel, onCancel }: { registrations: any[], canCancel: boolean, onCancel: (id: string) => void }) {
  if (registrations.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        No registrations yet.
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <motion.ul variants={container} initial="hidden" animate="show" className="divide-y divide-gray-200 dark:divide-gray-800">
      {registrations.map((reg) => (
        <motion.li variants={itemAnim} key={reg._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{reg.attendeeName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{reg.attendeeEmail}</p>
            <div className="mt-1 flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                ${reg.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
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
              className="p-2 text-gray-400 hover:text-red-600 transition bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800 hover:border-red-200 dark:hover:border-red-800"
              title="Cancel Registration"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </motion.li>
      ))}
    </motion.ul>
  );
}
