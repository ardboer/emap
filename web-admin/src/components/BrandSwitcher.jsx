import { useState } from "react";
import { toast } from "react-toastify";
import { brandApi } from "../services/api";

const BrandSwitcher = ({ brands, activeBrand, onSwitch }) => {
  const [selectedBrand, setSelectedBrand] = useState(
    activeBrand?.shortcode || ""
  );
  const [runPrebuild, setRunPrebuild] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleSwitch = async () => {
    if (!selectedBrand) {
      toast.error("Please select a brand");
      return;
    }

    if (selectedBrand === activeBrand?.shortcode) {
      toast.info("This brand is already active");
      return;
    }

    setSwitching(true);
    try {
      await brandApi.switchBrand(selectedBrand, runPrebuild);
      toast.success(`Successfully switched to ${selectedBrand}`);
      onSwitch();
    } catch (error) {
      console.error("Error switching brand:", error);
      toast.error(
        "Failed to switch brand: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target.className === "modal-overlay" && onSwitch()}
    >
      <div className="modal">
        <div className="modal-header">
          <h2>Switch Active Brand</h2>
          <button className="modal-close" onClick={onSwitch}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Select Brand</label>
            <select
              className="form-select"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              disabled={switching}
            >
              <option value="">-- Select a brand --</option>
              {brands.map((brand) => (
                <option key={brand.shortcode} value={brand.shortcode}>
                  {brand.displayName || brand.name} ({brand.shortcode})
                  {brand.shortcode === activeBrand?.shortcode
                    ? " - ACTIVE"
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="runPrebuild"
                checked={runPrebuild}
                onChange={(e) => setRunPrebuild(e.target.checked)}
                disabled={switching}
              />
              <label htmlFor="runPrebuild">
                Run prebuild script after switching
              </label>
            </div>
            <div className="form-help">
              This will copy brand assets and update configuration files
            </div>
          </div>

          {activeBrand && (
            <div
              style={{
                padding: "1rem",
                background: "#f8f9fa",
                borderRadius: "8px",
                marginTop: "1rem",
              }}
            >
              <strong>Current Active Brand:</strong>{" "}
              {activeBrand.displayName || activeBrand.name} (
              {activeBrand.shortcode})
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onSwitch}
            disabled={switching}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSwitch}
            disabled={switching || !selectedBrand}
          >
            {switching ? "Switching..." : "Switch Brand"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandSwitcher;
