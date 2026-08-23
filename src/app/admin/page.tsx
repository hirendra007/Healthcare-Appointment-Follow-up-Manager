import { ClockIcon, UserIcon, AlertIcon } from "@/components/ui/icons";
import { AddDoctorButton } from "@/components/admin/AddDoctorButton";
import { MarkLeaveButton } from "@/components/admin/MarkLeaveButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export default async function AdminPortal() {
  const session = await getServerSession(authOptions);
  
  console.log("AdminPortal Session:", JSON.stringify(session));

  if (!session) {
    redirect("/login?callbackUrl=/admin");
  }
  
  if ((session.user as any).role !== "ADMIN") {
    console.log("Redirecting to / because role is", (session.user as any).role);
    redirect("/");
  }

  const today = new Date();
  
  // Analytics Fetching
  const totalDoctors = await prisma.doctorProfile.count();
  const appointmentsToday = await prisma.appointment.count({
    where: {
      startTime: { gte: startOfDay(today), lte: endOfDay(today) }
    }
  });
  
  const leavesToday = await prisma.leave.count({
    where: {
      startDate: { lte: today },
      endDate: { gte: startOfDay(today) }
    }
  });

  const doctorsList = await prisma.doctorProfile.findMany({
    include: {
      user: true,
      leaves: {
        where: {
          startDate: { lte: today },
          endDate: { gte: startOfDay(today) }
        }
      }
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Clinic Operations</h1>
          <p className="text-gray-500 mt-1">Manage staff, schedules, and monitor system health.</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <MarkLeaveButton doctors={doctorsList.map(d => ({id: d.id, name: d.user.name}))} />
          <AddDoctorButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="bg-blue-50 p-4 rounded-xl text-blue-600">
            <UserIcon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Doctors</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalDoctors}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="bg-indigo-50 p-4 rounded-xl text-indigo-600">
            <ClockIcon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Appointments Today</p>
            <h3 className="text-2xl font-bold text-gray-900">{appointmentsToday}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="bg-amber-50 p-4 rounded-xl text-amber-600">
            <AlertIcon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Staff on Leave Today</p>
            <h3 className="text-2xl font-bold text-gray-900">{leavesToday}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Doctor Directory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Specialization</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {doctorsList.map(doc => {
                const isOnLeave = doc.leaves.length > 0;
                return (
                  <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {doc.user.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-900">{doc.user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{doc.specialisation}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{doc.user.email}</td>
                    <td className="px-6 py-4 text-right">
                      {isOnLeave ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          On Leave
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {doctorsList.length === 0 && (
            <div className="p-8 text-center text-gray-500">No doctors registered in the system.</div>
          )}
        </div>
      </div>
    </div>
  );
}
