(function () {
  const SCRIPT_URL = document.currentScript ? document.currentScript.src : "";
  const BASE_URL = SCRIPT_URL ? new URL(SCRIPT_URL).origin : window.location.origin;

  let contactId = localStorage.getItem("atiende_contact_id") || null;
  let conversationId = localStorage.getItem("atiende_conversation_id") || null;

  // Inyectar estilos
  const style = document.createElement("style");
  style.innerHTML = `
    .atiende-widget-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: #0f766e;
      box-shadow: 0 4px 14px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 99999;
      color: white;
      transition: transform 0.2s ease;
    }
    .atiende-widget-btn:hover {
      transform: scale(1.05);
    }
    .atiende-chat-box {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 360px;
      height: 520px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      border: 1px solid #e2e8f0;
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .atiende-header {
      background: #0f766e;
      color: white;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .atiende-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f8fafc;
    }
    .atiende-msg {
      max-width: 80%;
      padding: 10px 14px;
      font-size: 13px;
      line-height: 1.4;
      border-radius: 14px;
    }
    .atiende-msg-assistant {
      align-self: flex-start;
      background: white;
      color: #1e293b;
      border: 1px solid #e2e8f0;
    }
    .atiende-msg-user {
      align-self: flex-end;
      background: #0f766e;
      color: white;
    }
    .atiende-input-area {
      padding: 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 8px;
      background: white;
    }
    .atiende-input {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 8px 12px;
      font-size: 13px;
      outline: none;
    }
    .atiende-send-btn {
      background: #0f766e;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  // Crear elementos HTML
  const btn = document.createElement("div");
  btn.className = "atiende-widget-btn";
  btn.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;

  const chatBox = document.createElement("div");
  chatBox.className = "atiende-chat-box";
  chatBox.innerHTML = `
    <div class="atiende-header">
      <div>
        <div style="font-weight: bold; font-size: 14px;">Asistente Virtual</div>
        <div style="font-size: 11px; opacity: 0.85;">En línea ahora</div>
      </div>
      <span style="cursor: pointer; font-size: 18px;" id="atiende-close">&times;</span>
    </div>
    <div class="atiende-messages" id="atiende-msg-list">
      <div class="atiende-msg atiende-msg-assistant">
        ¡Hola! 👋 Soy el asistente virtual. ¿En qué podemos ayudarte hoy?
      </div>
    </div>
    <div class="atiende-input-area">
      <input type="text" class="atiende-input" id="atiende-text-input" placeholder="Escribe tu mensaje..." />
      <button class="atiende-send-btn" id="atiende-send">Enviar</button>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(chatBox);

  let isOpen = false;
  btn.onclick = () => {
    isOpen = !isOpen;
    chatBox.style.display = isOpen ? "flex" : "none";
  };
  chatBox.querySelector("#atiende-close").onclick = () => {
    isOpen = false;
    chatBox.style.display = "none";
  };

  const msgList = chatBox.querySelector("#atiende-msg-list");
  const input = chatBox.querySelector("#atiende-text-input");
  const sendBtn = chatBox.querySelector("#atiende-send");

  const sendMessage = async () => {
    const text = input.value.trim();
    if (!text) return;

    // Pintar mensaje usuario
    const userDiv = document.createElement("div");
    userDiv.className = "atiende-msg atiende-msg-user";
    userDiv.innerText = text;
    msgList.appendChild(userDiv);
    input.value = "";
    msgList.scrollTop = msgList.scrollHeight;

    try {
      const res = await fetch(`${BASE_URL}/api/chat/web`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, contactId, conversationId }),
      });
      const data = await res.json();

      if (data.contactId) {
        contactId = data.contactId;
        localStorage.setItem("atiende_contact_id", contactId);
      }
      if (data.conversationId) {
        conversationId = data.conversationId;
        localStorage.setItem("atiende_conversation_id", conversationId);
      }

      // Pintar respuesta asistente
      const botDiv = document.createElement("div");
      botDiv.className = "atiende-msg atiende-msg-assistant";
      botDiv.innerText = data.reply || "He procesado tu mensaje.";
      msgList.appendChild(botDiv);
      msgList.scrollTop = msgList.scrollHeight;
    } catch (e) {
      console.error("Error al enviar mensaje:", e);
    }
  };

  sendBtn.onclick = sendMessage;
  input.onkeydown = (e) => {
    if (e.key === "Enter") sendMessage();
  };
})();
