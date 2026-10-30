// VIDYACRM/src/pages/Invoices/InvoiceBuilderPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Loader from "../../components/Loader/Loader";
import {
  getNextInvoiceNumberAPI,
  getClientsForInvoiceAPI,
  generateInvoiceAPI,
  getInvoiceByIdAPI,
  updateInvoiceAPI,
} from "../../api/invoice.api";
import InvoicePreviewModal from "./InvoicePreviewModal";
import { Images } from "../../assets/Data/images";
import styles from "./InvoiceBuilderPage.module.css";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiFileText,
  FiUser,
  FiList,
  FiDollarSign,
  FiPlus,
  FiTrash2,
  FiShield,
  FiCheck,
  FiCopy,
} from "react-icons/fi";

const DEFAULT_TERMS = [
  "Payment is due within 3 days of the invoice date.",
  "Services will be delivered as per the mutually agreed scope of work and timeline.",
  "Any additional work, features or revisions beyond the agreed scope will be charged separately.",
  "Delays in receiving required content, approvals or feedback from the client may affect delivery timelines.",
  "Advertising (ad spend) costs are not included in this invoice and will be billed separately, if applicable.",
  "Third-party resources, subscriptions, plugins, software or add-ons are not included and will be billed separately, if applicable.",
  "Delayed payments may result in a temporary pause or suspension of services.",
  "The agency is not responsible for delays or disruptions caused by third-party platforms or external service providers.",
  "Final deliverables and ownership rights will be transferred as per the agreed project terms and applicable payment conditions.",
  "Specific business results, sales, leads, rankings or engagement levels are not guaranteed unless explicitly agreed in writing.",
];

export default function InvoiceBuilderPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const basePath = location.pathname.startsWith("/hr") ? "/hr/invoices" : "/admin/invoices";

  const [loadingInvoice, setLoadingInvoice] = useState(isEditMode);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState("IND/2026 : #1001");
  const [invoiceDate, setInvoiceDate] = useState(() => {
    return new Date()
      .toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
      .toUpperCase();
  });

  const [client, setClient] = useState({
    clientId: "",
    name: "",
    companyName: "",
    address: "",
    email: "",
    phone: "",
    gstNumber: "",
    designation: "Owner",
  });

  const [crmClients, setCrmClients] = useState([]);
  const [items, setItems] = useState([
    {
      srNo: 1,
      service: "Social Media Management",
      description: "Posting and scheduling on Instagram & Facebook.",
      amount: 15000,
    },
  ]);

  const [gstEnabled, setGstEnabled] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [remainingDate, setRemainingDate] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(DEFAULT_TERMS);

  // Bank Info
  const [bankDetails] = useState({
    bankName: "Union Bank of India",
    accountHolderName: "Dheemahi Arkeshbhai Joshi",
    accountNumber: "534202010030024",
    ifscCode: "UBIN0553425",
    upiId: "dheemahi2@okhdfcbank",
  });

  const [generating, setGenerating] = useState(false);
  const [copiedBank, setCopiedBank] = useState("");

  // Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewStatus, setPreviewStatus] = useState("loading");
  const [previewData, setPreviewData] = useState({
    invoiceNumber: "",
    pdfUrl: "",
    pdfBase64: "",
    errorMessage: "",
  });

  // Fetch Next Invoice Number and Clients (or Existing Invoice if Editing)
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        if (isEditMode) {
          setLoadingInvoice(true);
          const [invRes, clientRes] = await Promise.allSettled([
            getInvoiceByIdAPI(id),
            getClientsForInvoiceAPI(),
          ]);

          if (!isMounted) return;

          if (clientRes.status === "fulfilled" && clientRes.value.data?.success) {
            setCrmClients(clientRes.value.data.data || []);
          }

          if (invRes.status === "fulfilled" && invRes.value.data?.success) {
            const inv = invRes.value.data.data;
            if (inv.invoiceNumber) setInvoiceNumber(inv.invoiceNumber);
            if (inv.invoiceDate) setInvoiceDate(inv.invoiceDate);
            if (inv.client) {
              setClient({
                clientId: inv.client.clientId || "",
                name: inv.client.name || "",
                companyName: inv.client.companyName || "",
                address: inv.client.address || "",
                email: inv.client.email || "",
                phone: inv.client.phone || "",
                gstNumber: inv.client.gstNumber || "",
                designation: inv.client.designation || "Owner",
              });
            }
            if (Array.isArray(inv.items) && inv.items.length > 0) {
              setItems(
                inv.items.map((item, idx) => ({
                  srNo: item.srNo || idx + 1,
                  service: item.service || "",
                  description: item.description || "",
                  amount: Number(item.amount) || 0,
                }))
              );
            }
            setGstEnabled(Boolean(inv.gstEnabled));
            setAdvanceAmount(Number(inv.advanceAmount) || 0);
            setRemainingDate(inv.remainingDate || "");
            if (Array.isArray(inv.notes)) {
              setNotes(inv.notes.join("\n"));
            } else if (typeof inv.notes === "string") {
              setNotes(inv.notes);
            }
            if (Array.isArray(inv.paymentTerms) && inv.paymentTerms.length > 0) {
              setTerms(inv.paymentTerms);
            }
          } else {
            toast.error("Failed to load invoice for editing.");
          }
        } else {
          const [numRes, clientRes] = await Promise.allSettled([
            getNextInvoiceNumberAPI(),
            getClientsForInvoiceAPI(),
          ]);

          if (!isMounted) return;

          if (numRes.status === "fulfilled" && numRes.value.data?.success) {
            setInvoiceNumber(numRes.value.data.nextInvoiceNumber);
          }

          if (clientRes.status === "fulfilled" && clientRes.value.data?.success) {
            const list = clientRes.value.data.data || [];
            setCrmClients(list);
            const searchParams = new URLSearchParams(location.search);
            const preselectedId = searchParams.get("clientId");
            if (preselectedId) {
              const found = list.find((c) => c._id === preselectedId);
              if (found) {
                setClient({
                  clientId: found._id,
                  name: found.name || found.companyName || "",
                  companyName: found.companyName || "",
                  address: found.address || "",
                  email: found.email || "",
                  phone: found.phone || "",
                  gstNumber: found.gstNumber || "",
                  designation: "Owner",
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn("Init error:", err);
      } finally {
        if (isMounted) setLoadingInvoice(false);
      }
    };
    init();

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode]);

  // Client Picker Handler
  const handleSelectCrmClient = (clientId) => {
    if (!clientId) {
      setClient({
        clientId: "",
        name: "",
        companyName: "",
        address: "",
        email: "",
        phone: "",
        gstNumber: "",
        designation: "Owner",
      });
      return;
    }

    const selected = crmClients.find((c) => c._id === clientId);
    if (selected) {
      setClient({
        clientId: selected._id,
        name: selected.name || selected.companyName || "",
        companyName: selected.companyName || "",
        address: selected.address || "",
        email: selected.email || "",
        phone: selected.phone || "",
        gstNumber: selected.gstNumber || "",
        designation: "Owner",
      });
      toast.success(`Loaded details for ${selected.companyName || selected.name}`);
    }
  };

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [items]);

  const cgst = useMemo(() => (gstEnabled ? Math.round(subtotal * 0.09) : 0), [subtotal, gstEnabled]);
  const sgst = useMemo(() => (gstEnabled ? Math.round(subtotal * 0.09) : 0), [subtotal, gstEnabled]);
  const totalAmount = useMemo(() => subtotal + cgst + sgst, [subtotal, cgst, sgst]);
  const remainingAmount = useMemo(() => Math.max(0, totalAmount - (Number(advanceAmount) || 0)), [totalAmount, advanceAmount]);

  // Service Row Actions
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        srNo: prev.length + 1,
        service: "",
        description: "",
        amount: 0,
      },
    ]);
  };

  const handleUpdateItem = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      return toast.error("At least one service row is required.");
    }
    setItems((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((item, idx) => ({ ...item, srNo: idx + 1 }));
    });
  };

  const handleCopyText = (label, text) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(label);
    toast.success(`Copied ${label}`);
    setTimeout(() => setCopiedBank(""), 2000);
  };

  // Generate & Save (or Update & Regenerate)
  const handleGenerate = async () => {
    if (!client.companyName && !client.name) {
      return toast.error("Please enter client or company name.");
    }
    if (items.length === 0 || subtotal <= 0) {
      return toast.error("Please specify at least one service item with an amount.");
    }

    setGenerating(true);
    setPreviewData({
      invoiceNumber,
      pdfUrl: "",
      pdfBase64: "",
      errorMessage: "",
    });
    setPreviewStatus("loading");
    setPreviewOpen(true);

    try {
      const payload = {
        invoiceNumber,
        invoiceDate,
        client,
        items,
        gstEnabled,
        subtotal,
        cgst,
        sgst,
        totalAmount,
        advanceAmount: Number(advanceAmount) || 0,
        remainingAmount,
        remainingDate,
        paymentTerms: terms,
        notes: notes
          .split("\n")
          .map((n) => n.trim())
          .filter(Boolean),
        bankDetails,
      };

      const res = isEditMode
        ? await updateInvoiceAPI(id, payload)
        : await generateInvoiceAPI(payload);

      if (res.data?.success) {
        setPreviewData({
          invoiceNumber: res.data.invoiceNumber || res.data.data?.invoiceNumber || invoiceNumber,
          pdfUrl: res.data.pdfUrl || "",
          pdfBase64: res.data.pdfBase64 || "",
          errorMessage: "",
        });
        setPreviewStatus("success");
        toast.success(
          isEditMode
            ? "Invoice updated & regenerated successfully!"
            : "Invoice generated & saved successfully!"
        );
      } else {
        throw new Error(res.data?.message || "Invoice generation failed.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to process invoice.";
      setPreviewData((prev) => ({ ...prev, errorMessage: msg }));
      setPreviewStatus("error");
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  if (loadingInvoice) {
    return (
      <div className="masterContainer">
        <Loader />
      </div>
    );
  }

  return (
    <div className="masterContainer">
      <div className={styles.container}>
        {/* Top Nav */}
        <div className={styles.topNav}>
          <Link to={basePath} className={styles.backLink}>
            <FiArrowLeft size={16} />
            <span>Back to Invoices</span>
          </Link>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.backLink}
              onClick={() => {
                if (window.confirm("Reset all form fields?")) {
                  window.location.reload();
                }
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Page Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            {isEditMode ? "Edit & Update Invoice" : "Create Official Invoice"}
          </h1>
          <p className={styles.pageSubtitle}>
            {isEditMode
              ? `Modifying invoice ${invoiceNumber} — saving will update the database and regenerate the 3-page studio PDF.`
              : "Generate modern 3-page studio invoice with terms & QR payment"}
          </p>
        </div>

        <div className={styles.workspaceLayout}>
          {/* Main Form Column */}
          <div className={styles.formColumn}>
            {/* Card 1: Metadata & Client Details */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <FiFileText className={styles.cardTitleIcon} />
                  <span>Invoice &amp; Client Details</span>
                </div>
                <span className={styles.cardBadge}>{isEditMode ? "Edit Mode" : "Page 1"}</span>
              </div>

              {/* CRM Client Picker */}
              <div className={styles.crmBar}>
                <span className={styles.crmLabel}>Autofill from CRM:</span>
                <select
                  className={styles.crmSelect}
                  value={client.clientId || ""}
                  onChange={(e) => handleSelectCrmClient(e.target.value)}
                >
                  <option value="">-- Choose Existing CRM Client (Optional) --</option>
                  {crmClients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName ? `${c.companyName} (${c.name})` : c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGrid2}>
                <div className={styles.inputField}>
                  <label className={styles.label}>
                    Invoice Number <span className={styles.req}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.inputControl}
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. IND/2026 : #1001"
                  />
                </div>

                <div className={styles.inputField}>
                  <label className={styles.label}>
                    Issue Date <span className={styles.req}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.inputControl}
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    placeholder="e.g. 30 OCT 2026"
                  />
                </div>

                <div className={styles.inputField}>
                  <label className={styles.label}>
                    Company / Business Name <span className={styles.req}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.inputControl}
                    value={client.companyName}
                    onChange={(e) => setClient({ ...client, companyName: e.target.value })}
                    placeholder="Company or Brand Name"
                  />
                </div>

                <div className={styles.inputField}>
                  <label className={styles.label}>
                    Contact Person Name <span className={styles.req}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.inputControl}
                    value={client.name}
                    onChange={(e) => setClient({ ...client, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>

                <div className={styles.inputField}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    className={styles.inputControl}
                    value={client.email}
                    onChange={(e) => setClient({ ...client, email: e.target.value })}
                    placeholder="client@company.com"
                  />
                </div>

                <div className={styles.inputField}>
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="text"
                    className={styles.inputControl}
                    value={client.phone}
                    onChange={(e) => setClient({ ...client, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div className={`${styles.inputField} ${styles.fullWidth}`}>
                  <label className={styles.label}>Billing Address</label>
                  <input
                    type="text"
                    className={styles.inputControl}
                    value={client.address}
                    onChange={(e) => setClient({ ...client, address: e.target.value })}
                    placeholder="Full street address, City, State, PIN"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Services / Scope Rows */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <FiList className={styles.cardTitleIcon} />
                  <span>Service Details &amp; Custom Rows</span>
                </div>
                <span className={styles.cardBadge}>{items.length} items</span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className={styles.servicesTable}>
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>Sr.</th>
                      <th>Service Title</th>
                      <th>Scope / Description</th>
                      <th style={{ width: "130px" }}>Amount (₹)</th>
                      <th style={{ width: "40px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className={styles.rowSr}>{item.srNo}</td>
                        <td>
                          <input
                            type="text"
                            className={styles.rowInput}
                            placeholder="e.g. Website Development"
                            value={item.service}
                            onChange={(e) => handleUpdateItem(idx, "service", e.target.value)}
                          />
                        </td>
                        <td>
                          <textarea
                            className={styles.rowTextarea}
                            placeholder="Service scope, deliverables, or features included..."
                            value={item.description}
                            onChange={(e) => handleUpdateItem(idx, "description", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className={styles.rowInput}
                            placeholder="0"
                            value={item.amount || ""}
                            onChange={(e) => handleUpdateItem(idx, "amount", Number(e.target.value) || 0)}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className={styles.rowDeleteBtn}
                            onClick={() => handleRemoveItem(idx)}
                            title="Remove row"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button type="button" className={styles.addRowBtn} onClick={handleAddItem}>
                <FiPlus size={15} />
                <span>Add Service Row</span>
              </button>
            </div>

            {/* Card 3: GST & Advance Payment */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <FiDollarSign className={styles.cardTitleIcon} />
                  <span>Tax &amp; Payment Breakdown</span>
                </div>
              </div>

              {/* 18% GST Toggle */}
              <div className={styles.gstSwitchRow}>
                <div className={styles.gstSwitchLabel}>
                  <span className={styles.gstSwitchTitle}>Enable 18% GST</span>
                  <span className={styles.gstSwitchDesc}>
                    Automatically calculates and adds 9% CGST (₹{cgst.toLocaleString("en-IN")}) + 9% SGST (₹{sgst.toLocaleString("en-IN")})
                  </span>
                </div>
                <label className={styles.switchToggle}>
                  <input
                    type="checkbox"
                    checked={gstEnabled}
                    onChange={(e) => setGstEnabled(e.target.checked)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              <div className={styles.inputGrid2}>
                <div className={styles.inputField}>
                  <label className={styles.label}>Advance Amount Paid (₹)</label>
                  <input
                    type="number"
                    className={styles.inputControl}
                    value={advanceAmount || ""}
                    onChange={(e) => setAdvanceAmount(Number(e.target.value) || 0)}
                    placeholder="0"
                  />
                  <div className={styles.chipGroup}>
                    <button type="button" className={styles.chipBtn} onClick={() => setAdvanceAmount(Math.round(totalAmount * 0.25))}>
                      25%
                    </button>
                    <button type="button" className={styles.chipBtn} onClick={() => setAdvanceAmount(Math.round(totalAmount * 0.5))}>
                      50%
                    </button>
                    <button type="button" className={styles.chipBtn} onClick={() => setAdvanceAmount(totalAmount)}>
                      100% (Paid)
                    </button>
                  </div>
                </div>

                <div className={styles.inputField}>
                  <label className={styles.label}>Remaining Payment Due Date</label>
                  <input
                    type="date"
                    className={styles.inputControl}
                    value={remainingDate}
                    onChange={(e) => setRemainingDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Card 4: Page 2 Legal Terms & Notes */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <FiShield className={styles.cardTitleIcon} />
                  <span>Terms &amp; Conditions (Page 2)</span>
                </div>
                <span className={styles.cardBadge}>10 Clauses</span>
              </div>

              <div className={styles.termsList}>
                {terms.map((term, i) => (
                  <div key={i} className={styles.termItem}>
                    <span className={styles.termNum}>{i + 1}.</span>
                    <input
                      type="text"
                      className={styles.termInput}
                      value={term}
                      onChange={(e) => {
                        const copy = [...terms];
                        copy[i] = e.target.value;
                        setTerms(copy);
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className={styles.inputField} style={{ marginTop: "16px" }}>
                <label className={styles.label}>
                  Special Notes / Remarks (Auto-hides in PDF if left empty)
                </label>
                <textarea
                  className={styles.inputControl}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes or instructions for the client..."
                />
              </div>
            </div>

            {/* Card 5: Page 3 Bank Details & QR */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <FiDollarSign className={styles.cardTitleIcon} />
                  <span>Payment Details &amp; QR Code (Page 3)</span>
                </div>
                <span className={styles.cardBadge}>Bank Transfer</span>
              </div>

              <div className={styles.bankGrid}>
                <div className={styles.bankDetails}>
                  <div className={styles.bankRow}>
                    <span className={styles.bankLabel}>Bank Name:</span>
                    <span className={styles.bankVal}>{bankDetails.bankName}</span>
                  </div>
                  <div className={styles.bankRow}>
                    <span className={styles.bankLabel}>Account Holder:</span>
                    <span className={styles.bankVal}>{bankDetails.accountHolderName}</span>
                  </div>
                  <div className={styles.bankRow}>
                    <span className={styles.bankLabel}>Account Number:</span>
                    <span className={styles.bankVal}>
                      {bankDetails.accountNumber}{" "}
                      <button
                        type="button"
                        onClick={() => handleCopyText("Account Number", bankDetails.accountNumber)}
                        style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "4px" }}
                      >
                        {copiedBank === "Account Number" ? <FiCheck color="green" /> : <FiCopy size={12} />}
                      </button>
                    </span>
                  </div>
                  <div className={styles.bankRow}>
                    <span className={styles.bankLabel}>IFSC Code:</span>
                    <span className={styles.bankVal}>
                      {bankDetails.ifscCode}{" "}
                      <button
                        type="button"
                        onClick={() => handleCopyText("IFSC Code", bankDetails.ifscCode)}
                        style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "4px" }}
                      >
                        {copiedBank === "IFSC Code" ? <FiCheck color="green" /> : <FiCopy size={12} />}
                      </button>
                    </span>
                  </div>
                  <div className={styles.bankRow}>
                    <span className={styles.bankLabel}>UPI ID:</span>
                    <span className={styles.bankVal}>
                      {bankDetails.upiId}{" "}
                      <button
                        type="button"
                        onClick={() => handleCopyText("UPI ID", bankDetails.upiId)}
                        style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "4px" }}
                      >
                        {copiedBank === "UPI ID" ? <FiCheck color="green" /> : <FiCopy size={12} />}
                      </button>
                    </span>
                  </div>
                </div>

                <div className={styles.qrWrap}>
                  <img
                    src={Images.payment_qr}
                    alt="Payment QR Code"
                    className={styles.qrImg}
                  />
                  <span className={styles.qrCaption}>Scan to Pay via UPI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Rail: Billing Summary */}
          <div className={styles.railColumn}>
            <div className={styles.summaryRail}>
              <div className={styles.summaryTitle}>Billing Summary</div>

              <div className={styles.summaryRow}>
                <span>Subtotal ({items.length} items):</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>

              {gstEnabled && (
                <>
                  <div className={styles.summaryRow}>
                    <span>CGST (9%):</span>
                    <span>₹{cgst.toLocaleString("en-IN")}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>SGST (9%):</span>
                    <span>₹{sgst.toLocaleString("en-IN")}</span>
                  </div>
                </>
              )}

              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Total Amount:</span>
                <span>₹{totalAmount.toLocaleString("en-IN")}</span>
              </div>

              <div className={`${styles.summaryRow} ${styles.advanceRow}`} style={{ marginTop: "12px" }}>
                <span>Advance Paid:</span>
                <span>₹{(Number(advanceAmount) || 0).toLocaleString("en-IN")}</span>
              </div>

              <div className={`${styles.summaryRow} ${styles.dueRow}`}>
                <span>Remaining Due:</span>
                <span>₹{remainingAmount.toLocaleString("en-IN")}</span>
              </div>

              {remainingDate && (
                <div className={styles.summaryRow} style={{ fontSize: "11.5px" }}>
                  <span>Due Date:</span>
                  <span>{remainingDate}</span>
                </div>
              )}

              <button
                type="button"
                className={styles.primaryGenerateBtn}
                onClick={handleGenerate}
                disabled={generating}
              >
                <FiFileText size={16} />
                <span>
                  {generating
                    ? isEditMode
                      ? "Updating & Regenerating..."
                      : "Generating..."
                    : isEditMode
                    ? "Update & Regenerate Invoice"
                    : "Generate Official Invoice"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <InvoicePreviewModal
        isOpen={previewOpen}
        status={previewStatus}
        pdfUrl={previewData.pdfUrl}
        pdfBase64={previewData.pdfBase64}
        invoiceNumber={previewData.invoiceNumber}
        errorMessage={previewData.errorMessage}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
