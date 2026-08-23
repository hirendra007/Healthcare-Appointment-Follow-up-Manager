import { CalendarIcon, ClockIcon, UserIcon, AlertIcon } from "@/components/ui/icons";
import { BookAppointmentButton } from "@/components/patient/BookAppointmentButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { format } from "date-fns";

export default async function PatientPortal() {
  const session = await getServerSession(authOptions);
  
  console.log("PatientPortal Session:", JSON.stringify(session));

  if (!session) {
    redirect("/login?callbackUrl=/patient");
  }
  
  const user = session.user as any;
  if (user.role !== "PATIENT") {
    console.log("Redirecting to / because role is", user.role);
    redirect("/");
  }

  // Fetch upcoming appointments
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      patientId: user.id,
      startTime: { gte: new Date() },
      status: { not: "CANCELLED" }
    },
    orderBy: { startTime: "asc" },
    include: { doctor: { include: { user: true } } },
    take: 3
  });

  // Fetch active prescriptions
  const activePrescriptions = await prisma.prescription.findMany({
    where: { patientId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true, doctor: { include: { user: true } } },
    take: 1
  });
  
  const currentPrescription = activePrescriptions[0];

  // Fetch all doctors for booking
  const doctors = await prisma.doctorProfile.findMany({
    include: { user: true }
  });

  const greeting = new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 mb-6 md:mb-0 space-y-2">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{greeting}, {user.name.split(' ')[0]}</h1>
          <p className="text-blue-100 text-lg">Welcome to your health dashboard.</p>
        </div>
        <div className="relative z-10 w-full md:w-auto">
          <BookAppointmentButton doctors={doctors} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Visits */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Visits</h2>
          </div>
          
          {upcomingAppointments.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <CalendarIcon className="w-8 h-8" />
              </div>
              <p className="text-gray-500 font-medium">You have no upcoming appointments.</p>
              <p className="text-sm text-gray-400 mt-1">Book a slot above when you need care.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((app) => (
                <div key={app.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                      {app.doctor.user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{app.doctor.user.name}</h3>
                      <p className="text-sm text-gray-500">{app.doctor.specialisation}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-1 inline-block">
                      {format(new Date(app.startTime), "MMM d, yyyy")}
                    </div>
                    <p className="text-sm text-gray-700 font-medium">
                      {format(new Date(app.startTime), "h:mm a")} - {format(new Date(app.endTime), "h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medication Schedule */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-green-100 p-2 rounded-lg text-green-600">
              <ClockIcon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Active Prescriptions</h2>
          </div>

          {!currentPrescription || currentPrescription.items.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
              <p className="text-gray-500 text-sm">No active prescriptions.</p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Prescribed by {currentPrescription.doctor.user.name}
              </p>
              {currentPrescription.items.map(item => (
                <div key={item.id} className="flex items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-2 h-2 mt-2 mr-3 rounded-full bg-green-500 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.medicationName}</h4>
                    <p className="text-sm text-gray-600">{item.dosage} • {item.frequency}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.instructions}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
