
import { GoogleGenAI } from "@google/genai";
import { DayOfWeek } from '../types';

export const generateConfirmationMessage = async (
  patientName: string,
  day: DayOfWeek,
  time: string,
  place: string
): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      return `Dear ${patientName}, your appointment at ${place} on ${day} at ${time} is confirmed. Please arrive 10 minutes early.`;
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a polite and friendly appointment confirmation message for a patient.
      Patient's Name: ${patientName}
      Appointment Day: ${day}
      Appointment Time: ${time}
      Clinic Address: ${place}
      Keep it concise and warm. Start with "Dear ${patientName},". Mention all the details and suggest arriving a few minutes early.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating confirmation message:", error);
    // Fallback message
    return `Dear ${patientName}, your appointment at ${place} on ${day} at ${time} is confirmed. Please arrive 10 minutes early.`;
  }
};
