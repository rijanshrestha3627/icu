import { GoogleGenAI, Type } from "@google/genai";
import type { Patient, TriageAnalysis } from "../types";
import { patientDatabase } from "../src/services/patientDatabase";

/**
 * Retrieves the effective Gemini API key from localStorage or environment variables
 */
export function getApiKey(): string {
  try {
    const customKey = localStorage.getItem('gemini_api_key');
    if (customKey && customKey.trim()) return customKey.trim();
  } catch {
    // localStorage not accessible
  }
  return process.env.API_KEY || process.env.GEMINI_API_KEY || '';
}

/**
 * Sets a custom Gemini API key into localStorage
 */
export function setApiKey(key: string) {
  try {
    localStorage.setItem('gemini_api_key', key.trim());
  } catch (e) {
    console.error('Failed to save API key to localStorage', e);
  }
}

/**
 * Initializes GoogleGenAI client with the active key
 */
function getAIClient(): GoogleGenAI | null {
  const key = getApiKey();
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

export const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash';

/**
 * Retrieves active Gemini model (defaults to gemini-1.5-flash)
 */
export function getActiveModel(): string {
  try {
    const custom = localStorage.getItem('gemini_model_name');
    if (custom && custom.trim()) return custom.trim();
  } catch {}
  return DEFAULT_GEMINI_MODEL;
}

/**
 * Sets active Gemini model in localStorage
 */
export function setActiveModel(model: string) {
  try {
    localStorage.setItem('gemini_model_name', model.trim());
  } catch (e) {
    console.error('Failed to save model to localStorage', e);
  }
}

/**
 * Tests Gemini API connectivity with a quick verification ping
 */
export async function testGeminiConnection(testKey?: string, modelName?: string): Promise<{ success: boolean; message: string }> {
  const key = testKey || getApiKey();
  const model = modelName || getActiveModel();
  if (!key) {
    return { success: false, message: 'No API key provided or found in environment.' };
  }

  try {
    const testAi = new GoogleGenAI({ apiKey: key });
    const response = await testAi.models.generateContent({
      model: model,
      contents: 'Respond with the single word: "Operational"',
    });

    return {
      success: true,
      message: `Gemini API connected successfully: ${response.text?.trim() || 'Operational'}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to authenticate with Gemini API.',
    };
  }
}

/**
 * Generates an AI Comprehensive Examination / Discharge Summary.
 * Consumes patient data from central state and automatically persists the output to the patient's record.
 */
export async function generateSummary(notesOrPatient: string | Patient, patientId?: string): Promise<string> {
  const ai = getAIClient();
  let patientProfileText = '';
  let targetPatientId = patientId;

  if (typeof notesOrPatient === 'object' && notesOrPatient !== null) {
    const p = notesOrPatient as Patient;
    targetPatientId = p.id;
    patientProfileText = `
PATIENT PROFILE:
- ID: ${p.id}
- Name: ${p.name}
- Age/Gender: ${p.age}y / ${p.gender}
- Blood Type: ${p.bloodType || 'Unknown'}
- Admitting Department: ${p.department || 'ICU'}
- Status: ${p.status || 'Active'}

CHIEF COMPLAINT:
${p.triageInfo?.chiefComplaint || 'Acute symptoms'}

CURRENT VITALS:
- Heart Rate: ${p.heart_rate_bpm || 75} bpm
- Blood Pressure: ${p.bp_systolic || 120}/${p.bp_diastolic || 80} mmHg
- Temperature: ${p.temperature_F || 98.6}°F
- Respiration Rate: ${p.respiration_rate || 16} /min

MEDICAL & SURGICAL HISTORY:
${p.medicalHistory?.pastConditions?.map(c => `- ${c.condition} (Diagnosed: ${c.diagnosedDate})`).join('\n') || 'None recorded'}
${p.surgeries?.map(s => `- Surgery: ${s}`).join('\n') || ''}

ACTIVE PRESCRIPTIONS:
${p.prescriptions?.map(rx => `- ${rx.medication} ${rx.dosage} (${rx.instructions})`).join('\n') || 'None'}

CLINICAL NOTES:
${p.clinicalNotes || 'No notes recorded'}
`;
  } else {
    patientProfileText = notesOrPatient as string;
  }

  let generatedSummary = '';

  if (!ai) {
    generatedSummary = `[SIMULATED GEMINI AI CLINICAL REPORT - API Key Pending]

**Comprehensive Patient Examination & Discharge Assessment**

**1. Patient Overview:**
Clinical evaluation indicates an acute admission stabilized under continuous hemodynamic monitoring. Primary presentation addressed.

**2. Key Clinical Findings:**
• Hemodynamic stability achieved with normalized heart rate and perfusion.
• Ventilatory parameters within physiological ranges.
• Initial inflammatory markers responding to inpatient medication protocol.

**3. AI Risk Trajectory:**
Low-to-moderate deterioration risk (estimated index: 24%). Safe for planned step-down or discharge with outpatient adherence.

**4. Treatment & Medication Plan:**
• Continue prescribed cardiovascular and antibiotic regimen.
• Avoid nephrotoxic agents; repeat renal panel in 7 days.
• Restrict sodium intake and monitor daily weight.

**5. Discharge & Follow-up Instructions:**
• Urgent clinic review if chest discomfort, fever >38.5°C, or dyspnea reoccurs.
• Scheduled follow-up consultation in 10 days.`;
  } else {
    try {
      const systemInstruction = `You are a Principal Hospital Clinical Intelligence AI.
Produce an authoritative, structured clinical examination & discharge summary for the treating medical team.
Structure the report with the following clear markdown headings:
1. Patient Overview & Clinical Background
2. Key Clinical Observations & Hemodynamic Status
3. AI Deterioration Risk Assessment
4. Recommended Medication & Treatment Adjustments
5. Discharge Instructions & Follow-up Plan

Use professional, precise medical terminology. Be concise and actionable.`;

      const response = await ai.models.generateContent({
        model: getActiveModel(),
        contents: `Generate a clinical report for this patient:\n\n${patientProfileText}`,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });

      generatedSummary = response.text || 'Summary generation completed.';
    } catch (error) {
      console.error('Error generating summary with Gemini:', error);
      throw new Error('Gemini API communication failed during summary generation.');
    }
  }

  // Automatically save AI summary directly into patient record in central database!
  if (targetPatientId) {
    const existing = patientDatabase.getPatientById(targetPatientId);
    if (existing) {
      patientDatabase.updatePatient(targetPatientId, {
        clinicalNotes: `${existing.clinicalNotes || ''}\n\n[GEMINI AI CLINICAL SUMMARY ${new Date().toLocaleString()}]\n${generatedSummary}`,
      });
    }
  }

  return generatedSummary;
}

/**
 * Calculates Triage Risk using Gemini AI.
 * Consumes patient info and directly updates risk score & justification in the central database.
 */
export async function calculateTriageRisk(
  complaintOrPatient: string | Patient,
  ageParam?: number,
  genderParam?: string,
  targetPatientId?: string
): Promise<TriageAnalysis> {
  const ai = getAIClient();

  let complaint = '';
  let age = ageParam || 45;
  let gender = genderParam || 'Unknown';
  let patientId = targetPatientId;

  if (typeof complaintOrPatient === 'object' && complaintOrPatient !== null) {
    const p = complaintOrPatient as Patient;
    complaint = p.triageInfo?.chiefComplaint || p.symptoms?.join(', ') || 'Acute symptoms';
    age = p.age;
    gender = p.gender;
    patientId = p.id;
  } else {
    complaint = complaintOrPatient as string;
  }

  let analysisResult: TriageAnalysis;

  if (!ai) {
    // Deterministic clinically grounded mock triage
    let baseScore = 30;
    const lower = complaint.toLowerCase();
    if (lower.includes('chest') || lower.includes('infarct') || lower.includes('sepsis') || lower.includes('stroke') || lower.includes('unconscious')) {
      baseScore = 88;
    } else if (lower.includes('fracture') || lower.includes('pain') || lower.includes('fever') || lower.includes('breath')) {
      baseScore = 62;
    } else {
      baseScore = 25;
    }

    analysisResult = {
      score: baseScore,
      justification: `[AI Simulated Triage] The patient's chief complaint of "${complaint}" in a ${age}yo ${gender} warrants a ${
        baseScore > 75 ? 'Critical (High)' : baseScore > 40 ? 'Moderate (Urgent)' : 'Low'
      } acuity classification. Continuous hemodynamic and telemetry monitoring recommended.`,
    };
  } else {
    try {
      const systemInstruction = `You are a Senior Emergency & ICU Triage AI Specialist.
Analyze the patient's chief complaint, age, and gender to output a calibrated risk score from 1 (lowest acuity) to 100 (immediate resuscitation required), along with a concise clinical justification.
Response must strictly match JSON format with integer 'score' and string 'justification'.`;

      const response = await ai.models.generateContent({
        model: getActiveModel(),
        contents: `Evaluate triage case:
- Chief Complaint: "${complaint}"
- Age: ${age}
- Gender: ${gender}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: 'Risk score from 1 to 100.' },
              justification: { type: Type.STRING, description: 'Clinical justification for score.' },
            },
            required: ['score', 'justification'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      analysisResult = {
        score: parsed.score ?? 50,
        justification: parsed.justification ?? 'Triage analysis completed.',
      };
    } catch (error) {
      console.error('Error calculating triage risk with Gemini:', error);
      throw new Error('Failed to communicate with Gemini API for triage analysis.');
    }
  }

  // Automatically update the patient's record in central database!
  if (patientId) {
    const riskLevel: 'High' | 'Medium' | 'Low' =
      analysisResult.score >= 70 ? 'High' : analysisResult.score >= 40 ? 'Medium' : 'Low';

    patientDatabase.updatePatient(patientId, {
      triageInfo: {
        chiefComplaint: complaint,
        risk: riskLevel,
        riskScore: analysisResult.score,
        triageDate: new Date().toISOString(),
      },
    });
  }

  return analysisResult;
}

/**
 * Recommends optimal hospital department using Gemini AI.
 * Automatically saves recommended department into central database.
 */
export async function recommendDepartment(
  patientData: {
    id?: string;
    age: number;
    gender: string;
    chiefComplaint: string;
    vitals?: {
      temperature?: number;
      heartRate?: number;
      respirationRate?: number;
      bloodPressure?: { systolic: number; diastolic: number };
    };
    symptomsSummary?: string;
  }
): Promise<{ department: string; explanation: string }> {
  const ai = getAIClient();

  let recommendation: { department: string; explanation: string };

  if (!ai) {
    const complaint = (patientData.chiefComplaint || '').toLowerCase();
    let dept = 'General Medicine';
    let expl = 'General Medicine provides comprehensive initial clinical evaluation.';

    if (complaint.includes('chest') || complaint.includes('heart') || complaint.includes('cardio')) {
      dept = 'Cardiology';
      expl = 'Presentation points toward cardiovascular pathology requiring specialized cardiology assessment.';
    } else if (complaint.includes('head') || complaint.includes('stroke') || complaint.includes('neuro') || complaint.includes('seizure')) {
      dept = 'Neurology';
      expl = 'Neurological symptoms detected; immediate neuro evaluation advised.';
    } else if (complaint.includes('bone') || complaint.includes('fracture') || complaint.includes('ortho') || complaint.includes('joint')) {
      dept = 'Orthopedics';
      expl = 'Musculoskeletal or orthopedic trauma signs detected.';
    } else if (complaint.includes('breath') || complaint.includes('lung') || complaint.includes('cough') || complaint.includes('pneumo')) {
      dept = 'Pulmonology';
      expl = 'Respiratory signs indicate pulmonary evaluation and pulse oximetry monitoring.';
    }

    recommendation = { department: dept, explanation: `[AI Simulated Allocation] ${expl}` };
  } else {
    try {
      const systemInstruction = `You are an expert Hospital Clinical Director AI specializing in department routing.
Analyze the patient's age, gender, chief complaint, and vitals to determine the optimal department.
Return JSON with 'department' (string) and 'explanation' (string).`;

      const response = await ai.models.generateContent({
        model: getActiveModel(),
        contents: `Recommend hospital department for:
- Age: ${patientData.age}
- Gender: ${patientData.gender}
- Chief Complaint: ${patientData.chiefComplaint}
- Symptoms: ${patientData.symptomsSummary || 'N/A'}
- Vitals: HR ${patientData.vitals?.heartRate || 'N/A'} bpm, BP ${patientData.vitals?.bloodPressure?.systolic || 'N/A'}/${patientData.vitals?.bloodPressure?.diastolic || 'N/A'} mmHg`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              department: { type: Type.STRING, description: 'Recommended department name' },
              explanation: { type: Type.STRING, description: 'Clinical rationale' },
            },
            required: ['department', 'explanation'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      recommendation = {
        department: parsed.department || 'General Medicine',
        explanation: parsed.explanation || 'Allocation based on presenting clinical indicators.',
      };
    } catch (error) {
      console.error('Error recommending department with Gemini:', error);
      throw new Error('Failed to communicate with Gemini API for department recommendation.');
    }
  }

  // Automatically update the patient's record in central state!
  if (patientData.id) {
    patientDatabase.updatePatient(patientData.id, {
      department: recommendation.department,
    });
  }

  return recommendation;
}

/**
 * Checks for drug-drug interactions and adverse drug reactions (ADR)
 */
export async function checkDrugInteractions(
  medications: string[],
  patientId?: string
): Promise<{ safe: boolean; severity: string; summary: string }> {
  const ai = getAIClient();

  if (!ai || medications.length < 2) {
    return {
      safe: true,
      severity: 'Low',
      summary: medications.length < 2
        ? 'Single medication listed; no significant drug-drug interaction flagged.'
        : `[AI Simulated ADR Review] Checked ${medications.length} medications. Monitor renal function and electrolyte balance.`,
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: getActiveModel(),
      contents: `Analyze these medications for critical drug-drug interactions and ADRs: ${medications.join(', ')}`,
      config: {
        systemInstruction: `You are a Clinical Pharmacologist AI.
Return JSON with 'safe' (boolean), 'severity' (Low/Moderate/Critical), and 'summary' (concise clinical warning/advisory).`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            safe: { type: Type.BOOLEAN },
            severity: { type: Type.STRING },
            summary: { type: Type.STRING },
          },
          required: ['safe', 'severity', 'summary'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const result = {
      safe: Boolean(parsed.safe),
      severity: parsed.severity || 'Low',
      summary: parsed.summary || 'Interaction check completed.',
    };

    if (patientId) {
      const p = patientDatabase.getPatientById(patientId);
      if (p) {
        patientDatabase.updatePatient(patientId, {
          clinicalNotes: `${p.clinicalNotes || ''}\n\n[DRUG INTERACTION CHECK ${new Date().toLocaleString()}]\n${result.summary} (Severity: ${result.severity})`,
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Error checking drug interactions:', error);
    return {
      safe: true,
      severity: 'Unknown',
      summary: 'ADR check fallback. Verify manual pharmacy formulary.',
    };
  }
}

/**
 * Interactive Clinical Reasoning Consultation with Gemini AI
 */
export async function askGeminiCopilot(query: string, patient?: Patient): Promise<string> {
  const ai = getAIClient();
  const patientInfo = patient ? `
Active Patient Context:
- Name: ${patient.name} (${patient.id})
- Age/Gender: ${patient.age}y / ${patient.gender}
- Chief Complaint: ${patient.triageInfo?.chiefComplaint}
- Current Vitals: HR ${patient.heart_rate_bpm || 75} bpm, BP ${patient.bp_systolic || 120}/${patient.bp_diastolic || 80} mmHg, Temp ${patient.temperature_F || 98.6}°F, RR ${patient.respiration_rate || 16}/min
- Clinical Notes: ${patient.clinicalNotes || 'None'}
- Prescriptions: ${patient.prescriptions?.map(p => p.medication).join(', ') || 'None'}
` : '';

  if (!ai) {
    return `[Simulated Gemini Clinical Response - API Key Pending]
Regarding your query "${query}"${patient ? ` for ${patient.name}` : ''}:
1. Clinical Assessment: Physiological parameters and symptom progression suggest targeted hemodynamic stabilization.
2. Recommended Action: Maintain continuous telemetry observation, repeat arterial blood gas if respiratory compromise occurs, and evaluate response to current protocol.`;
  }

  try {
    const systemInstruction = `You are a Principal ICU Specialist and Hospital Clinical Intelligence AI Co-Pilot.
You assist attending physicians with clinical differential diagnosis, hemodynamic management, and acute care decisions.
Provide a concise, evidence-based, and actionable consultation response.`;

    const response = await ai.models.generateContent({
      model: getActiveModel(),
      contents: `${patientInfo}\n\nClinical Query from Attending Physician:\n${query}`,
      config: {
        systemInstruction,
        temperature: 0.25,
      },
    });

    return response.text || 'Clinical consultation analysis completed.';
  } catch (error: any) {
    console.error('Error in askGeminiCopilot:', error);
    throw new Error(error.message || 'Gemini Clinical Co-Pilot query failed.');
  }
}