
export enum DayOfWeek {
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
  Sunday = "Sunday",
}

export interface TimeSlot {
  id: string;
  time: string;
  isBooked: boolean;
}

export interface Chamber {
  id: string;
  place: string;
  slots: TimeSlot[];
}

export type Schedule = {
  [key in DayOfWeek]: Chamber[];
};

export interface Patient {
  name: string;
  age: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  mobile: string;
}

export interface Appointment {
  id: string;
  patient: Patient;
  day: DayOfWeek;
  chamberId: string;
  slotId: string;
  time: string;
  place: string;
}
