import { useForm, useFieldArray } from "react-hook-form";
import { createClientAPI, updateClientAPI } from "../../api/client.api";
import styles from "./ClientModal.module.css";
import { useState } from "react";

export default function ClientModal({ mode, defaultValues, onClose, onSaved }) {
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const [activeTab, setActiveTab] = useState("profile");
  const [openPlatform, setOpenPlatform] = useState(null);

  const { register, control, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      ...defaultValues,
      services: defaultValues?.services?.join(", "),
      onboardingDate: defaultValues?.onboardingDate
        ? defaultValues.onboardingDate.split("T")[0]
        : "",
    },
  });

  const { fields, append } = useFieldArray({
    control,
    name: "credentials",
  });

  const platforms = ["email", "instagram", "facebook", "custom"];
  const watchedCredentials = watch("credentials") || [];
  const selected = watchedCredentials.map((c) => c.platform);

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      services: data.services
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    if (mode === "add") {
      await createClientAPI(payload);
    } else {
      await updateClientAPI(defaultValues._id, payload);
    }

    onSaved();
    onClose();
  };

  return (
    <div className={styles.modal}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {/* Browser tabs */}
        <div className={styles.tabs}>
          <span
            className={activeTab === "profile" ? styles.activeTab : ""}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </span>

          <span
            className={activeTab === "contract" ? styles.activeTab : ""}
            onClick={() => setActiveTab("contract")}
          >
            Contract & Payment
          </span>

          <span
            className={activeTab === "access" ? styles.activeTab : ""}
            onClick={() => setActiveTab("access")}
          >
            Access
          </span>
        </div>

        {activeTab === "profile" && (
          <section>
            <div className={styles.field}>
              <label>Client Name</label>
              <input {...register("clientName")} disabled={isView} />
            </div>
            <div className={styles.field}>
              <label>Owner Name</label>
              <input
                {...register("ownerName")}
                placeholder="Owner Name"
                disabled={isView}
              />
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input
                {...register("email")}
                placeholder="Email"
                disabled={isView}
              />
            </div>
            <div className={styles.field}>
              <label>Services</label>
              <input
                {...register("services")}
                placeholder="Services"
                disabled={isView}
              />
            </div>
          </section>
        )}

        {activeTab === "contract" && (
          <section>
            <div className={styles.field}>
              <label>Payment Amount</label>
              <input
                type="number"
                {...register("payment.amount")}
                placeholder="Amount"
                disabled={isView}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="payment.tenure">Tenure (months)</label>
              <input
                {...register("payment.tenure")}
                placeholder="Tenure (months)"
                disabled={isView}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="payment.status">Payment Status</label>
              <select {...register("payment.status")} disabled={isView}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="payment.method">Payment Method</label>
              <select {...register("payment.method")} disabled={isView}>
                <option value="upi">UPI</option>
                <option value="bank">Bank</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            <div className={styles.field}>
              <label>Onboarding Date</label>
              <input
                type="date"
                {...register("onboardingDate")}
                disabled={isView}
              />
            </div>
          </section>
        )}

        {activeTab === "access" && (
          <section className={styles.accordionWrap}>
            {watchedCredentials.map((cred, i) => {
              const isOpen = openPlatform === i;

              const filledCount = [
                cred.username,
                cred.password,
                cred.email,
                cred.phone,
              ].filter(Boolean).length;

              return (
                <div key={cred.platform} className={styles.accordionItem}>
                  {/* Header */}
                  <div
                    className={styles.accordionHeader}
                    onClick={() => setOpenPlatform(isOpen ? null : i)}
                  >
                    <div className={styles.left}>
                      <span className={styles.platform}>
                        {cred.platform.toUpperCase()}
                      </span>

                      {filledCount > 0 && (
                        <span className={styles.filled}>
                          {filledCount} saved
                        </span>
                      )}
                    </div>

                    <span className={styles.arrow}>{isOpen ? "▾" : "▸"}</span>
                  </div>

                  {/* Body */}
                  {isOpen && (
                    <div className={styles.accordionBody}>
                      <input
                        {...register(`credentials.${i}.username`)}
                        placeholder="Username"
                        disabled={isView}
                      />

                      <input
                        {...register(`credentials.${i}.password`)}
                        placeholder="Password"
                        type="password"
                        disabled={isView}
                      />

                      <input
                        {...register(`credentials.${i}.email`)}
                        placeholder="Email"
                        disabled={isView}
                      />

                      <input
                        {...register(`credentials.${i}.phone`)}
                        placeholder="Phone"
                        disabled={isView}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {!isView && (
              <div className={styles.addPlatform}>
                {["email", "instagram", "facebook", "youtube", "custom"].map(
                  (p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => {
                        append({
                          platform: p,
                          username: "",
                          password: "",
                          email: "",
                          phone: "",
                        });
                        setOpenPlatform(watchedCredentials.length);
                      }}
                    >
                      + {p.toUpperCase()}
                    </button>
                  )
                )}
              </div>
            )}
          </section>
        )}

        <div className={styles.footer}>
          <button type="button" onClick={onClose}>
            Close
          </button>

          {mode !== "view" && (
            <button type="submit">
              {mode === "add" ? "Create Client" : "Update Client"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
