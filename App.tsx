
import React, { useState, useEffect, useCallback } from 'react';
import { DayOfWeek, Schedule, Appointment, Patient, Chamber, TimeSlot } from './types';
import { DAYS_OF_WEEK } from './constants';
import { generateConfirmationMessage } from './services/geminiService';
import Modal from './components/Modal';
import { PlusIcon, PencilIcon, TrashIcon, LocationMarkerIcon, ClockIcon } from './components/icons';

// Helper to generate a default empty schedule
const generateEmptySchedule = (): Schedule => {
  return DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = [];
    return acc;
  }, {} as Schedule);
};

// Initial state with some dummy data for demonstration
const getInitialSchedule = (): Schedule => {
  const savedSchedule = localStorage.getItem('doctorSchedule');
  if (savedSchedule) {
    return JSON.parse(savedSchedule);
  }
  const schedule = generateEmptySchedule();
  schedule.Monday.push({
    id: 'ch_mon_1',
    place: 'Greenwood Clinic, 123 Health St.',
    slots: [
      { id: 'ts_mon_1_1', time: '10:00 AM', isBooked: false },
      { id: 'ts_mon_1_2', time: '10:30 AM', isBooked: true },
      { id: 'ts_mon_1_3', time: '11:00 AM', isBooked: false },
    ],
  });
  schedule.Wednesday.push({
    id: 'ch_wed_1',
    place: 'Downtown Medical Center, 456 Wellness Ave.',
    slots: [
      { id: 'ts_wed_1_1', time: '02:00 PM', isBooked: false },
      { id: 'ts_wed_1_2', time: '02:30 PM', isBooked: false },
    ],
  });
  return schedule;
};


const getInitialAppointments = (): Appointment[] => {
    const savedAppointments = localStorage.getItem('doctorAppointments');
    if(savedAppointments) {
        return JSON.parse(savedAppointments);
    }
    return [{
        id: 'apt_1',
        patient: { name: 'John Doe', age: '45', gender: 'Male', address: '1 Main St', mobile: '555-1234' },
        day: DayOfWeek.Monday,
        chamberId: 'ch_mon_1',
        slotId: 'ts_mon_1_2',
        time: '10:30 AM',
        place: 'Greenwood Clinic, 123 Health St.'
    }];
};

// Components defined outside App to avoid re-creation on render

interface ChamberEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (chamber: Chamber) => void;
    chamber: Chamber | null;
    day: DayOfWeek;
}

const ChamberEditModal: React.FC<ChamberEditModalProps> = ({ isOpen, onClose, onSave, chamber, day }) => {
    const [place, setPlace] = useState('');
    const [slots, setSlots] = useState<string>('');

    useEffect(() => {
        if (chamber) {
            setPlace(chamber.place);
            setSlots(chamber.slots.map(s => s.time).join(', '));
        } else {
            setPlace('');
            setSlots('');
        }
    }, [chamber]);

    const handleSave = () => {
        const newChamber: Chamber = {
            id: chamber?.id || `ch_${Date.now()}`,
            place: place,
            slots: slots.split(',')
                .map(s => s.trim())
                .filter(s => s)
                .map((time, index) => ({
                    id: chamber?.slots[index]?.id || `ts_${Date.now()}_${index}`,
                    time,
                    isBooked: chamber?.slots[index]?.isBooked || false
                }))
        };
        onSave(newChamber);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={chamber ? 'Edit Chamber' : 'Add Chamber'}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Day</label>
                    <input type="text" value={day} readOnly className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Place/Address</label>
                    <input type="text" value={place} onChange={e => setPlace(e.target.value)} placeholder="e.g., City Hospital, 1st Floor" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Time Slots (comma-separated)</label>
                    <input type="text" value={slots} onChange={e => setSlots(e.target.value)} placeholder="e.g., 09:00 AM, 09:30 AM" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div className="flex justify-end pt-4">
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Save Changes</button>
                </div>
            </div>
        </Modal>
    );
};

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBook: (patient: Patient) => void;
    slotInfo: { day: DayOfWeek; time: string; place: string } | null;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onBook, slotInfo }) => {
    const [patient, setPatient] = useState<Patient>({ name: '', age: '', gender: 'Male', address: '', mobile: '' });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPatient(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        // Basic validation
        if (!patient.name || !patient.age || !patient.mobile) {
            alert('Please fill all required fields.');
            return;
        }
        onBook(patient);
        onClose();
        setPatient({ name: '', age: '', gender: 'Male', address: '', mobile: '' });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Book Appointment">
            <div className="space-y-3">
                <div className="bg-indigo-50 p-3 rounded-md">
                    <p><span className="font-semibold">Day:</span> {slotInfo?.day}</p>
                    <p><span className="font-semibold">Time:</span> {slotInfo?.time}</p>
                    <p><span className="font-semibold">Place:</span> {slotInfo?.place}</p>
                </div>
                <input name="name" value={patient.name} onChange={handleInputChange} placeholder="Full Name" className="w-full p-2 border rounded-md" />
                <div className="flex gap-3">
                    <input name="age" value={patient.age} onChange={handleInputChange} placeholder="Age" className="w-1/2 p-2 border rounded-md" />
                    <select name="gender" value={patient.gender} onChange={handleInputChange} className="w-1/2 p-2 border rounded-md bg-white">
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                    </select>
                </div>
                <input name="address" value={patient.address} onChange={handleInputChange} placeholder="Address" className="w-full p-2 border rounded-md" />
                <input name="mobile" value={patient.mobile} onChange={handleInputChange} placeholder="Mobile Number" className="w-full p-2 border rounded-md" />
                <div className="flex justify-end pt-4">
                    <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Confirm Booking</button>
                </div>
            </div>
        </Modal>
    );
};


interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, message }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Appointment Confirmed!">
        <p className="text-gray-700 whitespace-pre-wrap">{message}</p>
        <div className="flex justify-end pt-4 mt-4">
            <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Close</button>
        </div>
    </Modal>
);

const App: React.FC = () => {
    const [schedule, setSchedule] = useState<Schedule>(getInitialSchedule);
    const [appointments, setAppointments] = useState<Appointment[]>(getInitialAppointments);
    const [isEditingChamber, setIsEditingChamber] = useState<{ day: DayOfWeek, chamber: Chamber | null } | null>(null);
    const [isBooking, setIsBooking] = useState<{ day: DayOfWeek, chamberId: string, slotId: string, time: string, place: string } | null>(null);
    const [confirmation, setConfirmation] = useState<{ show: boolean, message: string }>({ show: false, message: '' });

    useEffect(() => {
        localStorage.setItem('doctorSchedule', JSON.stringify(schedule));
    }, [schedule]);

    useEffect(() => {
        localStorage.setItem('doctorAppointments', JSON.stringify(appointments));
    }, [appointments]);

    const handleSaveChamber = useCallback((day: DayOfWeek, chamber: Chamber) => {
        setSchedule(prev => {
            const newSchedule = { ...prev };
            const dayChambers = [...newSchedule[day]];
            const existingIndex = dayChambers.findIndex(c => c.id === chamber.id);
            if (existingIndex > -1) {
                dayChambers[existingIndex] = chamber;
            } else {
                dayChambers.push(chamber);
            }
            newSchedule[day] = dayChambers;
            return newSchedule;
        });
    }, []);
    
    const handleDeleteChamber = useCallback((day: DayOfWeek, chamberId: string) => {
        if(window.confirm('Are you sure you want to delete this chamber and all its slots?')) {
            setSchedule(prev => {
                const newSchedule = { ...prev };
                newSchedule[day] = newSchedule[day].filter(c => c.id !== chamberId);
                return newSchedule;
            });
            setAppointments(prev => prev.filter(a => a.chamberId !== chamberId));
        }
    }, []);

    const handleBookAppointment = useCallback(async (patient: Patient) => {
        if (!isBooking) return;
        
        const { day, chamberId, slotId, time, place } = isBooking;
        
        const newAppointment: Appointment = {
            id: `apt_${Date.now()}`,
            patient,
            day,
            chamberId,
            slotId,
            time,
            place
        };

        setAppointments(prev => [newAppointment, ...prev]);
        setSchedule(prev => {
            const newSchedule = { ...prev };
            const dayChambers = newSchedule[day].map(chamber => {
                if (chamber.id === chamberId) {
                    return {
                        ...chamber,
                        slots: chamber.slots.map(slot => 
                            slot.id === slotId ? { ...slot, isBooked: true } : slot
                        )
                    };
                }
                return chamber;
            });
            newSchedule[day] = dayChambers;
            return newSchedule;
        });

        const confirmationMsg = await generateConfirmationMessage(patient.name, day, time, place);
        setConfirmation({ show: true, message: confirmationMsg });
        setIsBooking(null);

    }, [isBooking]);

    const handleSaveSchedule = () => {
        localStorage.setItem('doctorSchedule', JSON.stringify(schedule));
        localStorage.setItem('doctorAppointments', JSON.stringify(appointments));
        alert('Schedule and appointments saved!');
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-4 py-4">
                    <h1 className="text-3xl font-bold text-indigo-600">Doctor's Appointment Dashboard</h1>
                    <p className="text-gray-500">Manage your schedule and view patient bookings in real-time.</p>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Panel: Doctor's Controls & Schedule */}
                <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold">Weekly Schedule Management</h2>
                        <button onClick={handleSaveSchedule} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition duration-200">
                            Save All Changes
                        </button>
                    </div>
                    <div className="space-y-6">
                        {DAYS_OF_WEEK.map(day => (
                            <div key={day} className="border border-gray-200 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-gray-700">{day}</h3>
                                    <button onClick={() => setIsEditingChamber({ day, chamber: null })} className="p-2 rounded-full text-indigo-600 hover:bg-indigo-100">
                                        <PlusIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                {schedule[day].length > 0 ? (
                                    <div className="mt-4 space-y-4">
                                        {schedule[day].map(chamber => (
                                            <div key={chamber.id} className="bg-gray-50 p-3 rounded-md">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold flex items-center gap-2"><LocationMarkerIcon className="w-5 h-5 text-gray-500" /> {chamber.place}</p>
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {chamber.slots.map(slot => (
                                                                <span key={slot.id} className={`px-2 py-1 text-xs font-medium rounded-full ${slot.isBooked ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                                                                    {slot.time}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setIsEditingChamber({ day, chamber })} className="p-1 text-gray-500 hover:text-blue-600"><PencilIcon className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDeleteChamber(day, chamber.id)} className="p-1 text-gray-500 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 mt-2">No chambers scheduled for this day.</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Patient View & Bookings */}
                <div className="lg:col-span-2 space-y-8">
                     {/* Patient View Panel */}
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Patient Booking View</h2>
                         <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            {DAYS_OF_WEEK.map(day => schedule[day].length > 0 && (
                                <div key={`patient-view-${day}`}>
                                    <h3 className="text-md font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">{day}</h3>
                                    {schedule[day].map(chamber => (
                                        <div key={`patient-${chamber.id}`} className="mt-2 pl-2">
                                            <p className="font-semibold text-sm text-gray-600 mb-2 flex items-center gap-1"><LocationMarkerIcon className="w-4 h-4" />{chamber.place}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {chamber.slots.map(slot => (
                                                    <button 
                                                        key={`patient-${slot.id}`}
                                                        disabled={slot.isBooked}
                                                        onClick={() => !slot.isBooked && setIsBooking({ day, chamberId: chamber.id, slotId: slot.id, time: slot.time, place: chamber.place })}
                                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${slot.isBooked 
                                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                                            : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
                                                        {slot.time}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Appointments List Panel */}
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Booked Appointments</h2>
                        <div className="max-h-[400px] overflow-y-auto">
                            {appointments.length > 0 ? (
                                <ul className="space-y-4">
                                    {appointments.map(apt => (
                                        <li key={apt.id} className="p-3 bg-blue-50 rounded-lg">
                                            <p className="font-bold text-blue-800">{apt.patient.name} <span className="font-normal text-sm text-gray-600">({apt.patient.age}, {apt.patient.gender})</span></p>
                                            <p className="text-sm text-gray-700 flex items-center gap-2"><ClockIcon className="w-4 h-4"/>{apt.day}, {apt.time}</p>
                                            <p className="text-sm text-gray-700 flex items-center gap-2"><LocationMarkerIcon className="w-4 h-4"/>{apt.place}</p>
                                            <p className="text-xs text-gray-500 mt-1">Mob: {apt.patient.mobile}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-500 py-4">No appointments booked yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <ChamberEditModal 
                isOpen={isEditingChamber !== null}
                onClose={() => setIsEditingChamber(null)}
                onSave={(chamber) => handleSaveChamber(isEditingChamber!.day, chamber)}
                chamber={isEditingChamber?.chamber || null}
                day={isEditingChamber?.day || DayOfWeek.Monday}
            />

            <BookingModal
                isOpen={isBooking !== null}
                onClose={() => setIsBooking(null)}
                onBook={handleBookAppointment}
                slotInfo={isBooking}
            />

            <ConfirmationModal
                isOpen={confirmation.show}
                onClose={() => setConfirmation({ show: false, message: '' })}
                message={confirmation.message}
            />

        </div>
    );
};

export default App;
