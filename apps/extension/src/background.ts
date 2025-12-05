/**
 * XFERNO Extension Background Service Worker
 *
 * Handles background tasks, message passing, and state management
 */

// Extension state
interface ExtensionState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
}

let state: ExtensionState = {
  isConnected: false,
  address: null,
  chainId: null,
};

// Message types
type MessageType =
  | "GET_STATE"
  | "CONNECT"
  | "DISCONNECT"
  | "SWITCH_CHAIN"
  | "GET_BALANCE";

interface Message {
  type: MessageType;
  payload?: unknown;
}

interface MessageResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Listen for messages from popup/content scripts
chrome.runtime.onMessage.addListener(
  (
    message: Message,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    handleMessage(message)
      .then((response) => sendResponse(response))
      .catch((error) =>
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      );

    // Return true to indicate async response
    return true;
  }
);

async function handleMessage(message: Message): Promise<MessageResponse> {
  switch (message.type) {
    case "GET_STATE":
      return { success: true, data: state };

    case "CONNECT":
      return handleConnect();

    case "DISCONNECT":
      return handleDisconnect();

    case "SWITCH_CHAIN":
      return handleSwitchChain(message.payload as number);

    case "GET_BALANCE":
      return handleGetBalance(message.payload as string);

    default:
      return { success: false, error: "Unknown message type" };
  }
}

async function handleConnect(): Promise<MessageResponse> {
  try {
    // TODO: Implement actual wallet connection
    // This will integrate with browser wallet extensions

    state = {
      isConnected: true,
      address: "0x1234567890123456789012345678901234567890",
      chainId: 1,
    };

    // Notify popup of state change
    chrome.runtime.sendMessage({ type: "STATE_CHANGED", payload: state });

    return { success: true, data: state };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

async function handleDisconnect(): Promise<MessageResponse> {
  state = {
    isConnected: false,
    address: null,
    chainId: null,
  };

  chrome.runtime.sendMessage({ type: "STATE_CHANGED", payload: state });

  return { success: true };
}

async function handleSwitchChain(chainId: number): Promise<MessageResponse> {
  try {
    // TODO: Implement chain switching
    state.chainId = chainId;

    chrome.runtime.sendMessage({ type: "STATE_CHANGED", payload: state });

    return { success: true, data: { chainId } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Chain switch failed",
    };
  }
}

async function handleGetBalance(_address: string): Promise<MessageResponse> {
  try {
    // TODO: Implement balance fetching via RPC
    return { success: true, data: { balance: "0" } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get balance",
    };
  }
}

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("XFERNO Extension installed");
    // Open welcome page on first install
    chrome.tabs.create({ url: "https://xferno.io/welcome" });
  } else if (details.reason === "update") {
    console.log("XFERNO Extension updated");
  }
});

// Keep service worker alive
chrome.alarms.create("keepAlive", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
    // Ping to keep alive
  }
});

export {};
