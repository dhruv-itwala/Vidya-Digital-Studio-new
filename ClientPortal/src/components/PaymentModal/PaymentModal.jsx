import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiCopy,
  FiCheck,
  FiShield,
  FiExternalLink,
  FiDollarSign,
  FiZap,
} from "react-icons/fi";
import { FaQrcode } from "react-icons/fa";
import toast from "react-hot-toast";
import styles from "./PaymentModal.module.css";
import qrCodeImg from "../../assets/PaymentQrCode.png";
import { generateUpiUrl, generateQrSvg } from "../../utils/qrGenerator";

export default function PaymentModal({ invoice, onClose }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [qrMode, setQrMode] = useState("dynamic"); // "dynamic" (pre-filled amount) | "static" (standard studio QR)

  if (!invoice) return null;

  const bank = invoice.bankDetails || {
    bankName: "Union Bank of India",
    accountHolderName: "Dheemahi Arkeshbhai Joshi",
    accountNumber: "534202010030024",
    ifscCode: "UBIN0553425",
    upiId: "dheemahi2@okhdfcbank",
  };

  const amountToPay =
    invoice.remainingAmount !== undefined
      ? invoice.remainingAmount
      : invoice.amount || invoice.totalAmount || 0;

  const copyText = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied ${key}!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate NPCI Standard UPI URL with exact pre-filled amount
  const dynamicUpiUrl = useMemo(() => {
    return generateUpiUrl({
      upiId: bank.upiId || "dheemahi2@okhdfcbank",
      payeeName: "Vidya Digital Studio",
      amount: amountToPay,
      note: `Invoice ${invoice.invoiceNumber || ""}`,
    });
  }, [bank, amountToPay, invoice]);

  // Generate Dynamic SVG QR Code
  const dynamicQrSvg = useMemo(() => {
    return generateQrSvg(dynamicUpiUrl, 180);
  }, [dynamicUpiUrl]);

  const handleNotifyPayment = () => {
    toast.success("Payment recorded. Studio finance executive will verify within 2-4 hours.");
    if (onClose) onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={styles.modalOverlay}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 12 }}
        transition={{ type: "spring", duration: 0.32, bounce: 0.08 }}
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.modalIconWrap}>
              <FaQrcode />
            </div>
            <div>
              <div className={styles.modalTitle}>Official Studio Payment</div>
              <div className={styles.modalSub}>
                Invoice #{invoice.invoiceNumber} · Vidya Digital Studio
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX size={18} />
          </motion.button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Outstanding Balance Banner */}
          <div className={styles.amountBox}>
            <div>
              <div className={styles.amountBoxLabel}>Payable Balance Due</div>
              <div className={styles.amountBoxSub}>
                {invoice.advanceAmount > 0
                  ? `₹${Number(invoice.advanceAmount).toLocaleString("en-IN")} advance credited`
                  : "Total invoice balance"}
              </div>
            </div>
            <div className={styles.amountBoxVal}>
              ₹{amountToPay.toLocaleString("en-IN")}
            </div>
          </div>

          {/* QR Code Mode Switcher */}
          <div className={styles.tabSwitchRow}>
            <button
              type="button"
              className={`${styles.tabSwitchBtn} ${qrMode === "dynamic" ? styles.tabSwitchBtnActive : ""}`}
              onClick={() => setQrMode("dynamic")}
            >
              {qrMode === "dynamic" && (
                <motion.div
                  layoutId="paymentTabSwitchPill"
                  className={styles.tabSwitchActiveBg}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className={styles.tabBtnContent}>
                <FiZap size={13} />
                <span>Exact Amount QR (Pre-filled)</span>
              </span>
            </button>
            <button
              type="button"
              className={`${styles.tabSwitchBtn} ${qrMode === "static" ? styles.tabSwitchBtnActive : ""}`}
              onClick={() => setQrMode("static")}
            >
              {qrMode === "static" && (
                <motion.div
                  layoutId="paymentTabSwitchPill"
                  className={styles.tabSwitchActiveBg}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className={styles.tabBtnContent}>
                <FaQrcode size={12} />
                <span>Studio Static QR</span>
              </span>
            </button>
          </div>

          {/* QR Code Box */}
          <div className={styles.qrContainer}>
            <div className={styles.qrImageWrap}>
              <AnimatePresence mode="wait">
                {qrMode === "dynamic" && dynamicQrSvg ? (
                  <motion.div
                    key="dynamic-qr"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    dangerouslySetInnerHTML={{ __html: dynamicQrSvg }}
                    className={styles.dynamicSvgWrapper}
                  />
                ) : (
                  <motion.img
                    key="static-qr"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    src={qrCodeImg}
                    alt="Studio UPI QR Code"
                    className={styles.qrImage}
                  />
                )}
              </AnimatePresence>
            </div>

            {qrMode === "dynamic" ? (
              <div className={styles.qrMetaBlock}>
                <div className={styles.qrPrompt}>
                  Scan to Pay ₹{amountToPay.toLocaleString("en-IN")}
                </div>
                <div className={styles.qrSubtext}>
                  GPay, PhonePe, Paytm, or BHIM will automatically pre-fill the exact amount
                </div>
                <div className={styles.amountBadgePreFilled}>
                  <FiCheck size={12} /> Pre-filled: ₹{amountToPay.toLocaleString("en-IN")}
                </div>
              </div>
            ) : (
              <div className={styles.qrMetaBlock}>
                <div className={styles.qrPrompt}>Studio Official Payment QR</div>
                <div className={styles.qrSubtext}>
                  Scan and enter ₹{amountToPay.toLocaleString("en-IN")} manually in your UPI app
                </div>
              </div>
            )}
          </div>

          {/* Bank Account Details */}
          <div className={styles.bankDetailsCard}>
            <div className={styles.bankSectionHeader}>
              <span>Direct IMPS / NEFT / RTGS Transfer</span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Account Holder</span>
              <div className={styles.detailValueWrap}>
                <span className={styles.detailValueText}>{bank.accountHolderName}</span>
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  type="button"
                  className={styles.copyMiniBtn}
                  onClick={() => copyText(bank.accountHolderName, "Account Holder")}
                  title="Copy account holder"
                >
                  {copiedKey === "Account Holder" ? <FiCheck size={12} color="#059669" /> : <FiCopy size={12} />}
                </motion.button>
              </div>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Bank Name</span>
              <div className={styles.detailValueWrap}>
                <span className={styles.detailValueText}>{bank.bankName}</span>
              </div>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Account Number</span>
              <div className={styles.detailValueWrap}>
                <span className={styles.detailValueText}>{bank.accountNumber}</span>
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  type="button"
                  className={styles.copyMiniBtn}
                  onClick={() => copyText(bank.accountNumber, "Account Number")}
                  title="Copy account number"
                >
                  {copiedKey === "Account Number" ? <FiCheck size={12} color="#059669" /> : <FiCopy size={12} />}
                </motion.button>
              </div>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>IFSC Code</span>
              <div className={styles.detailValueWrap}>
                <span className={styles.detailValueText}>{bank.ifscCode}</span>
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  type="button"
                  className={styles.copyMiniBtn}
                  onClick={() => copyText(bank.ifscCode, "IFSC Code")}
                  title="Copy IFSC"
                >
                  {copiedKey === "IFSC Code" ? <FiCheck size={12} color="#059669" /> : <FiCopy size={12} />}
                </motion.button>
              </div>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>UPI ID (VPA)</span>
              <div className={styles.detailValueWrap}>
                <span className={styles.detailValueText}>{bank.upiId}</span>
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  type="button"
                  className={styles.copyMiniBtn}
                  onClick={() => copyText(bank.upiId, "UPI ID")}
                  title="Copy UPI ID"
                >
                  {copiedKey === "UPI ID" ? <FiCheck size={12} color="#059669" /> : <FiCopy size={12} />}
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            href={dynamicUpiUrl}
            className={styles.upiPayBtn}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FiExternalLink size={14} />
            <span>Pay ₹{amountToPay.toLocaleString("en-IN")} via UPI App</span>
          </motion.a>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            className={styles.notifyPaidBtn}
            onClick={handleNotifyPayment}
          >
            <FiCheck size={14} />
            <span>I Have Paid</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
