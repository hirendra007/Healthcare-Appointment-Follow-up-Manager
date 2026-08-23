import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class GeminiService {
  /**
   * Generates a pre-visit summary from raw patient symptoms.
   */
  static async generatePreVisitSummary(symptoms: string) {
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        urgencyLevel: {
          type: Type.STRING,
          enum: ['LOW', 'MEDIUM', 'HIGH'],
          description: 'The urgency level of the symptoms.',
        },
        chiefComplaint: {
          type: Type.STRING,
          description: 'A concise summary of the primary symptom or complaint.',
        },
        suggestedQuestions: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: 'Exactly 3 suggested questions the doctor should ask the patient.',
        },
      },
      required: ['urgencyLevel', 'chiefComplaint', 'suggestedQuestions'],
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: `Analyse these symptoms and return the urgency level, chief complaint, and exactly 3 suggested questions for the doctor. Symptoms: ${symptoms}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.2,
        },
      });

      const text = response.text;
      if (!text) throw new Error('No response from Gemini');

      const data = JSON.parse(text);

      // Ensure exactly 3 questions
      if (!data.suggestedQuestions || data.suggestedQuestions.length !== 3) {
        // Fix it or just accept what's there
        data.suggestedQuestions = (data.suggestedQuestions || []).slice(0, 3);
        while (data.suggestedQuestions.length < 3) {
          data.suggestedQuestions.push("Can you elaborate on this symptom?");
        }
      }

      return {
        success: true,
        data: {
          urgencyLevel: data.urgencyLevel,
          chiefComplaint: data.chiefComplaint,
          suggestedQuestions: data.suggestedQuestions,
        },
      };
    } catch (error) {
      console.error('Gemini pre-visit summarization failed:', error);
      return {
        success: false,
        data: null,
      };
    }
  }

  /**
   * Generates a patient-friendly summary from doctor's clinical notes.
   */
  static async generatePostVisitSummary(clinicalNotes: string) {
    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        patientSummary: {
          type: Type.STRING,
          description: 'A patient-friendly, easy to understand summary of the consultation.',
        },
        medicationSchedule: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              medicationName: { type: Type.STRING },
              dosage: { type: Type.STRING },
              frequency: { type: Type.STRING },
              instructions: { type: Type.STRING },
            },
            required: ['medicationName', 'dosage', 'frequency', 'instructions'],
          },
        },
        followUpSteps: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
      required: ['patientSummary', 'medicationSchedule', 'followUpSteps'],
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: `Convert these clinical notes into a patient-friendly summary, extracting any medication schedule and follow-up steps. Notes: ${clinicalNotes}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.2,
        },
      });

      const text = response.text;
      if (!text) throw new Error('No response from Gemini');

      return {
        success: true,
        data: JSON.parse(text),
      };
    } catch (error) {
      console.error('Gemini post-visit summarization failed:', error);
      return {
        success: false,
        data: null,
      };
    }
  }
}
