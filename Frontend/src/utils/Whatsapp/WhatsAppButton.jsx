import { FaWhatsapp } from "react-icons/fa";
import styles from "./WhatsAppButton.module.css";

const WhatsAppButton = () => {
  const phoneNumber = "917096413502";
  const message = "Hello! I'm interested in your services.";

  const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.whatsapp}
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
    >
      <FaWhatsapp size={28} aria-hidden="true" />
    </a>
  );
};

export default WhatsAppButton;
