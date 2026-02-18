import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import { useAuth } from "../../context/AuthContext";
import { useClient } from "../../hooks/useClient";

import BasicInfoSection from "./subcomponents/BasicInfoSection";
import ServicesSection from "./subcomponents/ServicesSection";
import PaymentSection from "./subcomponents/PaymentSection";
import TransactionsTable from "./subcomponents/TransactionsTable";
import CredentialsTable from "./subcomponents/CredentialsTable";
import DocumentsTable from "./subcomponents/DocumentsTable";

import styles from "./CreateClient.module.css";
import toast from "react-hot-toast";

const CreateClient = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const { loading, handleCreateClient } = useClient();

  const form = useForm({
    defaultValues: {
      billingType: "one-time",
      paymentStatus: "pending",
      transactions: [],
      credentials: [],
      documents: [],
    },
  });

  const {
    handleSubmit,
    register,
    watch,
    control,
    setValue,
    formState: { errors },
  } = form;

  /* =========================================
     SUBMIT HANDLER
  ========================================= */
  const onSubmit = async (data) => {
    try {
      const created = await handleCreateClient(data);

      if (created?._id) {
        navigate(`/${role}/clients`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="masterContainer">
      <form
        className={styles.container}
        onSubmit={handleSubmit(onSubmit, (errors) => {
          console.error("❌ FORM VALIDATION ERRORS:", errors);
          toast.error("Please fix validation errors");
        })}
      >
        {/* HEADER */}
        <div className={styles.header}>
          <h2>Create Client</h2>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.createBtn}
              onClick={() => navigate(`/${role}/clients`)}
              disabled={loading}
            >
              Back
            </button>

            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? "Creating..." : "Create Client"}
            </button>
          </div>
        </div>

        {/* SECTIONS */}

        <BasicInfoSection register={register} errors={errors} />

        <ServicesSection
          register={register}
          errors={errors}
          setValue={setValue}
        />

        <PaymentSection
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
        />

        <TransactionsTable
          control={control}
          register={register}
          errors={errors}
        />

        <DocumentsTable control={control} register={register} errors={errors} />

        <CredentialsTable
          control={control}
          register={register}
          errors={errors}
        />
      </form>
    </div>
  );
};

export default CreateClient;
