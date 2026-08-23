"use client";

export function SyncCalendarButton() {
  const handleSync = () => {
    window.location.href = "/api/calendar/auth?doctorId=cmt5z6e050002d8ntysghrdbd";
  };

  return (
    <button 
      onClick={handleSync}
      className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
    >
      Sync with Google Calendar
    </button>
  );
}
