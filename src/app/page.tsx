import { CalendarIcon, UserIcon, ClockIcon, ChevronRightIcon } from "@/components/ui/icons";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 md:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mb-16">
        <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 mb-2 shadow-sm">
          <span className="flex w-2 h-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
          System Live
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
          Modern Clinical <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Care Management
          </span>
        </h1>
        <p className="text-lg md:text-xl leading-relaxed text-gray-600">
          An enterprise-grade platform unifying patient bookings, LLM-powered clinical summaries, and intelligent schedule orchestration.
        </p>
      </div>
      
      {/* Asymmetric Bento Grid */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 md:auto-rows-[280px]">
        
        {/* Patient Portal - Large Hero Card (Spans 2 columns & 2 rows on desktop) */}
        <Link href="/patient" className="group relative col-span-1 md:col-span-2 row-span-1 md:row-span-2 flex flex-col justify-between p-8 md:p-12 bg-white border border-gray-200 rounded-[2rem] shadow-sm hover:shadow-2xl hover:border-blue-300 transition-all duration-500 overflow-hidden">
          {/* Subtle gradient blob for clinical feel */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 transition-transform group-hover:scale-110 duration-700 ease-in-out"></div>
          
          <div className="relative z-10">
            <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 text-blue-700 shadow-sm border border-blue-200/50">
              <UserIcon className="w-8 h-8" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 group-hover:text-blue-700 transition-colors">Patient Portal</h2>
            <p className="text-gray-600 text-lg md:text-xl max-w-md leading-relaxed">
              Securely book appointments, submit pre-visit symptoms, and access your automated medication schedules.
            </p>
          </div>
          
          <div className="relative z-10 flex items-center text-blue-700 font-semibold mt-10 md:mt-0 text-lg">
            Access Portal 
            <ChevronRightIcon className="w-6 h-6 ml-2 transform group-hover:translate-x-2 transition-transform duration-300" />
          </div>
        </Link>

        {/* Doctor Portal - Dark Card */}
        <Link href="/doctor" className="group relative col-span-1 md:col-span-1 row-span-1 flex flex-col justify-between p-8 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700 ease-in-out"></div>
          
          <div className="relative z-10">
            <div className="bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-white backdrop-blur-sm border border-white/10">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Doctor Portal</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Review AI briefings, manage your calendar, and write smart prescriptions.
            </p>
          </div>
          
          <div className="relative z-10 flex justify-end mt-6">
            <div className="bg-white/10 p-3 rounded-full group-hover:bg-white group-hover:text-slate-900 transition-colors duration-300 border border-white/10">
               <ChevronRightIcon className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* Admin Portal - Light Card */}
        <Link href="/admin" className="group relative col-span-1 md:col-span-1 row-span-1 flex flex-col justify-between p-8 bg-white border border-gray-200 rounded-[2rem] shadow-sm hover:shadow-2xl hover:border-indigo-300 transition-all duration-500 overflow-hidden">
          <div className="relative z-10">
            <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-indigo-600 shadow-sm border border-indigo-100">
              <ClockIcon className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">Admin Portal</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Resolve scheduling conflicts, monitor API health, and manage staff leave.
            </p>
          </div>
          
          <div className="relative z-10 flex justify-end mt-6">
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
               <ChevronRightIcon className="w-5 h-5" />
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}
