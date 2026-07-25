import { bootstrapSession, chatApi, notificationsApi } from "./api";
import { NewChatMessageEventSchema } from "./api/services/notifications/payloads";

const THREAD_ITEM_TEMPLATE = (thread) => {
  const raw_element = `
  <div class="thread-item" data-thread-id="${thread.id}">
    <div class="thread-header">
      <strong>Thread ID: ${thread.id}</strong>
      <p>Quote ID: ${thread.quote_group_id} | Archived: ${thread.is_archived}</p>
    </div>

  </div>

`;
  const template = document.createElement("template");
  template.innerHTML = raw_element;

  return template.content.firstElementChild;
};

const MESSAGE_ITEM_TEMPLATE = (is_read, sender_id, content) => {
  const raw_element = `
  <div class="message-item ${is_read ? "read" : "unread"}">
    <span class="message-sender">Sender: ${sender_id}</span>
    <p class="message-content">${escapeHtml(content)}</p>
  </div>
`;
  const template = document.createElement("template");
  template.innerHTML = raw_element;

  return template.content.firstElementChild;
};

const LOADING_TEMPLATE = `
  <p class="loading-text">Loading messages...</p>
`;

const ERROR_TEMPLATE = `
  <p class="error-text">Error loading messages.</p>
`;

const NO_MESSAGES_TEMPLATE = `
  <p class="no-messages-text">No messages yet.</p>
`;

// globals
let current_chat_id = null;

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

const loadMessages = async (chat_thread_id) => {
  console.log("Loading messages from the thread_id: ", chat_thread_id);

  const messageListContainer = document.getElementById("message-list");
  messageListContainer.innerHTML = LOADING_TEMPLATE;

  try {
    const messagesResponse = await chatApi.getThreadMessages(chat_thread_id, {
      limit: 10,
      offset: 0,
    });

    current_chat_id = chat_thread_id;

    if (messagesResponse.data.length < 1) {
      messageListContainer.innerHTML = NO_MESSAGES_TEMPLATE;
      return;
    }

    // clear container
    messageListContainer.innerHTML = "";

    messagesResponse.data.forEach((e) => {
      const messageComponent = MESSAGE_ITEM_TEMPLATE(e.is_read, e.sender_id, e.content);
      messageListContainer.prepend(messageComponent);
    });
  } catch (error) {
    console.error(
      `Failed to fetch messages for thread ${chat_thread_id}:`,
      error,
    );
    messageListContainer.innerHTML = ERROR_TEMPLATE;
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  await bootstrapSession();
  await notificationsApi.connect();

  const listContainer = document.getElementById("thread-list");
  const inputElement = document.getElementById("message-content");
  const messageForm = document.getElementById("message-form");
  const messageListContainer = document.getElementById("message-list");

  notificationsApi.subscribe("NewChatMessage", (rawEvent) => {
    try {
      const event = NewChatMessageEventSchema.parse(rawEvent);
      if (current_chat_id && event.thread_id == current_chat_id) {
        const messageComponent = MESSAGE_ITEM_TEMPLATE(false, event.sender_id, event.content_preview);
        messageListContainer.append(messageComponent);
      }
    } catch (error) {
      console.error("Malformed NewChatMessage payload:", error);
    }
  });

  messageForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!current_chat_id) return;

    const payload = { content: inputElement.value };
    inputElement.value = "";
    await chatApi.publishChatMessage(current_chat_id, payload);
  });

  try {
    const response = await chatApi.getUserChatThreads({ limit: 50, offset: 0 });

    response.data.forEach((thread) => {
      const thread_component = THREAD_ITEM_TEMPLATE(thread);

      thread_component.addEventListener("click", () => {
        loadMessages(thread.id);
      });

      listContainer.appendChild(thread_component);
    });
  } catch (error) {
    console.error("Failed to fetch chat threads:", error);
    listContainer.textContent = "Error loading threads.";
  }
});
