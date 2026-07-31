import Loader from "../Loader/Loader";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/name.util";
import {
  FiMail,
  FiPhone,
  FiBriefcase,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiHash,
  FiClock
} from "react-icons/fi";

import styles from "./Profile.module.css";

export default function Profile() {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;
  if (!user) return null;

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    }) : "-";

  return (
    <div className={styles.container}>

      {/* HEADER BANNER */}
      <div className={styles.bannerSection}>
        <div className={styles.bannerBackground}></div>
        <div className={styles.profileHeader}>
          <div className={styles.avatarWrapper}>
            {user.profilePicture ? (
              <img
                src={user.profilePicture.url}
                alt={user.name}
                className={styles.avatarImg}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {getInitials(user.name)}
              </div>
            )}
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.name}>{user.name}</h1>
            <p className={styles.role}>{user.designation || "Employee"}</p>
            <div className={styles.badges}>
              <span className={styles.roleBadge}>{user.role.toUpperCase()}</span>
              {user.isActive ? (
                <span className={styles.activeBadge}>ACTIVE</span>
              ) : (
                <span className={styles.inactiveBadge}>INACTIVE</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BENTO GRID DETAILS */}
      <div className={styles.grid}>

        {/* WORK DETAILS */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperGreen}>
              <FiBriefcase />
            </div>
            <h3>Work Details</h3>
          </div>

          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <FiMail className={styles.rowIcon} />
              <span>Official Email</span>
            </div>
            <span className={styles.rowValue}>{user.email}</span>
          </div>

          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <FiHash className={styles.rowIcon} />
              <span>Employee Id</span>
            </div>
            <span className={styles.rowValue}>{user._id?.substring(0, 8).toUpperCase()}</span>
          </div>

          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <FiBriefcase className={styles.rowIcon} />
              <span>Designation</span>
            </div>
            <span className={styles.rowValue}>{user.designation || "-"}</span>
          </div>

          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <FiClock className={styles.rowIcon} />
              <span>Joining Date</span>
            </div>
            <span className={styles.rowValue}>{formatDate(user.joiningDate)}</span>
          </div>
        </div>

        {/* PERSONAL DETAILS */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperOrange}>
              <FiUser />
            </div>
            <h3>Personal Details</h3>
          </div>

          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <FiCalendar className={styles.rowIcon} />
              <span>Date of Birth</span>
            </div>
            <span className={styles.rowValue}>{formatDate(user.dateOfBirth)}</span>
          </div>

          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <FiMail className={styles.rowIcon} />
              <span>Personal Email</span>
            </div>
            <span className={styles.rowValue}>{user.personalEmail || "-"}</span>
          </div>

          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <FiPhone className={styles.rowIcon} />
              <span>Contact No</span>
            </div>
            <span className={styles.rowValue}>{user.contactNo || "-"}</span>
          </div>

          {user.phone && (
            <div className={styles.row}>
              <div className={styles.rowLabel}>
                <FiPhone className={styles.rowIcon} />
                <span>Alternate Phone</span>
              </div>
              <span className={styles.rowValue}>{user.phone}</span>
            </div>
          )}

          <div className={styles.row}>
            <div className={styles.rowLabel}>
              <FiUser className={styles.rowIcon} />
              <span>Gender</span>
            </div>
            <span className={styles.rowValue}>{user.gender?.toUpperCase() || "-"}</span>
          </div>
        </div>

        {/* ADDRESS */}
        <div className={styles.cardFull}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapperCoral}>
              <FiMapPin />
            </div>
            <h3>Address</h3>
          </div>
          <div className={styles.addressBox}>
            <p className={styles.addressText}>{user.address || "No address provided."}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
