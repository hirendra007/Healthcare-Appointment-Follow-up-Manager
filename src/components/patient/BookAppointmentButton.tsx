"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronRightIcon, CalendarIcon } from "@/components/ui/icons";

type Step = 1 | 2 | 3;

export function BookAppointmentButton({ doctors }: { doctors: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{start: string, end: string} | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [message, setMessage] = useState("");

  const handleNext = async () => {
    if (step === 1 && selectedDoctorId) {
      setStep(2);
      fetchSlots(selectedDoctorId, selectedDate);
    } else if (step === 2 && selectedSlot) {
      setStep(3);
    }
  };

  const fetchSlots = async (docId: string, date: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/slots?doctorId=${docId}&date=${date}`);
      const data = await res.json();
      setAvailableSlots(data.slots || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    setSelectedSlot(null);
    fetchSlots(selectedDoctorId, newDate);
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setIsLoading(true);
    setMessage("");
    try {
      // 1. Hold a slot
      const holdRes = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
        }),
      });
      
      const holdData = await holdRes.json();
      if (!holdData.hold?.id) throw new Error(holdData.error || "Failed to hold slot");

      // 2. Book appointment
      const bookRes = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holdId: holdData.hold.id,
          rawSymptoms: symptoms || "Routine checkup",
        }),
      });

      const bookData = await bookRes.json();
      if (bookData.error) throw new Error(bookData.error);

      setMessage("Appointment booked successfully!");
      setTimeout(() => {
        setIsOpen(false);
        // Reset state
        setStep(1);
        setSelectedDoctorId("");
        setSelectedSlot(null);
        setSymptoms("");
        setMessage("");
        // Refresh the page to show the new appointment
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
        className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all flex items-center group"
      >
        Book Appointment 
        <ChevronRightIcon className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {step === 1 ? "Select a Doctor" : step === 2 ? "Pick a Time" : "Confirm Booking"}
              </h2>
              <div className="flex space-x-2">
                <div className={`w-2.5 h-2.5 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <div className={`w-2.5 h-2.5 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <div className={`w-2.5 h-2.5 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              </div>
            </div>
            
            <div className="min-h-[300px]">
              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {doctors.map(doc => (
                    <div 
                      key={doc.id}
                      onClick={() => setSelectedDoctorId(doc.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedDoctorId === doc.id ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                          {doc.user.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{doc.user.name}</h3>
                          <p className="text-sm text-gray-500">{doc.specialisation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Date</label>
                    <div className="relative">
                      <CalendarIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input 
                        type="date" 
                        value={selectedDate}
                        onChange={handleDateChange}
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Available Slots</label>
                    {isLoading ? (
                      <div className="text-center py-8 text-gray-400 animate-pulse">Checking availability...</div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">No slots available on this date.</div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3 max-h-[220px] overflow-y-auto pr-2">
                        {availableSlots.map((slot, idx) => {
                          const isSelected = selectedSlot?.start === slot.start;
                          return (
                            <button
                              key={idx}
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-2 px-1 rounded-xl text-sm font-medium border-2 transition-all ${isSelected ? 'border-blue-600 bg-blue-600 text-white shadow-md' : 'border-gray-100 text-gray-700 hover:border-gray-200 hover:bg-gray-50'}`}
                            >
                              {format(new Date(slot.start), "h:mm a")}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">Appointment Summary</h3>
                    <p className="text-sm text-blue-700">
                      {format(new Date(selectedSlot!.start), "MMMM d, yyyy")} at {format(new Date(selectedSlot!.start), "h:mm a")}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">What's the reason for your visit?</label>
                    <textarea 
                      className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50 focus:bg-white transition-colors"
                      rows={4}
                      placeholder="Please describe your symptoms briefly..."
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                    />
                  </div>

                  {message && (
                    <div className={`p-4 rounded-xl text-sm font-medium ${message.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                      {message}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
              <button 
                onClick={() => {
                  if (step > 1) setStep((s) => (s - 1) as Step);
                  else setIsOpen(false);
                }}
                disabled={isLoading}
                className="px-5 py-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl text-sm font-semibold transition-colors"
              >
                {step === 1 ? 'Cancel' : 'Back'}
              </button>
              
              {step < 3 ? (
                <button 
                  onClick={handleNext}
                  disabled={step === 1 ? !selectedDoctorId : !selectedSlot}
                  className="px-6 py-2.5 bg-gray-900 text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-all shadow-md"
                >
                  Continue
                </button>
              ) : (
                <button 
                  onClick={handleBook}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70 rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-200 flex items-center"
                >
                  {isLoading ? 'Processing...' : 'Confirm Booking'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
