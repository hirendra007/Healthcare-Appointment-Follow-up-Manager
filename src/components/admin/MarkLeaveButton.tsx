"use client";

import { useState } from "react";

export function MarkLeaveButton({ doctors = [] }: { doctors?: {id: string, name: string}[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [doctorId, setDoctorId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, startDate, endDate }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessage("Leave marked successfully!");
      setTimeout(() => {
        setIsOpen(false);
        setDoctorId("");
        setStartDate("");
        setEndDate("");
        setMessage("");
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setMessage("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl text-sm font-semibold transition-colors"
      >
        Mark Leave
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Mark Doctor Leave</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Doctor</label>
                <select 
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  required
                >
                  <option value="" disabled>Choose a doctor...</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                  <input 
                    type="date" 
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                  <input 
                    type="date" 
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-xl text-sm font-medium ${message.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                  {message}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="px-5 py-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-gray-900 text-white hover:bg-black rounded-xl text-sm font-semibold transition-all shadow-md flex items-center"
                >
                  {isLoading ? 'Processing...' : 'Confirm Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
