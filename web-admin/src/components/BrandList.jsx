import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { brandApi } from "../services/api";

const BrandList = ({
  brands,
  activeBrand,
  onEdit,
  onDelete,
  onSwitch,
  onRefresh,
}) => {
  const [switching, setSwitching] = useState(null);
  const [deletingBrand, setDeletingBrand] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [firebaseStatus, setFirebaseStatus] = useState({});
  const [checkingFirebase, setCheckingFirebase] = useState(null);
  const [checkingKeystore, setCheckingKeystore] = useState(null);
  const [keystoreStatus, setKeystoreStatus] = useState({});

  // Load Firebase and keystore status on mount
  useEffect(() => {
    const loadStatuses = async () => {
      const firebaseStatuses = {};
      const keystoreStatuses = {};

      for (const brand of brands) {
        try {
          const firebaseStat = await brandApi.getFirebaseStatusForBrand(
            brand.shortcode
          );
          firebaseStatuses[brand.shortcode] = firebaseStat.firebase;
        } catch (error) {
          console.error(
            `Error loading Firebase status for ${brand.shortcode}:`,
            error
          );
        }

        try {
          const keystoreStat = await brandApi.getKeystoreStatus(
            brand.shortcode
          );
          keystoreStatuses[brand.shortcode] = keystoreStat;
        } catch (error) {
          console.error(
            `Error loading keystore status for ${brand.shortcode}:`,
            error
          );
        }
      }

      setFirebaseStatus(firebaseStatuses);
      setKeystoreStatus(keystoreStatuses);
    };

    if (brands.length > 0) {
      loadStatuses();
    }
  }, [brands]);

  const handleCheckFirebase = async (shortcode, e) => {
    e.stopPropagation();
    setCheckingFirebase(shortcode);

    try {
      const firebaseStat = await brandApi.getFirebaseStatusForBrand(shortcode);
      setFirebaseStatus((prev) => ({
        ...prev,
        [shortcode]: firebaseStat.firebase,
      }));

      const status = firebaseStat.firebase.overallStatus;
      if (status === "configured") {
        toast.success(
          `Firebase configured for ${shortcode.toUpperCase()} on both platforms`
        );
      } else if (status === "partially_configured") {
        toast.warning(
          `Firebase partially configured for ${shortcode.toUpperCase()}`
        );
      } else if (status === "misconfigured") {
        toast.error(`✗ Firebase misconfigured for ${shortcode.toUpperCase()}`);
      } else {
        toast.error(`✗ Firebase not configured for ${shortcode.toUpperCase()}`);
      }
    } catch (error) {
      console.error("Error checking Firebase:", error);
      toast.error(
        "Failed to check Firebase: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setCheckingFirebase(null);
    }
  };

  const handleCheckKeystore = async (shortcode, e) => {
    e.stopPropagation();
    setCheckingKeystore(shortcode);

    try {
      const status = await brandApi.checkKeystoreAlias(shortcode);
      setKeystoreStatus((prev) => ({
        ...prev,
        [shortcode]: status,
      }));

      if (status.configured) {
        toast.success(
          `✓ Keystore alias found for ${shortcode.toUpperCase()}: ${
            status.alias
          }`
        );
      } else {
        toast.warning(
          `⚠ No keystore alias found for ${shortcode.toUpperCase()}`
        );
      }

      // Refresh brands to get updated config
      onRefresh();
    } catch (error) {
      console.error("Error checking keystore:", error);
      toast.error(
        "Failed to check keystore: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setCheckingKeystore(null);
    }
  };

  const handleSwitch = async (shortcode) => {
    setSwitching(shortcode);
    try {
      await brandApi.switchBrand(shortcode, false);
      toast.success(`Successfully switched to ${shortcode.toUpperCase()}`);
      onRefresh();
    } catch (error) {
      console.error("Error switching brand:", error);
      toast.error(
        "Failed to switch brand: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setSwitching(null);
    }
  };

  const openDeleteModal = (brand) => {
    setDeletingBrand(brand);
    setDeleteConfirmation("");
  };

  const closeDeleteModal = () => {
    setDeletingBrand(null);
    setDeleteConfirmation("");
  };

  const handleDelete = async () => {
    if (!deletingBrand) return;

    if (deleteConfirmation !== deletingBrand.bundleId) {
      toast.error("Bundle ID does not match. Deletion cancelled.");
      return;
    }

    try {
      await brandApi.deleteBrand(deletingBrand.shortcode);
      toast.success(
        `Brand ${deletingBrand.shortcode.toUpperCase()} deleted successfully`
      );
      closeDeleteModal();
      onRefresh();
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast.error(
        "Failed to delete brand: " +
          (error.response?.data?.error || error.message)
      );
    }
  };

  if (!Array.isArray(brands) || brands.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📦</div>
        <h3>No Brands Yet</h3>
        <p>Get started by creating your first brand</p>
      </div>
    );
  }

  return (
    <>
      <div className="brand-grid">
        {brands.map((brand) => {
          const isActive = activeBrand?.shortcode === brand.shortcode;
          const logoUrl = brandApi.getLogoUrl(brand.shortcode);

          return (
            <div
              key={brand.shortcode}
              className={`brand-card ${isActive ? "active" : ""}`}
              onClick={() => !isActive && handleSwitch(brand.shortcode)}
              style={{ cursor: isActive ? "default" : "pointer" }}
            >
              <img
                src={logoUrl}
                alt={brand.name}
                className="brand-logo"
                onError={(e) => {
                  e.target.src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="24"%3E' +
                    brand.shortcode.toUpperCase() +
                    "%3C/text%3E%3C/svg%3E";
                }}
              />
              <div className="brand-info">
                <h3>{brand.displayName || brand.name}</h3>
                <span className="brand-shortcode">
                  {brand.shortcode.toUpperCase()}
                </span>
                <div className="brand-domain">{brand.domain}</div>
                {brand.bundleId && (
                  <div
                    className="brand-domain"
                    style={{
                      fontSize: "0.8125rem",
                      color: "#868e96",
                      marginTop: "0.25rem",
                    }}
                  >
                    {brand.bundleId}
                  </div>
                )}

                {/* Firebase Configuration Status */}
                <div style={{ marginTop: "0.5rem" }}>
                  {firebaseStatus[brand.shortcode] ? (
                    <div>
                      {/* iOS Firebase Status */}
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: 4,
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                          backgroundColor: firebaseStatus[brand.shortcode].ios
                            .configured
                            ? "#d1fae5"
                            : "#fee2e2",
                          color: firebaseStatus[brand.shortcode].ios.configured
                            ? "#065f46"
                            : "#991b1b",
                        }}
                        title={
                          firebaseStatus[brand.shortcode].ios.error ||
                          "iOS Firebase configuration"
                        }
                      >
                        {firebaseStatus[brand.shortcode].ios.configured
                          ? "✓"
                          : "✗"}
                        <span>
                          Firebase iOS:{" "}
                          {firebaseStatus[brand.shortcode].ios.configured
                            ? "Configured"
                            : "Not Configured"}
                        </span>
                      </div>
                      {/* Android Firebase Status */}
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: 4,
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                          backgroundColor: firebaseStatus[brand.shortcode]
                            .android.configured
                            ? "#d1fae5"
                            : "#fee2e2",
                          color: firebaseStatus[brand.shortcode].android
                            .configured
                            ? "#065f46"
                            : "#991b1b",
                        }}
                        title={
                          firebaseStatus[brand.shortcode].android.error ||
                          "Android Firebase configuration"
                        }
                      >
                        {firebaseStatus[brand.shortcode].android.configured
                          ? "✓"
                          : "✗"}
                        <span>
                          Firebase Android:{" "}
                          {firebaseStatus[brand.shortcode].android.configured
                            ? "Configured"
                            : "Not Configured"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        backgroundColor: "#f3f4f6",
                        color: "#6b7280",
                      }}
                    >
                      Firebase Status Unknown
                    </div>
                  )}

                  {/* Keystore Status */}
                  <div>
                    {keystoreStatus[brand.shortcode] ? (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: 8,
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                          backgroundColor: keystoreStatus[brand.shortcode]
                            .configured
                            ? "#d1fae5"
                            : "#fee2e2",
                          color: keystoreStatus[brand.shortcode].configured
                            ? "#065f46"
                            : "#991b1b",
                        }}
                      >
                        {keystoreStatus[brand.shortcode].configured ? "✓" : "✗"}
                        <span>
                          {keystoreStatus[brand.shortcode].configured
                            ? `Keystore: ${
                                keystoreStatus[brand.shortcode].alias
                              }`
                            : "Keystore Not Found"}
                        </span>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                          backgroundColor: "#f3f4f6",
                          color: "#6b7280",
                        }}
                      >
                        Keystore Status Unknown
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="brand-actions">
                <button
                  className="btn btn-secondary btn-small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(brand);
                  }}
                >
                  Edit
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={(e) => handleCheckFirebase(brand.shortcode, e)}
                  disabled={checkingFirebase === brand.shortcode}
                  style={{
                    backgroundColor: "#10b981",
                    color: "white",
                  }}
                >
                  {checkingFirebase === brand.shortcode
                    ? "Checking..."
                    : "Check Firebase"}
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={(e) => handleCheckKeystore(brand.shortcode, e)}
                  disabled={checkingKeystore === brand.shortcode}
                  style={{
                    backgroundColor: "#3b82f6",
                    color: "white",
                  }}
                >
                  {checkingKeystore === brand.shortcode
                    ? "Checking..."
                    : "Check Keystore"}
                </button>
                <button
                  className="btn btn-danger btn-small"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteModal(brand);
                  }}
                  disabled={isActive}
                >
                  Delete
                </button>
              </div>
              {switching === brand.shortcode && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(255, 255, 255, 0.9)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#667eea",
                  }}
                >
                  Switching...
                </div>
              )}
            </div>
          );
        })}
      </div>
      {deletingBrand && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target.className === "modal-overlay" && closeDeleteModal()
          }
        >
          <div className="modal" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h2>⚠️ Confirm Deletion</h2>
              <button className="modal-close" onClick={closeDeleteModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p
                style={{
                  marginBottom: "1rem",
                  color: "#dc2626",
                  fontWeight: "500",
                }}
              >
                You are about to permanently delete the brand:
              </p>
              <div
                style={{
                  padding: "1rem",
                  background: "#fef2f2",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                  border: "1px solid #fecaca",
                }}
              >
                <div
                  style={{
                    fontWeight: "600",
                    fontSize: "1.125rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  {deletingBrand.displayName || deletingBrand.name}
                </div>
                <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  Shortcode: {deletingBrand.shortcode}
                </div>
              </div>
              <p style={{ marginBottom: "1rem", fontWeight: "500" }}>
                To confirm, please type the Bundle ID below:
              </p>
              <div
                style={{
                  padding: "0.75rem",
                  background: "#f3f4f6",
                  borderRadius: "6px",
                  marginBottom: "1rem",
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                }}
              >
                {deletingBrand.bundleId}
              </div>
              <input
                type="text"
                className="form-input"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type the Bundle ID here"
                autoFocus
                style={{ fontFamily: "monospace" }}
              />
              {deleteConfirmation &&
                deleteConfirmation !== deletingBrand.bundleId && (
                  <div className="form-error" style={{ marginTop: "0.5rem" }}>
                    Bundle ID does not match
                  </div>
                )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDeleteModal}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleteConfirmation !== deletingBrand.bundleId}
                style={{
                  opacity:
                    deleteConfirmation !== deletingBrand.bundleId ? 0.5 : 1,
                }}
              >
                Delete Brand
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BrandList;
