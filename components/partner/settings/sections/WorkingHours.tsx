"use client";

import { Clock, Check } from "lucide-react";
import { SettingsState, WorkingDay } from "../types";

interface WorkingHoursProps {
  data: SettingsState["workingHours"];
  onChange: (data: Partial<SettingsState>) => void;
}

export default function WorkingHours({ data, onChange }: WorkingHoursProps) {
  
  const handleUpdateDay = (index: number, updates: Partial<WorkingDay>) => {
    const newData = [...data];
    newData[index] = { ...newData[index], ...updates };
    onChange({ workingHours: newData });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-[#111827] flex items-center gap-2 mb-2">
          <Clock className="w-6 h-6 text-[#E23744]" /> Working Hours
        </h2>
        <p className="text-[#6B7280] text-sm mb-6">Define your restaurant's operating schedule.</p>
      </div>

      <div className="space-y-4">
        {data.map((day, idx) => (
          <div key={day.day} className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-[#E5E7EB] transition-colors">
            
            <div className="flex items-center justify-between md:w-48 shrink-0">
              <span className={`font-bold ${day.isOpen ? 'text-[#111827]' : 'text-[#9CA3AF]'}`}>{day.day}</span>
              
              {/* Custom Checkbox Toggle */}
              <label className="flex items-center cursor-pointer md:mr-4">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={!day.isOpen}
                    onChange={() => handleUpdateDay(idx, { isOpen: !day.isOpen })}
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${!day.isOpen ? 'bg-red-500' : 'bg-[#FFFFFF] border border-[#E5E7EB]'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${!day.isOpen ? 'transform translate-x-4' : ''}`}></div>
                </div>
                <span className="ml-3 text-xs font-bold text-[#6B7280] uppercase tracking-wider hidden md:block">
                  {day.isOpen ? 'Open' : 'Closed'}
                </span>
              </label>
            </div>

            <div className={`flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto transition-opacity ${day.isOpen ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-[#9CA3AF] uppercase w-12 text-right">Opens</span>
                <input 
                  type="time" 
                  value={day.openTime}
                  onChange={(e) => handleUpdateDay(idx, { openTime: e.target.value })}
                  className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors text-sm flex-1 sm:w-36"
                />
              </div>
              
              <div className="hidden sm:block text-[#9CA3AF]">-</div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-[#9CA3AF] uppercase w-12 text-right">Closes</span>
                <input 
                  type="time" 
                  value={day.closeTime}
                  onChange={(e) => handleUpdateDay(idx, { closeTime: e.target.value })}
                  className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-[#111827] focus:outline-none focus:border-[#E23744] transition-colors text-sm flex-1 sm:w-36"
                />
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
