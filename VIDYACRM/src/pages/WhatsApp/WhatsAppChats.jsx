import React, { useState, useEffect, useRef } from "react";
import {
  getWhatsappConversationsAPI,
  getWhatsappMessagesAPI,
  sendWhatsappMessageAPI,
} from "../../api/whatsapp.api";
import styles from "./WhatsAppChats.module.css";
import toast from "react-hot-toast";
import Loader from "../../components/Loader/Loader";
import {
  FiSearch,
  FiRefreshCw,
  FiSend,
  FiUser,
  FiPhone,
  FiBriefcase,
  FiCheck,
  FiClock,
  FiMessageSquare,
} from "react-icons/fi";
import { IoLogoWhatsapp } from "react-icons/io5";

export default function WhatsAppChats() {
  const [conversations, setConversations] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch list of conversations
  const fetchConversations = async (silent = false) => {
    try {
      if (!silent) setRefreshing(true);
      const res = await getWhatsappConversationsAPI();
      const list = res.data?.data || [];
      setConversations(list);

      // Auto-select first conversation if none selected yet
      if (!selectedPhone && list.length > 0) {
        setSelectedPhone(list[0].phone);
      }
    } catch (err) {
      if (!silent) {
        toast.error(err?.response?.data?.message || "Failed to load WhatsApp conversations");
      }
    } finally {
      setLoading(false);
      if (!silent) setRefreshing(false);
    }
  };

  // Fetch messages for selected phone
  const fetchMessages = async (phone, silent = false) => {
    if (!phone) return;
    try {
      if (!silent) setMessagesLoading(true);
      const res = await getWhatsappMessagesAPI(phone);
      setActiveChat(res.data?.data || null);
    } catch (err) {
      if (!silent) {
        toast.error(err?.response?.data?.message || "Failed to load messages");
      }
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, []);

  // When selected phone changes
  useEffect(() => {
    if (selectedPhone) {
      fetchMessages(selectedPhone);
    }
  }, [selectedPhone]);

  // Auto-scroll when messages update
  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  // Periodic polling every 5 seconds for live WhatsApp chat updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(true);
      if (selectedPhone) {
        fetchMessages(selectedPhone, true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedPhone]);

  // Handle manual message send
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedPhone || sending) return;

    const textToSend = inputText.trim();
    setInputText("");
    try {
      setSending(true);
      await sendWhatsappMessageAPI(selectedPhone, textToSend);
      toast.success("WhatsApp message sent");
      await fetchMessages(selectedPhone, true);
      await fetchConversations(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send message");
      setInputText(textToSend); // restore on failure
    } finally {
      setSending(false);
    }
  };

  // Quick Action shortcuts
  const handleQuickSend = (text) => {
    setInputText(text);
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    const name = (c.name || "").toLowerCase();
    const phone = (c.phone || "").toLowerCase();
    const role = (c.staffUser?.role || "").toLowerCase();
    const leadStatus = (c.lead?.status || "").toLowerCase();
    return (
      name.includes(q) ||
      phone.includes(q) ||
      role.includes(q) ||
      leadStatus.includes(q)
    );
  });

  // Format timestamp
  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper to format WhatsApp markdown (*bold*)
  const renderFormattedText = (text = "") => {
    // Replace *bold* with strong
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return (
          <strong key={index}>
            {part.slice(1, -1)}
          </strong>
        );
      }
      return part;
    });
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      {/* ================= LEFT SIDEBAR ================= */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.headerTop}>
            <div className={styles.titleArea}>
              <div className={styles.waIconWrapper}>
                <IoLogoWhatsapp />
              </div>
              <div>
                <h2 className={styles.title}>WhatsApp Chats</h2>
                <span className={styles.subtitle}>
                  {conversations.length} Active Conversations
                </span>
              </div>
            </div>
            <button
              className={styles.refreshBtn}
              onClick={() => {
                fetchConversations();
                if (selectedPhone) fetchMessages(selectedPhone);
              }}
              title="Refresh messages"
            >
              <FiRefreshCw className={refreshing ? styles.spinning : ""} />
            </button>
          </div>

          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name, phone or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className={styles.conversationList}>
          {filteredConversations.length === 0 ? (
            <div className={styles.emptyConversations}>
              <FiMessageSquare size={32} />
              <p>No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = selectedPhone === c.phone;
              const isStaff = !!c.staffUser;
              const isLead = !!c.lead;
              const role = c.staffUser?.role?.toLowerCase();

              return (
                <div
                  key={c.phone}
                  className={`${styles.conversationItem} ${
                    isSelected ? styles.active : ""
                  }`}
                  onClick={() => setSelectedPhone(c.phone)}
                >
                  {isSelected && <div className={styles.activeStrip} />}

                  <div className={styles.avatarWrapper}>
                    {c.staffUser?.profilePicture?.url ? (
                      <img
                        src={c.staffUser.profilePicture.url}
                        alt={c.name}
                        className={styles.avatar}
                      />
                    ) : (
                      <div
                        className={`${styles.avatarFallback} ${
                          isLead
                            ? styles.avatarFallbackLead
                            : !isStaff
                            ? styles.avatarFallbackVisitor
                            : ""
                        }`}
                      >
                        {(c.name || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className={styles.conversationDetails}>
                    <div className={styles.convTop}>
                      <span className={styles.convName}>{c.name}</span>
                      <span className={styles.convTime}>
                        {formatTime(c.lastMessage?.createdAt)}
                      </span>
                    </div>

                    <div className={styles.convBottom}>
                      <p className={styles.lastMsgPreview}>
                        {c.lastMessage?.direction === "outbound" ? "You: " : ""}
                        {c.lastMessage?.body || "Interactive message"}
                      </p>

                      {isStaff ? (
                        <span
                          className={`${styles.tagBadge} ${
                            role === "admin" || role === "administrative"
                              ? styles.badgeAdmin
                              : role === "hr"
                              ? styles.badgeHR
                              : styles.badgeEmployee
                          }`}
                        >
                          {c.staffUser.role}
                        </span>
                      ) : isLead ? (
                        <span
                          className={`${styles.tagBadge} ${styles.badgeLead}`}
                        >
                          Lead
                        </span>
                      ) : (
                        <span
                          className={`${styles.tagBadge} ${styles.badgeVisitor}`}
                        >
                          Visitor
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================= RIGHT CHAT AREA ================= */}
      <div className={styles.chatArea}>
        {!selectedPhone ? (
          <div className={styles.emptyChat}>
            <div className={styles.emptyWaBigIcon}>
              <IoLogoWhatsapp />
            </div>
            <h3 className={styles.emptyTitle}>WhatsApp CRM Live Inbox</h3>
            <p className={styles.emptyDesc}>
              Select an employee or client conversation on the left to review
              their WhatsApp interactions, automated replies, and lead entries.
            </p>
            <div className={styles.tipBox}>
              💡 <strong>How it works:</strong> When any team member sends{" "}
              <code>LEAD</code> on WhatsApp to view or add leads, the entire
              conversation flow and responses sync here in real time.
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className={styles.chatHeader}>
              <div className={styles.headerContactInfo}>
                <div className={styles.avatarWrapper} style={{ width: 42, height: 42 }}>
                  {activeChat?.staffUser?.profilePicture?.url ? (
                    <img
                      src={activeChat.staffUser.profilePicture.url}
                      alt={activeChat.staffUser.name}
                      className={styles.avatar}
                    />
                  ) : (
                    <div
                      className={`${styles.avatarFallback} ${
                        activeChat?.lead
                          ? styles.avatarFallbackLead
                          : !activeChat?.staffUser
                          ? styles.avatarFallbackVisitor
                          : ""
                      }`}
                    >
                      {(
                        activeChat?.staffUser?.name ||
                        activeChat?.lead?.clientName ||
                        selectedPhone
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>

                <div>
                  <div className={styles.headerName}>
                    {activeChat?.staffUser?.name ||
                      activeChat?.lead?.clientName ||
                      selectedPhone}
                    {activeChat?.staffUser && (
                      <span
                        className={`${styles.tagBadge} ${
                          activeChat?.staffUser?.role === "admin" ||
                          activeChat?.staffUser?.role === "administrative"
                            ? styles.badgeAdmin
                            : activeChat?.staffUser?.role === "hr"
                            ? styles.badgeHR
                            : styles.badgeEmployee
                        }`}
                      >
                        {activeChat?.staffUser?.role}
                      </span>
                    )}
                  </div>
                  <div className={styles.headerSub}>
                    <span>
                      <FiPhone style={{ verticalAlign: "middle", marginRight: 4 }} />
                      +{selectedPhone}
                    </span>
                    {activeChat?.staffUser?.designation && (
                      <span>• {activeChat.staffUser.designation}</span>
                    )}
                    {activeChat?.lead?.status && (
                      <span className={styles.badgeLead}>
                        Status: {activeChat.lead.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.headerActions}>
                {activeChat?.lead && (
                  <div className={`${styles.crmBadge} ${styles.badgeLead}`}>
                    <FiBriefcase />
                    CRM Lead: {activeChat.lead.clientName}
                  </div>
                )}
              </div>
            </div>

            {/* Messages Body */}
            <div className={styles.messagesContainer}>
              {messagesLoading && !activeChat ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <Loader />
                </div>
              ) : !activeChat?.messages || activeChat.messages.length === 0 ? (
                <div className={styles.emptyConversations}>
                  <p>{messagesLoading ? "Loading conversation..." : "No messages recorded for this phone yet."}</p>
                </div>
              ) : (
                (() => {
                  let lastDate = "";
                  return (activeChat?.messages || []).map((m, idx) => {
                    const messageDate = formatDate(m.createdAt);
                    const showDateDivider = messageDate !== lastDate;
                    lastDate = messageDate;

                    const isInbound = m.direction === "inbound";
                    const isLeadAction =
                      m.body.toLowerCase().includes("lead") ||
                      m.body.includes("ClientName:");

                    return (
                      <React.Fragment key={m._id || idx}>
                        {showDateDivider && (
                          <div className={styles.dateDivider}>{messageDate}</div>
                        )}

                        <div
                          className={`${styles.messageRow} ${
                            isInbound ? styles.inbound : styles.outbound
                          }`}
                        >
                          <div className={styles.bubble}>
                            {isInbound && (
                              <span className={styles.senderLabel}>
                                {m.senderName || activeChat?.staffUser?.name || m.from}
                              </span>
                            )}

                            <div className={styles.messageText}>
                              {isLeadAction ? (
                                renderFormattedText(m.body)
                              ) : (
                                renderFormattedText(m.body)
                              )}
                            </div>

                            <div className={styles.bubbleMeta}>
                              <span>{formatTime(m.createdAt)}</span>
                              {!isInbound && (
                                <span className={styles.checkmarks} title="Delivered">
                                  ✓✓
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  });
                })()
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions & Input Form */}
            <div className={styles.chatFooter}>
              <div className={styles.quickChips}>
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() => handleQuickSend("LEAD")}
                >
                  🚀 Send "LEAD"
                </button>
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() => handleQuickSend("Show leads")}
                >
                  📋 "Show leads"
                </button>
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() => handleQuickSend("Add leads")}
                >
                  ➕ "Add leads"
                </button>
              </div>

              <form onSubmit={handleSendMessage} className={styles.inputForm}>
                <input
                  type="text"
                  placeholder="Type a WhatsApp message to reply..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className={styles.messageInput}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className={styles.sendBtn}
                  title="Send via WhatsApp"
                >
                  <FiSend />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
