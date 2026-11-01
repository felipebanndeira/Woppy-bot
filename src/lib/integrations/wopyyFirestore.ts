// Integración directa entre el Bot de IA y Firestore de Wopyy Nails

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyCmGwginUox1MIIF4rFK7hwbo_ecSLElKg";
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "wopyy-70cb0";
const BASE_FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

export interface WopyyAppointmentInput {
  customerName: string;
  customerPhone: string;
  serviceName: string;
  category?: string;
  amount?: number;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm (ej: "16:00")
}

/**
 * Consulta los turnos ya ocupados en la web de Wopyy para una fecha dada.
 */
export async function getWopyyOccupiedSlots(dateStr: string): Promise<string[]> {
  try {
    const url = `${BASE_FIRESTORE_URL}/wopyy_appointments?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const docs = data.documents || [];

    const occupiedTimes: string[] = [];

    for (const doc of docs) {
      const fields = doc.fields || {};
      const docDate = fields.appointment_date?.stringValue;
      const docTime = fields.appointment_time?.stringValue;
      const status = fields.status?.stringValue;

      // Si es de esa fecha y no está cancelado, está ocupado
      if (docDate === dateStr && docTime && status !== "cancelled") {
        occupiedTimes.push(docTime);
      }
    }

    return occupiedTimes;
  } catch (err) {
    console.error("Error al consultar turnos en Firestore:", err);
    return [];
  }
}

/**
 * Inserta un nuevo turno en la web de Wopyy (Firestore wopyy_appointments).
 * Al guardarse aquí, la web lo toma al instante y bloquea el horario en pantalla.
 */
export async function createWopyyAppointment(input: WopyyAppointmentInput): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const url = `${BASE_FIRESTORE_URL}/wopyy_appointments?key=${FIREBASE_API_KEY}`;

    const body = {
      fields: {
        customer_name: { stringValue: input.customerName.trim() },
        customer_phone: { stringValue: input.customerPhone.trim() },
        service_name: { stringValue: input.serviceName.trim() },
        category: { stringValue: input.category || "Uñas" },
        amount: { integerValue: String(input.amount || 15000) },
        appointment_date: { stringValue: input.appointmentDate.trim() },
        appointment_time: { stringValue: input.appointmentTime.trim() },
        reference_image_url: { stringValue: "" },
        status: { stringValue: "pending" },
        payment_method: { stringValue: "transfer_alias" },
        created_at: { stringValue: new Date().toISOString() },
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText };
    }

    const data = await res.json();
    const docId = data.name ? data.name.split("/").pop() : "ok";

    return { success: true, id: docId };
  } catch (err: any) {
    console.error("Error al guardar turno en Firestore:", err);
    return { success: false, error: err.message };
  }
}
