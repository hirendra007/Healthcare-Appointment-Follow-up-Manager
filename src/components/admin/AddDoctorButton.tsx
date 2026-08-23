"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/ui/icons";

export function AddDoctorButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    specialisation: "",
    password: "password123" // Default password for newly created doctors
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessage("Doctor successfully added to the system!");
      setTimeout(() => {
        setIsOpen(false);
        setFormData({ name: "", email: "", specialisation: "", password: "password123" });
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
        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-200 flex items-center"
      >
        <PlusIcon className="w-5 h-5 mr-1.5" />
        Add Doctor
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Onboard New Doctor</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-900"
                  placeholder="e.g. Dr. Jane Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input 
                  type="email" 
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-900"
                  placeholder="jane.smith@clinic.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Specialization</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-900"
                  placeholder="e.g. Cardiologist"
                  value={formData.specialisation}
                  onChange={(e) => setFormData({...formData, specialisation: e.target.value})}
                  required
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">
                <p className="text-xs text-blue-700 font-medium">Temporary password <span className="font-bold">password123</span> will be assigned.</p>
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
                  className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-200 flex items-center"
                >
                  {isLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
