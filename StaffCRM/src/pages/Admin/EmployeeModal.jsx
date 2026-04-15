import { useState } from "react";
import Cropper from "react-easy-crop";
import {
  createUserAPI,
  updateUserAPI,
  uploadProfilePhotoAPI,
} from "../../api/admin.api";
import { useAuth } from "../../context/AuthContext";
import styles from "./EmployeeModal.module.css";
import toast from "react-hot-toast";

export default function EmployeeModal({ user, onClose, onSaved }) {
  const { user: loggedInUser } = useAuth();

  const [photo, setPhoto] = useState(user?.profilePicture || null);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);

  const isEdit = Boolean(user?._id);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    password: "",
    designation: user?.designation || "",
    joiningDate: user?.joiningDate?.slice(0, 10) || "",
    dateOfBirth: user?.dateOfBirth?.slice(0, 10) || "",
    contactNo: user?.contactNo || "",
    gender: user?.gender || "",
    address: user?.address || "",
    personalEmail: user?.personalEmail || "",
    role: user?.role || "employee",
    salary: user?.salary || "",
    isActive: user?.isActive ?? true,
  });

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      if (isEdit) {
        await updateUserAPI(user._id, payload);
      } else {
        await createUserAPI(payload);
      }

      onSaved();
      toast.success(`Employee ${isEdit ? "updated" : "created"} successfully`);
    } catch (err) {
      toast.error("Failed to save employee");
    } finally {
      setLoading(false);
    }
  };

  // 📸 Select Image
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result);
    reader.readAsDataURL(file);
  };

  // ✂️ Crop Image
  const getCroppedImg = async (imageSrc, crop) => {
    const image = new Image();
    image.src = imageSrc;

    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg");
    });
  };

  // ⬆️ Upload Cropped Image
  const handleUploadCropped = async () => {
    if (!croppedAreaPixels) return;

    try {
      setUploading(true);

      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);

      const formData = new FormData();
      formData.append("profile", blob, "profile.jpg");

      const res = await uploadProfilePhotoAPI(user._id, formData);

      setPhoto(res.data.profilePicture);
      setImageSrc(null);

      toast.success("Photo uploaded");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const roleOptions =
    loggedInUser.role === "admin"
      ? ["employee", "hr", "intern", "admin"]
      : ["employee", "hr", "intern"];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>
          {isEdit ? "Edit Employee" : "Create Employee"}
        </h2>

        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {/* PHOTO SECTION */}
          <div className={styles.photoSection}>
            <div className={styles.photoWrapper}>
              {uploading && <div className={styles.loader}>Uploading...</div>}

              {photo?.url ? (
                <img src={photo.url} className={styles.avatarLarge} />
              ) : (
                <div className={styles.initialsLarge}>
                  {form.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
              )}
            </div>

            <label className={styles.uploadBtn}>
              Upload Photo
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handlePhotoSelect}
              />
            </label>
          </div>

          {/* CROP UI */}
          {imageSrc && (
            <>
              <div className={styles.cropContainer}>
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(area, pixels) =>
                    setCroppedAreaPixels(pixels)
                  }
                />
              </div>

              <button
                type="button"
                onClick={handleUploadCropped}
                className={styles.saveBtn}
              >
                {uploading ? "Uploading..." : "Crop & Upload"}
              </button>
            </>
          )}

          {/* REST SAME FORM (unchanged) */}
          {/* Name + Email */}
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Jethalal Gada"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Phone No:</label>
              <input
                type="tel"
                placeholder="9876543210"
                value={form.phone}
                maxLength={10}
                onChange={(e) => handleChange("phone", e.target.value)}
                required
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label>Work Email</label>
              <input
                type="email"
                placeholder="jetlalal@vidyadigitalstudio.in"
                value={form.email}
                disabled={isEdit}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Personal Email</label>
              <input
                type="email"
                placeholder="jethalalgada@gmail.com"
                value={form.personalEmail}
                onChange={(e) => handleChange("personalEmail", e.target.value)}
              />
            </div>
          </div>

          {/* Designation + Password */}
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label>Designation</label>
              <input
                type="text"
                placeholder="Owner"
                value={form.designation}
                onChange={(e) => handleChange("designation", e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                placeholder={
                  isEdit ? "Leave blank to keep password" : "Create password"
                }
                onChange={(e) => handleChange("password", e.target.value)}
                required={!isEdit}
              />
            </div>
          </div>

          {/* Joining Date + DOB */}
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label>Joining Date</label>
              <input
                type="date"
                value={form.joiningDate}
                onChange={(e) => handleChange("joiningDate", e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Date of Birth</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Contact + Personal Email */}
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label>Emergency Number</label>
              <input
                type="tel"
                placeholder="9876543210"
                value={form.contactNo}
                onChange={(e) => handleChange("contactNo", e.target.value)}
                maxLength={10}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Salary</label>
              <input
                type="number"
                placeholder="50000"
                value={form.salary}
                onChange={(e) => handleChange("salary", e.target.value)}
              />
            </div>
          </div>

          {/* Gender + Role */}
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label>Gender</label>
              <select
                value={form.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>Role</label>
              <select
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Address */}
          <div className={styles.formRow}>
            <div className={styles.inputGroupFull}>
              <label>Address</label>
              <textarea
                placeholder="Gokuldham Society,Powder gali East, Mumbai"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>
          </div>

          {/* Active */}
          <div className={styles.checkboxContainer}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => handleChange("isActive", e.target.checked)}
              />
              <span className={styles.slider}></span>
              <span className={styles.labelText}>Active</span>
            </label>
          </div>

          <div className={styles.actions}>
            <div className={styles.buttonGroup}>
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
