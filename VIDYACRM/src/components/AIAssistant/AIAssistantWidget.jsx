// src/components/AIAssistant/AIAssistantWidget.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { sendAIMessageAPI, confirmAIActionAPI } from "../../api/ai.api";
import styles from "./AIAssistantWidget.module.css";
import {
  FiMic,
  FiMicOff,
  FiSend,
  FiX,
  FiVolume2,
  FiVolumeX,
  FiCheck,
  FiRotateCcw,
  FiClock,
  FiFileText,
  FiCheckCircle,
  FiLayers,
  FiCheckSquare,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { Images } from "../../assets/Data/images";

export default function AIAssistantWidget() {
  const { user } = useAuth();
  const isManagement = user?.role === "admin" || user?.role === "hr";

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "assistant",
      text: `Hello ${user?.name ? user.name.split(" ")[0] : "there"}! I'm your Vidya AI Voice Assistant. You can speak or type:
• "Punch in" / "Punch out"
• "Add report: completed XYZ"
• "Add task: Fix login bug"
${isManagement ? '• "Give attendance report for today"\n• "Show all reports for today"' : '• "What is my attendance status?"\n• "Show my tasks"'}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pendingAction, setPendingAction] = useState(null); // { action, payload, prompt }

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN"; // English (India) with natural Hindi/accent recognition

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
          handleSendMessage(transcript.trim());
        }
      };

      recognition.onerror = (event) => {
        console.warn("[Voice] Recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          toast.error("Microphone permission denied.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Text-To-Speech function
  const speakText = useCallback(
    (text) => {
      if (!soundEnabled || !("speechSynthesis" in window) || !text) return;
      try {
        window.speechSynthesis.cancel();
        // Remove code blocks, markdown asterisks for spoken voice
        const cleanText = text.replace(/[*_#`]/g, "").trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        // Try to select an English voice
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice =
          voices.find((v) => v.lang.includes("en-IN") || v.name.includes("India")) ||
          voices.find((v) => v.lang.startsWith("en"));
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("[Voice] TTS failed:", err);
      }
    },
    [soundEnabled]
  );

  // Toggle Mic
  const toggleListening = () => {
    if (!speechSupported) {
      toast("Voice input not supported in this browser. Please type your message.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      window.speechSynthesis.cancel();
      try {
        recognitionRef.current?.start();
      } catch (e) {
        recognitionRef.current?.stop();
      }
    }
  };

  // Send Message
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const history = messages.slice(-4).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await sendAIMessageAPI(text, history);

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: res.reply,
        action: res.action,
        requiresConfirmation: res.requiresConfirmation,
        confirmationPrompt: res.confirmationPrompt,
        payload: res.payload,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If action requires user confirmation
      if (res.requiresConfirmation && res.action && res.action !== "GENERAL_CHAT") {
        setPendingAction({
          action: res.action,
          payload: res.payload || {},
          prompt: res.confirmationPrompt || "Would you like to confirm this action?",
        });
      } else {
        setPendingAction(null);
      }

      speakText(res.voiceText || res.reply);
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: err.message || "Failed to process request. Please try again.",
        isError: true,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
      speakText(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Confirm pending action
  const handleConfirmAction = async (actionItem) => {
    if (!actionItem || loading) return;
    setLoading(true);

    try {
      const res = await confirmAIActionAPI(actionItem.action, actionItem.payload);

      const successMsg = {
        id: Date.now().toString(),
        sender: "assistant",
        text: res.reply || "Action completed successfully!",
        isSuccess: true,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, successMsg]);
      setPendingAction(null);
      speakText(res.reply || "Done!");
      toast.success("Action executed successfully!");
    } catch (err) {
      const failMsg = {
        id: Date.now().toString(),
        sender: "assistant",
        text: err.message || "Failed to execute action.",
        isError: true,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, failMsg]);
      speakText(err.message || "Action failed.");
      toast.error(err.message || "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAction = () => {
    setPendingAction(null);
    const cancelMsg = {
      id: Date.now().toString(),
      sender: "assistant",
      text: "Action cancelled. Let me know if you need anything else!",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, cancelMsg]);
    speakText("Action cancelled.");
  };

  const handleResetChat = () => {
    window.speechSynthesis?.cancel();
    setPendingAction(null);
    setMessages([
      {
        id: Date.now().toString(),
        sender: "assistant",
        text: "Chat cleared. What can I do for you?",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const renderActionIcon = (action) => {
    switch (action) {
      case "PUNCH_IN":
      case "PUNCH_OUT":
        return <FiClock className={styles.actionCardIcon} />;
      case "ADD_REPORT":
        return <FiFileText className={styles.actionCardIcon} />;
      case "CREATE_TASK":
        return <FiCheckSquare className={styles.actionCardIcon} />;
      case "GET_TASKS":
        return <FiLayers className={styles.actionCardIcon} />;
      default:
        return <FiCheckCircle className={styles.actionCardIcon} />;
    }
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          className={styles.fabButton}
          onClick={() => setIsOpen(true)}
          title="Vidya AI Voice Assistant"
          aria-label="Open AI Assistant"
        >
          <FiMic className={styles.fabIcon} />
        </button>
      )}

      {/* Main AI Chat Sheet */}
      {isOpen && (
        <div className={styles.widgetContainer}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <div className={styles.avatar}>
                <img src={Images.mini_logo} alt="" className={styles.aiLogo} />
              </div>
              <div>
                <h4 className={styles.headerTitle}>Vidya Assistant</h4>
                <span className={styles.headerSubtitle}>
                  {isListening
                    ? "Listening..."
                    : loading
                    ? "Thinking..."
                    : "Ready (Voice & Chat)"}
                </span>
              </div>
            </div>

            <div className={styles.headerControls}>
              <button
                type="button"
                className={styles.controlBtn}
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  setSoundEnabled(!soundEnabled);
                }}
                title={soundEnabled ? "Mute Voice Replies" : "Enable Voice Replies"}
              >
                {soundEnabled ? <FiVolume2 /> : <FiVolumeX />}
              </button>

              <button
                type="button"
                className={styles.controlBtn}
                onClick={handleResetChat}
                title="Clear Chat"
              >
                <FiRotateCcw />
              </button>

              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  setIsOpen(false);
                }}
                title="Close Assistant"
              >
                <FiX />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className={styles.chatArea}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.messageWrapper} ${
                  msg.sender === "user" ? styles.userRow : styles.assistantRow
                }`}
              >
                <div
                  className={`${styles.messageBubble} ${
                    msg.sender === "user"
                      ? styles.userBubble
                      : msg.isError
                      ? styles.errorBubble
                      : msg.isSuccess
                      ? styles.successBubble
                      : styles.assistantBubble
                  }`}
                >
                  <p className={styles.messageText}>{msg.text}</p>

                  {/* Inline Confirmation Card for Proposed Action */}
                  {msg.requiresConfirmation && pendingAction && (
                    <div className={styles.actionCard}>
                      <div className={styles.actionCardHeader}>
                        {renderActionIcon(pendingAction.action)}
                        <span className={styles.actionCardTitle}>
                          Action Confirmation Required
                        </span>
                      </div>

                      <p className={styles.actionCardPrompt}>
                        {pendingAction.prompt}
                      </p>

                      {pendingAction.payload?.workPoints && (
                        <ul className={styles.actionPointsList}>
                          {pendingAction.payload.workPoints.map((pt, idx) => (
                            <li key={idx}>{pt}</li>
                          ))}
                        </ul>
                      )}

                      {pendingAction.action === "CREATE_TASK" && pendingAction.payload?.taskName && (
                        <div className={styles.taskPreviewCard}>
                          <div className={styles.taskDetailRow}>
                            <span className={styles.taskDetailLabel}>Task:</span>
                            <span className={styles.taskDetailVal}>
                              {pendingAction.payload.taskName}
                            </span>
                          </div>
                          {pendingAction.payload.assignedTo && (
                            <div className={styles.taskDetailRow}>
                              <span className={styles.taskDetailLabel}>Assignee:</span>
                              <span className={styles.taskDetailVal}>
                                {pendingAction.payload.assignedTo}
                              </span>
                            </div>
                          )}
                          {pendingAction.payload.priority && (
                            <div className={styles.taskDetailRow}>
                              <span className={styles.taskDetailLabel}>Priority:</span>
                              <span
                                className={`${styles.priorityBadge} ${
                                  styles[
                                    "priority_" +
                                      pendingAction.payload.priority.toLowerCase()
                                  ] || styles.priority_medium
                                }`}
                              >
                                {pendingAction.payload.priority.toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className={styles.actionCardButtons}>
                        <button
                          type="button"
                          className={styles.confirmBtn}
                          disabled={loading}
                          onClick={() => handleConfirmAction(pendingAction)}
                        >
                          <FiCheck /> Confirm & Proceed
                        </button>
                        <button
                          type="button"
                          className={styles.cancelBtn}
                          disabled={loading}
                          onClick={handleCancelAction}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <span className={styles.messageTime}>{msg.time}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className={styles.typingIndicator}>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Waveform Animation when Listening */}
          {isListening && (
            <div className={styles.listeningBar}>
              <div className={styles.wave}></div>
              <div className={styles.wave}></div>
              <div className={styles.wave}></div>
              <div className={styles.wave}></div>
              <span>Listening to your voice... Speak now</span>
            </div>
          )}

          {/* Quick Command Suggestions */}
          <div className={styles.quickCommands}>
            {isManagement ? (
              <>
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() =>
                    handleSendMessage("Give attendance report for today")
                  }
                >
                  📊 Attendance Report
                </button>
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() => handleSendMessage("Show all reports for today")}
                >
                  📝 All Reports
                </button>
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() => setInputMessage("Add task: ")}
                >
                  ➕ Add Task
                </button>
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() => handleSendMessage("Punch in for today")}
                >
                  Punch In
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() => handleSendMessage("Punch in for today")}
                >
                  Punch In
                </button>
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() => handleSendMessage("Punch out for today")}
                >
                  Punch Out
                </button>
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() => setInputMessage("Add task: ")}
                >
                  ➕ Add Task
                </button>
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() =>
                    handleSendMessage("What is my attendance status today?")
                  }
                >
                  Status
                </button>
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() => handleSendMessage("Show my tasks")}
                >
                  My Tasks
                </button>
              </>
            )}
          </div>

          {/* Input Bar */}
          <form
            className={styles.inputForm}
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <button
              type="button"
              className={`${styles.micButton} ${
                isListening ? styles.micActive : ""
              }`}
              onClick={toggleListening}
              title={isListening ? "Stop listening" : "Speak to Assistant"}
            >
              {isListening ? <FiMicOff /> : <FiMic />}
            </button>

            <input
              type="text"
              className={styles.textInput}
              placeholder={isListening ? "Listening..." : "Ask or speak a command..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading || isListening}
            />

            <button
              type="submit"
              className={styles.sendButton}
              disabled={loading || !inputMessage.trim()}
              title="Send Message"
            >
              <FiSend />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

