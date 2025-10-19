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
  const [checkingPush, setCheckingPush] = useState(null);
  const [pushStatus, setPushStatus] = useState({});
  const [pushModalBrand, setPushModalBrand] = useState(null);
  const [checkingKeystore, setCheckingKeystore] = useState(null);
  const [keystoreStatus, setKeystoreStatus] = useState({});

  // Load push credentials and keystore status on mount
  useEffect(() => {
    const loadStatuses = async () => {
      const pushStatuses = {};
      const keystoreStatuses = {};

      for (const brand of brands) {
        try {
          const pushStat = await brandApi.getPushCredentials(brand.shortcode);
          pushStatuses[brand.shortcode] = pushStat;
        } catch (error) {
          console.error(
            `Error loading push status for ${brand.shortcode}:`,
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

      setPushStatus(pushStatuses);
      setKeystoreStatus(keystoreStatuses);
    };

    if (brands.length > 0) {
      loadStatuses();
    }
  }, [brands]);

  const handleOpenPushModal = (brand, e) => {
    e.stopPropagation();
    setPushModalBrand(brand);
  };

  const handleClosePushModal = () => {
    setPushModalBrand(null);
  };

  const handleSetPushStatus = async (configured) => {
    if (!pushModalBrand) return;

    setCheckingPush(pushModalBrand.shortcode);

    try {
      const response = await brandApi.checkPushCredentials(
        pushModalBrand.shortcode,
        configured
      );
      setPushStatus((prev) => ({
        ...prev,
        [pushModalBrand.shortcode]: response,
      }));

      if (configured) {
        toast.success(
          `✓ Push credentials marked as configured for ${pushModalBrand.shortcode.toUpperCase()}`
        );
      } else {
        toast.info(
          `Push credentials marked as not configured for ${pushModalBrand.shortcode.toUpperCase()}`
        );
      }

      handleClosePushModal();
      // Refresh brands to get updated config
      onRefresh();
    } catch (error) {
      console.error("Error updating push credentials:", error);
      toast.error(
        "Failed to update push credentials: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setCheckingPush(null);
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

                {/* Push Credentials Status */}
                <div style={{ marginTop: "0.5rem" }}>
                  {pushStatus[brand.shortcode] ? (
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
                        backgroundColor: pushStatus[brand.shortcode].configured
                          ? "#d1fae5"
                          : "#fee2e2",
                        color: pushStatus[brand.shortcode].configured
                          ? "#065f46"
                          : "#991b1b",
                      }}
                    >
                      {pushStatus[brand.shortcode].configured ? "✓" : "✗"}
                      <span>
                        {pushStatus[brand.shortcode].configured
                          ? "Push Configured"
                          : "Push Not Configured"}
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
                      Push Status Unknown
                    </div>
                  )}

                  {/* Keystore Status */}
                  <div style={{ marginTop: "0.25rem" }}>
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
                  onClick={(e) => handleOpenPushModal(brand, e)}
                  disabled={checkingPush === brand.shortcode}
                  style={{
                    backgroundColor: "#10b981",
                    color: "white",
                  }}
                >
                  {checkingPush === brand.shortcode
                    ? "Updating..."
                    : "Set Push Status"}
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
      {/* Push Credentials Modal */}
      {pushModalBrand && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target.className === "modal-overlay" && handleClosePushModal()
          }
        >
          <div className="modal" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h2>🔔 Set Push Notification Status</h2>
              <button className="modal-close" onClick={handleClosePushModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: "1rem" }}>
                Brand:{" "}
                <strong>
                  {pushModalBrand.displayName || pushModalBrand.name}
                </strong>
              </p>
              <p style={{ marginBottom: "1rem", color: "#6b7280" }}>
                Bundle ID: <code>{pushModalBrand.bundleId}</code>
              </p>

              <div
                style={{
                  padding: "1rem",
                  background: "#f3f4f6",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                  fontSize: "0.875rem",
                }}
              >
                <p style={{ marginBottom: "0.5rem", fontWeight: "500" }}>
                  To verify push credentials:
                </p>
                <ol style={{ marginLeft: "1.25rem", marginBottom: "0" }}>
                  <li>
                    Run:{" "}
                    <code
                      style={{
                        background: "#e5e7eb",
                        padding: "0.125rem 0.25rem",
                        borderRadius: "3px",
                      }}
                    >
                      npx eas credentials -p ios
                    </code>
                  </li>
                  <li>Check if push notification key is configured</li>
                  <li>Set the status below based on your verification</li>
                </ol>
              </div>

              <p style={{ marginBottom: "1rem", fontWeight: "500" }}>
                Are push credentials configured for this brand?
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={handleClosePushModal}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleSetPushStatus(false)}
                disabled={checkingPush === pushModalBrand.shortcode}
                style={{ backgroundColor: "#ef4444" }}
              >
                {checkingPush === pushModalBrand.shortcode
                  ? "Updating..."
                  : "Not Configured"}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleSetPushStatus(true)}
                disabled={checkingPush === pushModalBrand.shortcode}
                style={{ backgroundColor: "#10b981" }}
              >
                {checkingPush === pushModalBrand.shortcode
                  ? "Updating..."
                  : "✓ Configured"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BrandList;
