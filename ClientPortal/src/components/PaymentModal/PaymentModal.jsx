import React, { useState, useMemo } from "react";
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
    return generateQrSvg(dynamicUpiUrl, 190);
  }, [dynamicUpiUrl]);

  const handleNotifyPayment = () => {
    toast.success("Payment logged. Studio admin will verify.");
    if (onClose) onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
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
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Outstanding Balance Banner */}
          <div className={styles.amountBox}>
            <div>
              <div className={styles.amountBoxLabel}>Payable Amount Due</div>
              <div className={styles.amountBoxSub}>
                {invoice.advanceAmount > 0
                  ? `₹${invoice.advanceAmount.toLocaleString("en-IN")} already received`
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
              <FiZap size={13} />
              <span>Exact Amount QR (₹{amountToPay.toLocaleString("en-IN")} Pre-filled)</span>
            </button>
            <button
              type="button"
              className={`${styles.tabSwitchBtn} ${qrMode === "static" ? styles.tabSwitchBtnActive : ""}`}
              onClick={() => setQrMode("static")}
            >
              <FaQrcode size={12} />
              <span>Studio Static QR</span>
            </button>
          </div>

          {/* QR Code Box */}
          <div className={styles.qrContainer}>
            <div className={styles.qrImageWrap}>
              {qrMode === "dynamic" && dynamicQrSvg ? (
                <div
                  dangerouslySetInnerHTML={{ __html: dynamicQrSvg }}
                  className={styles.dynamicSvgWrapper}
                />
              ) : (
                <img
                  src={qrCodeImg}
                  alt="Studio UPI QR Code"
                  className={styles.qrImage}
                />
              )}
            </div>

            {qrMode === "dynamic" ? (
              <>
                <div className={styles.qrPrompt}>
                  Scan to Pay ₹{amountToPay.toLocaleString("en-IN")} Automatically
                </div>
                <div className={styles.qrSubtext}>
                  GPay, PhonePe, Paytm, or BHIM will automatically pre-fill the exact amount!
                </div>
                <div className={styles.amountBadgePreFilled}>
                  <FiCheck size={12} /> Pre-filled: ₹{amountToPay.toLocaleString("en-IN")}
                </div>
              </>
            ) : (
              <>
                <div className={styles.qrPrompt}>Studio Official Payment QR</div>
                <div className={styles.qrSubtext}>
                  Scan and enter ₹{amountToPay.toLocaleString("en-IN")} manually in your UPI app
                </div>
              </>
            )}
          </div>

          {/* Bank Account Details */}
          <div className={styles.bankDetailsCard}>
            <div className={styles.bankSectionHeader}>
              Direct IMPS / NEFT / RTGS Transfer
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Account Holder</span>
              <div className={styles.detailValueWrap}>
                <span>{bank.accountHolderName}</span>
                <button
                  type="button"
                  className={styles.copyMiniBtn}
                  onClick={() => copyText(bank.accountHolderName, "Account Holder")}
                  title="Copy account holder"
                >
                  {copiedKey === "Account Holder" ? <FiCheck size={12} /> : <FiCopy size={12} />}
                </button>
              </div>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Bank Name</span>
              <div className={styles.detailValueWrap}>
                <span>{bank.bankName}</span>
              </div>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Account Number</span>
              <div className={styles.detailValueWrap}>
                <span>{bank.accountNumber}</span>
                <button
                  type="button"
                  className={styles.copyMiniBtn}
                  onClick={() => copyText(bank.accountNumber, "Account Number")}
                  title="Copy account number"
                >
                  {copiedKey === "Account Number" ? <FiCheck size={12} /> : <FiCopy size={12} />}
                </button>
              </div>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>IFSC Code</span>
              <div className={styles.detailValueWrap}>
                <span>{bank.ifscCode}</span>
                <button
                  type="button"
                  className={styles.copyMiniBtn}
                  onClick={() => copyText(bank.ifscCode, "IFSC Code")}
                  title="Copy IFSC"
                >
                  {copiedKey === "IFSC Code" ? <FiCheck size={12} /> : <FiCopy size={12} />}
                </button>
              </div>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>UPI ID (VPA)</span>
              <div className={styles.detailValueWrap}>
                <span>{bank.upiId}</span>
                <button
                  type="button"
                  className={styles.copyMiniBtn}
                  onClick={() => copyText(bank.upiId, "UPI ID")}
                  title="Copy UPI ID"
                >
                  {copiedKey === "UPI ID" ? <FiCheck size={12} /> : <FiCopy size={12} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <a
            href={dynamicUpiUrl}
            className={styles.upiPayBtn}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FiExternalLink /> Pay ₹{amountToPay.toLocaleString("en-IN")} via UPI App
          </a>
          <button
            type="button"
            className={styles.notifyPaidBtn}
            onClick={handleNotifyPayment}
          >
            I Have Paid
          </button>
        </div>
      </div>
    </div>
  );
}
