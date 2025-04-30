import { bind, exec, Variable } from "astal";
import WebKit2 from "gi://WebKit2?version=4.1";
import { App, Gtk, Astal, Widget } from "astal/gtk3";
const { GLib, Gio } = imports.gi;
import { spacing } from "../../lib/variables";
import PopupWindow from "../../common/PopupWindow";
import icons from "../../lib/icons";


// Array to store chat messages
const chatHistory = Variable([]);
// Variable to track if greeting should be shown
const showGreeting = Variable(true);

const ollamaRunningStatus = Variable(false);

type ModelDefinition =
  | { type: "llm"; name: string }  // For existing LLM models
  | { type: "web"; name: string; url: string }; // For web-based models

// Message type definition
type ChatMessage = {
  sender: "user" | "ollama";
  text: string;
  timestamp: string;
};

const models: ModelDefinition[] = [
  { type: "llm", name: "llama3.2" },
  { type: "web", name: "chatgpt", url: "https://chat.openai.com" },
  { type: "web", name: "copilot", url: "https://copilot.microsoft.com" },
  { type: "web", name: "duck ai", url: "https://duck.ai" },
  { type: "web", name: "grok", url: "https://grok.com" },
  { type: "web", name: "gemini", url: "https://gemini.google.com" },
];

const modelIcons = {
  "llama3.2": icons.models.llama || "dialog-information-symbolic",
  chatgpt: icons.models.chatgpt || "dialog-warning-symbolic",
  copilot: icons.models.copilot || "dialog-question-symbolic",
  "duck ai": icons.models.duck || "dialog-chat-symbolic",
  grok: icons.models.grok || "dialog-user-symbolic",
  gemini: icons.models.gemini || "dialog-user-symbolic",
};

function loadGeminiApiKey(): string {
  const configDir = GLib.get_user_config_dir();
  const appName = "ags";
  const configPath = GLib.build_filenamev([configDir, appName, "gemini-key.json"]);

  try {
    const file = Gio.File.new_for_path(configPath);
    const [success, contents] = file.load_contents(null);
    if (!success) return "";
    const decoder = new TextDecoder("utf-8");
    const jsonString = decoder.decode(contents);
    const config = JSON.parse(jsonString);
    return config.gemini_api_key || "";
  } catch (error) {
    console.error(`Failed to load Gemini API key from ${configPath}: ${error.message}`);
    return "";
  }
}

function saveGeminiApiKey(apiKey: string): boolean {
  const configDir = GLib.get_user_config_dir();
  const appName = "ags";
  const configPath = GLib.build_filenamev([configDir, appName, "gemini-key.json"]);

  try {
    const config = { gemini_api_key: apiKey };
    const jsonString = JSON.stringify(config);
    const file = Gio.File.new_for_path(configPath);
    const dir = file.get_parent();
    if (!dir.query_exists(null)) dir.make_directory_with_parents(null);
    file.replace_contents(jsonString, null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
    const fileInfo = new Gio.FileInfo();
    fileInfo.set_attribute_uint32("unix::mode", 0o600);
    file.set_attributes_from_info(fileInfo, Gio.FileQueryInfoFlags.NONE, null);
    return true;
  } catch (error) {
    console.error(`Failed to save Gemini API key to ${configPath}: ${error.message}`);
    return false;
  }
}

let GEMINI_API_KEY = loadGeminiApiKey();

const selectedModel = Variable(models[0].name);

const ModelButtons = () => (
  <box horizontal halign={Gtk.Align.CENTER} expand={false}>
    <box horizontal className="model-buttons" halign={Gtk.Align.CENTER} expand={false}>
      {models.map((model) => (
        <button
          className={bind(selectedModel).as((m) => `model-button${m === model.name ? " active" : ""}`)}
          onClicked={() => selectedModel.set(model.name)}
          tooltip_text={getModelDisplayName(model.name)}
        >
          <Widget.Icon icon={modelIcons[model.name]} size={24} />
        </button>
      ))}
    </box>
  </box>
);

const WebViewWidget = ({ url }: { url: Variable<string> }) => {
  console.log("WebViewWidget: Start");

  // Create cookie manager and enable persistent storage
  const context = new WebKit2.WebContext();
  const cookieManager = context.get_cookie_manager();
  cookieManager.set_persistent_storage(
    GLib.build_filenamev([GLib.get_user_cache_dir(), "ags", "cookies.db"]),
    WebKit2.CookiePersistentStorage.SQLITE
  );
  cookieManager.set_accept_policy(WebKit2.CookieAcceptPolicy.ALWAYS);

  // Create and configure the WebKit2 WebView with the context
  const webView = new WebKit2.WebView({ web_context: context });
  console.log("WebViewWidget: WebView created");
  
  const settings = webView.get_settings();
  settings.set_enable_javascript(true);
  settings.set_enable_html5_database(true);
  settings.set_enable_html5_local_storage(true);
  settings.set_enable_javascript_markup(true);
  settings.set_enable_smooth_scrolling(true);
  settings.set_enable_write_console_messages_to_stdout(true);

  settings.set_user_agent(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 " +
    "(KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
  );

  settings.set_enable_developer_extras(true);
  settings.set_javascript_can_access_clipboard(true);

  // Create a Gtk.ScrolledWindow to host the WebView
  const scrolledWindow = new Gtk.ScrolledWindow({
    hscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
    vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
  });
  scrolledWindow.set_size_request(400, 400); // Explicit size to ensure it’s visible
  console.log("WebViewWidget: ScrolledWindow created");
  scrolledWindow.add(webView);

  // Explicitly show the WebView and ScrolledWindow
  webView.show();
  scrolledWindow.show_all();
  console.log("WebViewWidget: ScrolledWindow shown");

  // Subscribe to URL changes and load with delay
  url.subscribe((newUrl) => {
    if (newUrl) {
      console.log(`WebViewWidget: Subscribed URL changed to ${newUrl}`);
      GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
        try {
          console.log(`WebViewWidget: Loading ${newUrl}`);
          webView.load_uri(newUrl);
        } catch (error) {
          console.error("Error during load_uri:", error);
        }
        return GLib.SOURCE_REMOVE;
      });
    }
  });

  // Connect event handlers for load progress and errors
  webView.connect("load-changed", (self, loadEvent) => {
    console.log(`WebView load event: ${loadEvent}`);
    if (loadEvent === WebKit2.LoadEvent.FINISHED) {
      console.log("Load finished, current URI:", webView.get_uri());
      webView.queue_draw();
      scrolledWindow.queue_draw();
    }
  });

  webView.connect("load-failed", (self, loadEvent, failingUri, error) => {
    console.error(`Failed to load ${failingUri}: ${error.message}`);
  });

  console.log("WebViewWidget: Event handlers connected");

  return scrolledWindow;
};



const webUrl = Variable("");
const WebContent = () => {
  const currentModel = bind(selectedModel).as((name) => models.find((m) => m.name === name));

  // Update webUrl when the model changes
  currentModel.subscribe((m) => {
    if (m?.type === "web") {
      console.log(`WebContent: Setting webUrl to ${m.url}`);
      webUrl.set(m.url);
    } else {
      webUrl.set("");
    }
  });

  return (
    <box
      visible={bind(currentModel).as((m) => m?.type === "web")}
      vexpand={true}
      hexpand={true}
      css="min-width: 400px; min-height: 400px; border-radius: 30px;"
    >
      <WebViewWidget url={webUrl} />
    </box>
  );
 };

async function startOllama() {
  try {
    const ollamaRunning = await isOllamaRunning();
    if (ollamaRunning) {
      console.log("Ollama server is already running");
      const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      chatHistory.set([...chatHistory.get(), { sender: "ollama", text: "Ollama server is already running.", timestamp }]);
      return;
    }
    const subprocess = new Gio.Subprocess({ argv: ["ollama", "serve"], flags: Gio.SubprocessFlags.NONE });
    subprocess.init(null);
    console.log("Started Ollama server");
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    chatHistory.set([...chatHistory.get(), { sender: "ollama", text: "Ollama server started.", timestamp }]);
  } catch (error) {
    console.error("Failed to start Ollama:", error.message);
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    chatHistory.set([...chatHistory.get(), { sender: "ollama", text: `Failed to start Ollama: ${error.message}`, timestamp }]);
  }
}

async function checkOllamaStatus() {
  const isRunning = await isOllamaRunning();
  ollamaRunningStatus.set(isRunning);
}

checkOllamaStatus();

const StartOllamaButton = bind(ollamaRunningStatus).as((isRunning) =>
  isRunning ? null : (
    <box className="card" halign={Gtk.Align.FILL} hexpand={true}>
      <box halign={Gtk.Align.START} hexpand={true}>
        <label label="Ollama is not started." className="subtext" />
      </box>
      <box halign={Gtk.Align.END} hexpand={true}>
        <button halign={Gtk.Align.END} label="Start Ollama" className="primary-button" onClicked={async () => await startOllama()} />
      </box>
    </box>
  )
);


function splitMessageParts(text: string): { type: "text" | "code" | "math" | "display_math"; content: string; language?: string }[] {
  const parts: { type: "text" | "code" | "math" | "display_math"; content: string; language?: string }[] = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const inlineCodeRegex = /`([^`]+)`/g;
  const displayMathRegex = /\$\$([\s\S]*?)\$\$/g;
  const inlineMathRegex = /\$([^$\n]+?)\$/g;
  let remainingText = text;
  let lastIndex = 0;

  function processMatches(regex: RegExp, type: "code" | "math" | "display_math", isCodeBlock: boolean = false) {
    let match;
    regex.lastIndex = 0;
    while ((match = regex.exec(remainingText)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: "text", content: remainingText.slice(lastIndex, match.index) });
      }
      if (isCodeBlock) {
        const language = match[1]?.trim() || 'text';
        const code = match[2]?.trim() || '';
        parts.push({ type, content: code, language });
      } else if (type === "code") {
        parts.push({ type, content: match[1].trim(), language: "inline" });
      } else {
        parts.push({ type, content: match[1].trim() });
      }
      lastIndex = regex.lastIndex;
    }
  }

  // Process in order: display math, code blocks, inline code, inline math
  processMatches(displayMathRegex, "display_math");
  processMatches(codeBlockRegex, "code", true);
  processMatches(inlineCodeRegex, "code");
  processMatches(inlineMathRegex, "math");

  if (lastIndex < remainingText.length) {
    parts.push({ type: "text", content: remainingText.slice(lastIndex) });
  }

  return parts;
}

function markdownToPango(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.+?)\*/g, "<i>$1</i>")
    .replace(/~~(.+?)~~/g, "<s>$1</s>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span foreground="#3584e4"><u>$1</u></span>')
    .replace(/^### (.+)$/gm, '<span size="large" weight="bold">$1</span>')
    .replace(/^## (.+)$/gm, '<span size="x-large" weight="bold">$1</span>')
    .replace(/^# (.+)$/gm, '<span size="xx-large" weight="bold">$1</span>')
    .replace(/^\s*[-*]\s+(.+)$/gm, "• $1")
    .replace(/^\s*(\d+)\.\s+(.+)$/gm, "$1. $2")
    .replace(/\n/g, "\n");
}

function formatMath(content: string, isDisplay: boolean = false): string {
  let result = content
    .replace(/(\w+)\^(\d+)/g, "$1<sup>$2</sup>")
    .replace(/(\w+)_(\d+)/g, "$1<sub>$2</sub>")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "<span>$1</span>/<span>$2</span>");
  result = `<tt>${result}</tt>`;
  if (isDisplay) result = `<span size="large">${result}</span>`;
  return result;
}

async function queryGemini(prompt: string) {
  console.log("Starting queryGemini with prompt:", prompt);
  try {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    chatHistory.set([...chatHistory.get(), { sender: "user", text: prompt, timestamp }]);
    const subprocess = new Gio.Subprocess({
      argv: [
        "curl", "--silent", "--no-buffer", "-N", "-X", "POST",
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:streamGenerateContent?key=${GEMINI_API_KEY}`,
        "-H", "Content-Type: application/json", "-d",
        JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9, topK: 40, topP: 0.95, maxOutputTokens: 1024 } }),
      ],
      flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_MERGE,
    });
    subprocess.init(null);
    console.log("Gemini subprocess initialized");
    const stdout = new Gio.DataInputStream({ base_stream: subprocess.get_stdout_pipe() });
    let fullResponse = "";
    const geminiTimestamp = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

    const readStream = () => new Promise((resolve) => {
      const readNextLine = () => {
        stdout.read_line_async(GLib.PRIORITY_DEFAULT, null, (source, result) => {
          const [line] = stdout.read_line_finish_utf8(result);
          if (line === null) {
            console.log("Gemini stream ended");
            try {
              const parsedArray = JSON.parse(fullResponse);
              const geminiResponse = parsedArray[0]?.candidates[0]?.content?.parts[0]?.text || "No response received";
              chatHistory.set([...chatHistory.get(), { sender: "ollama", text: geminiResponse, timestamp: geminiTimestamp }]);
            } catch (e) {
              console.error("Error parsing full Gemini response:", e.message, "Response:", fullResponse);
              chatHistory.set([...chatHistory.get(), { sender: "ollama", text: `Error parsing response: ${e.message}`, timestamp: geminiTimestamp }]);
            }
            resolve();
            return;
          }
          fullResponse += line;
          readNextLine();
        });
      };
      console.log("Starting to read Gemini stream");
      readNextLine();
    });

    const waitForSubprocess = () => new Promise((resolve, reject) => {
      subprocess.wait_async(null, (proc, result) => {
        try {
          subprocess.wait_finish(result);
          console.log("Gemini subprocess completed");
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });

    console.log("Starting Gemini stream reading and waiting for subprocess");
    const readPromise = readStream();
    await waitForSubprocess();
    await readPromise;
  } catch (error) {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    chatHistory.set([...chatHistory.get(), { sender: "user", text: prompt, timestamp }, { sender: "ollama", text: `Error: ${error.message}`, timestamp }]);
    console.error("Gemini streaming error:", error);
  }
}

async function isOllamaRunning(): Promise<boolean> {
  try {
    const subprocess = new Gio.Subprocess({
      argv: ["curl", "--silent", "http://localhost:11434"],
      flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_MERGE,
    });
    subprocess.init(null);
    const stdout = new Gio.DataInputStream({ base_stream: subprocess.get_stdout_pipe() });
    return new Promise((resolve) => {
      let response = "";
      const readResponse = () => {
        stdout.read_line_async(GLib.PRIORITY_DEFAULT, null, (source, result) => {
          const [line] = stdout.read_line_finish_utf8(result);
          if (line === null) {
            resolve(response.includes("Ollama"));
            return;
          }
          response += line;
          readResponse();
        });
      };
      subprocess.wait_check_async(null, (proc, result) => {
        try {
          subprocess.wait_check_finish(result);
          readResponse();
        } catch (e) {
          resolve(false);
        }
      });
    });
  } catch (error) {
    return false;
  }
}

async function queryOllama(prompt: string) {
  const currentModelName = selectedModel.get();
  const currentModel = models.find((m) => m.name === currentModelName);

  if (currentModel?.type === "web") {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    chatHistory.set([...chatHistory.get(), { sender: "user", text: prompt, timestamp }, { sender: "ollama", text: `This is a web-based model (${currentModel.name}). Interaction happens in the web view above.`, timestamp }]);
    return;
  }

  if (prompt.startsWith("\\key ")) {
    const apiKey = prompt.substring(5).trim();
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    if (currentModel?.name === "gemini") {
      if (saveGeminiApiKey(apiKey)) {
        GEMINI_API_KEY = apiKey;
        chatHistory.set([...chatHistory.get(), { sender: "user", text: prompt, timestamp }, { sender: "ollama", text: "Gemini API key saved successfully!", timestamp }]);
      } else {
        chatHistory.set([...chatHistory.get(), { sender: "user", text: prompt, timestamp }, { sender: "ollama", text: "Failed to save Gemini API key.", timestamp }]);
      }
    } else {
      chatHistory.set([...chatHistory.get(), { sender: "user", text: prompt, timestamp }, { sender: "ollama", text: "Switch to Gemini model to set the API key.", timestamp }]);
    }
    return;
  }

  if (currentModel?.name === "gemini") {
    if (!GEMINI_API_KEY) {
      const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      chatHistory.set([...chatHistory.get(), { sender: "user", text: prompt, timestamp }, { sender: "ollama", text: "No Gemini API key found. Please submit your key using: \\key YOUR_API_KEY", timestamp }]);
      return;
    }
    await queryGemini(prompt);
  } else if (currentModel?.type === "llm") {
    const ollamaRunning = await isOllamaRunning();
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    if (!ollamaRunning) {
      console.log("Ollama is not running");
      chatHistory.set([...chatHistory.get(), { sender: "user", text: prompt, timestamp }, { sender: "ollama", text: "Ollama server is not running. Please click 'Start Ollama' or run 'ollama serve' manually.", timestamp }]);
      return;
    }
    console.log("Starting queryOllama with prompt:", prompt);
    try {
      chatHistory.set([...chatHistory.get(), { sender: "user", text: prompt, timestamp }]);
      const subprocess = new Gio.Subprocess({
        argv: ["curl", "--silent", "--no-buffer", "-N", "-X", "POST", "http://localhost:11434/api/generate", "-d", JSON.stringify({ model: currentModel.name, prompt, stream: true })],
        flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_MERGE,
      });
      subprocess.init(null);
      const stdout = new Gio.DataInputStream({ base_stream: subprocess.get_stdout_pipe() });
      let ollamaResponse = "";
      const ollamaTimestamp = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

      const readStream = () => new Promise((resolve) => {
        const readNextLine = () => {
          stdout.read_line_async(GLib.PRIORITY_DEFAULT, null, (source, result) => {
            const [line] = stdout.read_line_finish_utf8(result);
            if (line === null) {
              console.log("Stream ended");
              if (!ollamaResponse) chatHistory.set([...chatHistory.get(), { sender: "ollama", text: "No response received from Ollama.", timestamp: ollamaTimestamp }]);
              resolve();
              return;
            }
            if (!line.trim() || !line.startsWith("{")) {
              readNextLine();
              return;
            }
            try {
              const parsed = JSON.parse(line);
              if (parsed.response) {
                ollamaResponse += parsed.response;
                const currentHistory = chatHistory.get();
                const lastMessage = currentHistory[currentHistory.length - 1];
                if (lastMessage?.sender === "ollama" && lastMessage?.timestamp === ollamaTimestamp) {
                  chatHistory.set([...currentHistory.slice(0, -1), { sender: "ollama", text: ollamaResponse, timestamp: ollamaTimestamp }]);
                } else {
                  chatHistory.set([...currentHistory, { sender: "ollama", text: ollamaResponse, timestamp: ollamaTimestamp }]);
                }
              }
            } catch (e) {
              console.error("Error parsing stream line:", e.message, "Line:", line);
            }
            readNextLine();
          });
        };
        console.log("Starting to read stream");
        readNextLine();
      });

      const waitForSubprocess = () => new Promise((resolve, reject) => {
        subprocess.wait_async(null, (proc, result) => {
          try {
            subprocess.wait_finish(result);
            console.log("Subprocess completed");
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });

      const readPromise = readStream();
      await waitForSubprocess();
      await readPromise;
    } catch (error) {
      const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      chatHistory.set([...chatHistory.get(), { sender: "user", text: prompt, timestamp }, { sender: "ollama", text: `Error: ${error.message}`, timestamp }]);
      console.error("Streaming error:", error);
    }
  }
}

function resetConversation() {
  chatHistory.set([]);
  Entry.set_text("");
  showGreeting.set(true);
}

function submitPrompt() {
  const prompt = Entry.get_text();
  if (prompt) {
    if (showGreeting.get()) showGreeting.set(false);
    queryOllama(prompt);
    Entry.set_text("");
  }
}

function getModelDisplayName(modelName: string): string {
  const model = models.find((m) => m.name === modelName);
  if (!model) return "Unknown";
  if (model.type === "web") {
    if (model.name === "chatgpt") return "ChatGPT";
    if (model.name === "claude") return "Claude";
    return model.name.charAt(0).toUpperCase() + model.name.slice(1);
  }
  if (model.name.includes("llama")) return "Llama";
  if (model.name.includes("gemma")) return "Gemma";
  if (model.name === "gemini") return "Gemini";
  if (model.name === "phi3") return "Phi3";
  return "Ollama";
}

const Entry = new Widget.Entry({
  placeholder_text: bind(selectedModel).as((model) => `Ask ${getModelDisplayName(model)}`),
  canFocus: true,
  className: "message-input",
  hexpand: true,
  on_activate: () => submitPrompt(),
  on_key_press_event: () => false,
  on_changed: (self) => {
    const text = self.get_text();
    self.className = text.length > 0 ? "message-input expanded" : "message-input";
  },
  wrap_mode: Gtk.WrapMode.WORD_CHAR,
  max_height: 100,
  vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
  max_length: 0,
});

const InputBox = () => (
  <box horizontal spacing={spacing} halign={Gtk.Align.FILL}>
    {Entry}
    {SubmitButton}
  </box>
);

const SubmitButton = new Widget.Button({
  className: "primary-circular-button",
  onClicked: () => submitPrompt(),
  children: [new Widget.Icon({ icon: icons.ui.arrow.right })],
});

const NewConversationButton = new Widget.Button({
  label: "New Chat",
  className: "primary-button",
  onClicked: () => resetConversation(),
});

let entryFocused = false;

const username = GLib.get_user_name().charAt(0).toUpperCase() + GLib.get_user_name().slice(1);
const greeting = `Hello, ${username}`;

function getSenderName(sender: "user" | "ollama") {
  if (sender === "user") return username;
  const currentModel = selectedModel.get();
  if (currentModel.includes("llama")) return "Llama";
  if (currentModel.includes("gemma")) return "Gemma";
  if (currentModel === "gemini") return "Gemini";
  return "Ollama";
}

const ChatMessages = () => (
  <box vertical spacing={spacing} halign={Gtk.Align.FILL} hexpand={true}>
    {bind(chatHistory).as((messages) =>
      messages.map((msg) => (
        <box
          vertical
          className={`message ${msg.sender}-message`}
          spacing={2}
          halign={msg.sender === "user" ? Gtk.Align.END : Gtk.Align.START}
          hexpand={false}
        >
          <label
            label={`${getSenderName(msg.sender)}`}
            className="message-sender"
            halign={msg.sender === "user" ? Gtk.Align.END : Gtk.Align.START}
          />
          <box vertical spacing={4}>
            {splitMessageParts(msg.text).map((part, index) => {
              if (part.type === "text") {
                return (
                  <label
                    key={`text-${index}`}
                    label={markdownToPango(part.content)}
                    use_markup={true}
                    className="message-text"
                    wrap={true}
                    justify={Gtk.Justification.FILL}
                    halign={msg.sender === "user" ? Gtk.Align.END : Gtk.Align.START}
                    hexpand={false}
                    max_width_chars={60}
                  />
                );
              } else if (part.type === "code") {
                const isInline = part.language === "inline";
                return (
                  <box 
                    key={`code-${index}`}
                    className={isInline ? "inline-code" : "code-block"}
                    css={isInline ? 
                      "font-family: monospace; background-color: rgba(127, 127, 127, 0.1); padding: 2px 4px; border-radius: 4px;" :
                      "background-color: rgba(0, 0, 0, 0.2); padding: 8px; border-radius: 8px; margin: 4px 0;"}
                  >
                    <box vertical>
                      {!isInline && part.language !== "text" && (
                        <label
                          label={part.language}
                          css="font-size: 0.8em; opacity: 0.7; margin-bottom: 4px;"
                        />
                      )}
                      <label
                        label={part.content}
                        css="font-family: 'Monaspace Neon', monospace;"
                        wrap={true}
                        selectable={true}
                        hexpand={false}
                        max_width_chars={58}
                      />
                    </box>
                  </box>
                );
              } else if (part.type === "math" || part.type === "display_math") {
                const isDisplay = part.type === "display_math";
                return (
                  <box 
                    key={`math-${index}`}
                    className={isDisplay ? "display-math" : "inline-math"}
                    css={isDisplay ? "padding: 8px 16px; margin: 4px 0;" : "padding: 0 4px;"}
                  >
                    <label
                      label={formatMath(part.content, isDisplay)}
                      use_markup={true}
                      wrap={true}
                      justify={Gtk.Justification.CENTER}
                      halign={isDisplay ? Gtk.Align.CENTER : (msg.sender === "user" ? Gtk.Align.END : Gtk.Align.START)}
                      hexpand={false}
                      max_width_chars={isDisplay ? 60 : 40}
                    />
                  </box>
                );
              }
            })}
          </box>
          <label label={`${msg.timestamp}`} className="message-time" halign={msg.sender === "user" ? Gtk.Align.END : Gtk.Align.START} />
        </box>
      ))
    )}
  </box>
);

export default () => {
  const currentModel = bind(selectedModel).as((name) => models.find((m) => m.name === name));
  const isWebModel = bind(currentModel).as((m) => m?.type === "web");
  const isLLMModel = bind(currentModel).as((m) => m?.type === "llm");

  return (
    <PopupWindow
      scrimType="transparent"
      layer={Astal.Layer.OVERLAY}
      visible={false}
      margin={12}
      vexpand={true}
      keymode={Astal.Keymode.EXCLUSIVE}
      name="SideBar"
      namespace="SideBar"
      exclusivity={Astal.Exclusivity.NORMAL}
      anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT}
      application={App}
      onKeyPressEvent={(self, event) => {
        const [keyEvent, keyCode] = event.get_keycode();
        if (keyEvent && keyCode == 9) {
          App.toggle_window(self.name);
          return true;
        } else if (keyEvent && keyCode === 65 && !entryFocused && !Entry.has_focus && !isWebModel.get()) {
          Entry.grab_focus();
          entryFocused = true;
          return true;
        } else if (Entry.has_focus) {
          return false;
        }
        return false;
      }}
    >
      <box vertical className="sidebar-window" spacing={spacing} css="min-width: 400px;">
        <ModelButtons />
        <box vertical visible={isLLMModel} spacing={spacing} halign={Gtk.Align.FILL} vexpand={true}>
          <box vertical halign={Gtk.Align.FILL} spacing={spacing}>
            {NewConversationButton}
          </box>
          {bind(showGreeting).as((visible) =>
            visible ? (
              <box vertical halign={Gtk.Align.FILL} valign={Gtk.Align.CENTER} vexpand={true}>
                <box horizontal halign={Gtk.Align.CENTER}>
                  <label label={greeting} className="greeting" halign={Gtk.Align.CENTER} />
                </box>
              </box>
            ) : (
              <box visible={false} />
            )
          )}
          <scrollable vscroll={Gtk.PolicyType.AUTOMATIC} hscroll={Gtk.PolicyType.NEVER} className="chat-container" vexpand={true}>
            <ChatMessages />
          </scrollable>
          <box vertical spacing={spacing} halign={Gtk.Align.FILL} valign={Gtk.Align.END}>
            {StartOllamaButton}
            {bind(showGreeting).as((visible) =>
              visible ? (
                <box horizontal spacing={spacing} className="sidebar-prompt-container" halign={Gtk.Align.FILL}>
                  <button className="sidebar-prompt-button" onClicked={() => { Entry.set_text("Tell me what you can do"); submitPrompt(); }}>
                    <box vertical className="sidebar-prompt-example">
                      <label className="paragraph" label="Tell me what" />
                      <label className="subtext" label="you can do" />
                    </box>
                  </button>
                  <button className="sidebar-prompt-button" onClicked={() => { Entry.set_text("Give me study tips"); submitPrompt(); }}>
                    <box vertical className="sidebar-prompt-example">
                      <label className="paragraph" label="Give me" />
                      <label className="subtext" label="study tips" />
                    </box>
                  </button>
                  <button className="sidebar-prompt-button" onClicked={() => { Entry.set_text("Save me time"); submitPrompt(); }}>
                    <box vertical className="sidebar-prompt-example">
                      <label className="paragraph" label="Save me" />
                      <label className="subtext" label="time" />
                    </box>
                  </button>
                  <button className="sidebar-prompt-button" onClicked={() => { Entry.set_text("Inspire me"); submitPrompt(); }}>
                    <box vertical className="sidebar-prompt-example">
                      <label className="paragraph" label="Inspire" />
                      <label className="subtext" label="me" />
                    </box>
                  </button>
                </box>
              ) : (
                <box visible={false} />
              )
            )}
            <InputBox />
          </box>
        </box>
        <WebContent />
      </box>
    </PopupWindow>
  );
};
