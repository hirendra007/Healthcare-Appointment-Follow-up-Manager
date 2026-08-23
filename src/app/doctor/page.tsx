import { CalendarIcon, PrescriptionIcon, AlertIcon } from "@/components/ui/icons";
import { SyncCalendarButton } from "@/components/doctor/SyncCalendarButton";
import { StartConsultationButton } from "@/components/doctor/StartConsultationButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { format, startOfDay, endOfDay } from "date-fns";

export default async function DoctorPortal() {
  const session = await getServerSession(authOptions);
  
  console.log("DoctorPortal Session:", JSON.stringify(session));

  if (!session) {
    redirect("/login?callbackUrl=/doctor");
  }
  
  const user = session.user as any;
  if (user.role !== "DOCTOR") {
    console.log("Redirecting to / because role is", user.role);
    redirect("/");
  }

  // Fetch today's appointments for this doctor
  const today = new Date();
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: user.doctorId,
      startTime: {
        gte: startOfDay(today),
        lte: endOfDay(today)
      },
      status: { not: "CANCELLED" }
    },
    orderBy: { startTime: 'asc' },
    include: {
      patient: true,
      symptomSubmission: true,
      consultationNote: true
    }
  });

  const pendingSummaries = appointments.filter(a => !a.consultationNote).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 text-white p-8 rounded-[2rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 mb-6 md:mb-0">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dr. {user.name.split(' ')[0]}'s Command Center</h1>
          <p className="text-slate-300">You have {appointments.length} appointments scheduled for today.</p>
        </div>
        <div className="relative z-10">
          <SyncCalendarButton />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <span className="w-2 h-6 bg-blue-600 rounded-full mr-3"></span>
            Today's Timeline
          </h2>
          
          {appointments.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-sm text-center">
               <p className="text-gray-500 font-medium">Your schedule is clear for today.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {appointments.map((app) => {
                const symptomInfo = app.symptomSubmission;
                const isHighUrgency = symptomInfo?.urgencyLevel === "HIGH";
                const isMediumUrgency = symptomInfo?.urgencyLevel === "MEDIUM";

                return (
                  <div key={app.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{format(new Date(app.startTime), "h:mm a")} - {app.patient.name}</h3>
                        <p className="text-sm text-gray-500">Status: {app.status}</p>
                      </div>
                      
                      {symptomInfo && (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                          ${isHighUrgency ? 'bg-red-100 text-red-800 border border-red-200' : 
                            isMediumUrgency ? 'bg-amber-100 text-amber-800 border border-amber-200' : 
                            'bg-green-100 text-green-800 border border-green-200'}
                        `}>
                          {isHighUrgency && <AlertIcon className="w-3 h-3 mr-1.5" />}
                          {symptomInfo.urgencyLevel} URGENCY
                        </span>
                      )}
                    </div>
                    
                    {/* Body */}
                    <div className="p-6">
                      {symptomInfo ? (
                        <div className="bg-slate-50 rounded-xl p-5 mb-5 border border-slate-200/60">
                          <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                            AI Pre-Visit Diagnostic
                          </h4>
                          <p className="text-sm text-gray-700 mb-4 bg-white p-3 rounded-lg border border-gray-100">
                            <span className="font-semibold text-gray-900 block mb-1">Chief Complaint:</span> 
                            {symptomInfo.chiefComplaint}
                          </p>
                          
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">AI Suggested Questions</p>
                          <ul className="text-sm text-gray-600 space-y-2">
                            {Array.isArray(symptomInfo.suggestedQuestions) && symptomInfo.suggestedQuestions.map((q: any, i: number) => (
                              <li key={i} className="flex items-start">
                                <span className="text-blue-500 mr-2 font-bold">•</span>
                                {q}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mb-5 italic">No AI pre-visit data available.</p>
                      )}
                      
                      <div className="flex justify-end">
                        {app.consultationNote ? (
                          <span className="text-sm font-semibold text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200 flex items-center">
                            Consultation Complete
                          </span>
                        ) : (
                          <StartConsultationButton appointmentId={app.id} />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold mb-5 flex items-center">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full mr-2"></span>
              Today's Quick Stats
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-600">Total Appointments</span>
                <span className="text-lg font-bold text-gray-900">{appointments.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl border border-amber-100">
                <span className="text-sm font-medium text-amber-800">Pending Summaries</span>
                <span className="text-lg font-bold text-amber-600">{pendingSummaries}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-100">
                <span className="text-sm font-medium text-green-800">Completed</span>
                <span className="text-lg font-bold text-green-600">{appointments.length - pendingSummaries}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
