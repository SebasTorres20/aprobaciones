// mailer.js — servicio simulado (mock)
const sentEmails = []; // memoria temporal de correos enviados

async function sendMail({ to, subject, html }) {
  const email = {
    to,
    subject,
    html,
    sentAt: new Date().toISOString(),
  };

  // Simulamos envío real
  console.log("📧 [MockMail] Email simulado:");
  console.log(JSON.stringify(email, null, 2));

  // Guardamos en memoria
  sentEmails.push(email);

  return { success: true, message: "Correo simulado enviado", email };
}

// 🔹 Esta función SÍ debe estar definida antes del export
function getSentEmails() {
  return sentEmails;
}

// ✅ Exporta ambas funciones
module.exports = { sendMail, getSentEmails };
