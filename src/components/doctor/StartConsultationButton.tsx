"use client";

import { useState } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";

export function StartConsultationButton({ appointmentId }: { appointmentId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  const handleFinish = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          clinicalNotes: notes,
        }),
      });

      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setMessage("Consultation notes processed by AI successfully!");
      setTimeout(() => {
        setIsOpen(false);
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
        className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-black transition-all shadow-md flex items-center group"
      >
        Start Consultation
        <ChevronRightIcon className="w-4 h-4 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-1 text-gray-900">Clinical Notes</h2>
            <p className="text-sm text-gray-500 mb-6">Type your raw observations. AI will parse this into a summary and prescriptions.</p>
            
            <div className="space-y-4">
              <div>
                <textarea 
                  className="w-full border-2 border-gray-100 rounded-2xl p-5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none resize-none transition-all"
                  rows={8}
                  placeholder="Patient reports pain subsided after taking prescribed meds. Heart rate normal. Prescribing amoxicillin 500mg twice a day for 7 days. Follow up in 2 weeks."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {message && (
                <div className={`p-4 rounded-xl text-sm font-medium ${message.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                  {message}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-6">
                <button 
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="px-5 py-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleFinish}
                  disabled={isLoading || notes.length < 5}
                  className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-200 flex items-center"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></span>
                      AI Processing...
                    </>
                  ) : 'Finish & Run AI Pipeline'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
