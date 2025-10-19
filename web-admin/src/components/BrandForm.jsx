import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { brandApi } from "../services/api";
import ConfigEditor from "./ConfigEditor";

const BrandForm = ({ brand, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [config, setConfig] = useState(
    brand?.config || {
      shortcode: "",
      name: "",
      displayName: "",
      domain: "",
      bundleId: "",
      apiConfig: {
        baseUrl: "",
        hash: "",
        menuId: 0,
      },
      theme: {
        colors: {
          light: {
            primary: "#667eea",
            background: "#fff",
            text: "#11181C",
          },
          dark: {
            primary: "#667eea",
            background: "#151718",
            text: "#ECEDEE",
          },
        },
      },
      branding: {
        logo: "./logo.svg",
        icon: "./assets/icon.png",
        iconBackgroundColor: "#ffffff",
      },
      features: {
        enablePodcasts: false,
        enableClinical: false,
        enableEvents: false,
        enableAsk: false,
        enableMagazine: false,
      },
    }
  );
  const [logoFile, setLogoFile] = useState(null);
  const [assetFiles, setAssetFiles] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      shortcode: brand?.shortcode || "",
      name: brand?.name || "",
      displayName: brand?.displayName || "",
      domain: brand?.domain || "",
    },
  });

  useEffect(() => {
    if (brand) {
      setValue("shortcode", brand.shortcode);
      setValue("name", brand.name);
      setValue("displayName", brand.displayName);
      setValue("domain", brand.domain);
      setValue("bundleId", brand.bundleId);
      setConfig(brand);
    }
  }, [brand, setValue]);

  // Update config when form fields change
  const updateConfig = (updates) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  // Update theme colors
  const updateThemeColor = (mode, colorKey, value) => {
    setConfig((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        colors: {
          ...prev.theme.colors,
          [mode]: {
            ...prev.theme.colors[mode],
            [colorKey]: value,
          },
        },
      },
    }));
  };

  // Update features
  const updateFeature = (featureKey, value) => {
    setConfig((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [featureKey]: value,
      },
    }));
  };

  // Update apiConfig
  const updateApiConfig = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      apiConfig: {
        ...prev.apiConfig,
        [field]: value,
      },
    }));
  };

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      // Update config with form data
      const updatedConfig = {
        ...config,
        shortcode: formData.shortcode,
        name: formData.name,
        displayName: formData.displayName,
        domain: formData.domain,
        bundleId: formData.bundleId,
      };

      // Create or update brand
      if (brand) {
        await brandApi.updateBrand(brand.shortcode, updatedConfig);
        toast.success("Brand updated successfully");
      } else {
        await brandApi.createBrand(updatedConfig);
        toast.success("Brand created successfully");
      }

      // Upload logo if provided
      if (logoFile) {
        await brandApi.uploadLogo(formData.shortcode, logoFile);
        toast.success("Logo uploaded successfully");
      }

      // Upload assets if provided
      for (const [assetName, file] of Object.entries(assetFiles)) {
        if (file) {
          await brandApi.uploadAsset(formData.shortcode, assetName, file);
          toast.success(`${assetName} uploaded successfully`);
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving brand:", error);
      toast.error(
        "Failed to save brand: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith(".svg")) {
        toast.error("Logo must be an SVG file");
        return;
      }
      setLogoFile(file);
    }
  };

  const handleAssetChange = (assetName, e) => {
    const file = e.target.files[0];
    if (file) {
      setAssetFiles({ ...assetFiles, [assetName]: file });
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target.className === "modal-overlay" && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <h2>{brand ? "Edit Brand" : "Create New Brand"}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === "basic" ? "active" : ""}`}
            onClick={() => setActiveTab("basic")}
          >
            Basic Info
          </button>
          <button
            className={`tab ${activeTab === "theme" ? "active" : ""}`}
            onClick={() => setActiveTab("theme")}
          >
            Theme
          </button>
          <button
            className={`tab ${activeTab === "features" ? "active" : ""}`}
            onClick={() => setActiveTab("features")}
          >
            Features
          </button>
          <button
            className={`tab ${activeTab === "assets" ? "active" : ""}`}
            onClick={() => setActiveTab("assets")}
          >
            Assets
          </button>
          <button
            className={`tab ${activeTab === "config" ? "active" : ""}`}
            onClick={() => setActiveTab("config")}
          >
            JSON Config
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body">
            {activeTab === "basic" && (
              <>
                <div className="form-group">
                  <label className="form-label required">Shortcode</label>
                  <input
                    type="text"
                    className="form-input"
                    {...register("shortcode", {
                      required: "Shortcode is required",
                      pattern: {
                        value: /^[a-z0-9-]+$/,
                        message:
                          "Only lowercase letters, numbers, and hyphens allowed",
                      },
                    })}
                    disabled={!!brand}
                    placeholder="e.g., cn, nt, jnl"
                  />
                  {errors.shortcode && (
                    <div className="form-error">{errors.shortcode.message}</div>
                  )}
                  <div className="form-help">
                    Unique identifier for the brand (cannot be changed after
                    creation)
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label required">Name</label>
                  <input
                    type="text"
                    className="form-input"
                    {...register("name", { required: "Name is required" })}
                    placeholder="e.g., Construction News"
                  />
                  {errors.name && (
                    <div className="form-error">{errors.name.message}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label required">Display Name</label>
                  <input
                    type="text"
                    className="form-input"
                    {...register("displayName", {
                      required: "Display name is required",
                    })}
                    placeholder="e.g., Construction News"
                  />
                  {errors.displayName && (
                    <div className="form-error">
                      {errors.displayName.message}
                    </div>
                  )}
                  <div className="form-help">Name shown in the app</div>
                </div>

                <div className="form-group">
                  <label className="form-label required">Domain</label>
                  <input
                    type="text"
                    className="form-input"
                    {...register("domain", { required: "Domain is required" })}
                    placeholder="e.g., https://www.constructionnews.co.uk/"
                  />
                  {errors.domain && (
                    <div className="form-error">{errors.domain.message}</div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label required">Bundle ID</label>
                  <input
                    type="text"
                    className="form-input"
                    {...register("bundleId", {
                      required: "Bundle ID is required",
                    })}
                    placeholder="e.g., metropolis.co.uk.constructionnews"
                  />
                  {errors.bundleId && (
                    <div className="form-error">{errors.bundleId.message}</div>
                  )}
                  <div className="form-help">
                    Unique identifier for the mobile app bundle
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">API Configuration</h3>

                  <div className="form-group">
                    <label className="form-label required">Base URL</label>
                    <input
                      type="text"
                      className="form-input"
                      value={config.apiConfig?.baseUrl || ""}
                      onChange={(e) =>
                        updateApiConfig("baseUrl", e.target.value)
                      }
                      placeholder="e.g., https://www.constructionnews.co.uk"
                    />
                    <div className="form-help">
                      Base URL for the brand&apos;s API
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">API Hash</label>
                    <input
                      type="text"
                      className="form-input"
                      value={config.apiConfig?.hash || ""}
                      onChange={(e) => updateApiConfig("hash", e.target.value)}
                      placeholder="e.g., 5c159d9d79114126d3e27224180295"
                    />
                    <div className="form-help">
                      Authentication hash for API requests
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Menu ID</label>
                    <input
                      type="number"
                      className="form-input"
                      value={config.apiConfig?.menuId || 0}
                      onChange={(e) =>
                        updateApiConfig("menuId", parseInt(e.target.value) || 0)
                      }
                      placeholder="e.g., 103571"
                    />
                    <div className="form-help">
                      Menu identifier for the brand&apos;s navigation
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "theme" && (
              <>
                <h3 style={{ marginBottom: "1.5rem", color: "#2c3e50" }}>
                  Light Mode Colors
                </h3>
                {Object.entries(config.theme?.colors?.light || {}).map(
                  ([key, value]) => (
                    <div key={`light-${key}`} className="form-group">
                      <label className="form-label">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </label>
                      <div
                        style={{
                          display: "flex",
                          gap: "1rem",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="color"
                          value={value}
                          onChange={(e) =>
                            updateThemeColor("light", key, e.target.value)
                          }
                          style={{
                            width: "60px",
                            height: "40px",
                            border: "1px solid #ced4da",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                        />
                        <input
                          type="text"
                          className="form-input"
                          value={value}
                          onChange={(e) =>
                            updateThemeColor("light", key, e.target.value)
                          }
                          placeholder="#000000"
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>
                  )
                )}

                <h3
                  style={{
                    marginTop: "2rem",
                    marginBottom: "1.5rem",
                    color: "#2c3e50",
                  }}
                >
                  Dark Mode Colors
                </h3>
                {Object.entries(config.theme?.colors?.dark || {}).map(
                  ([key, value]) => (
                    <div key={`dark-${key}`} className="form-group">
                      <label className="form-label">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </label>
                      <div
                        style={{
                          display: "flex",
                          gap: "1rem",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="color"
                          value={value}
                          onChange={(e) =>
                            updateThemeColor("dark", key, e.target.value)
                          }
                          style={{
                            width: "60px",
                            height: "40px",
                            border: "1px solid #ced4da",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                        />
                        <input
                          type="text"
                          className="form-input"
                          value={value}
                          onChange={(e) =>
                            updateThemeColor("dark", key, e.target.value)
                          }
                          placeholder="#000000"
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>
                  )
                )}
              </>
            )}

            {activeTab === "features" && (
              <>
                <div className="form-help" style={{ marginBottom: "1.5rem" }}>
                  Enable or disable features for this brand
                </div>
                {Object.entries(config.features || {}).map(([key, value]) => (
                  <div key={key} className="form-group">
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id={key}
                        checked={value}
                        onChange={(e) => updateFeature(key, e.target.checked)}
                      />
                      <label
                        htmlFor={key}
                        style={{ cursor: "pointer", userSelect: "none" }}
                      >
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </label>
                    </div>
                  </div>
                ))}
              </>
            )}

            {activeTab === "config" && (
              <div className="form-group">
                <label className="form-label">Full Configuration (JSON)</label>
                <div className="form-help" style={{ marginBottom: "1rem" }}>
                  Edit the complete brand configuration. Changes here will
                  override basic info.
                </div>
                <ConfigEditor config={config} onChange={setConfig} />
              </div>
            )}

            {activeTab === "assets" && (
              <>
                <div className="form-group">
                  <label className="form-label">Logo (SVG)</label>
                  <div
                    className="form-help"
                    style={{ marginBottom: "0.75rem" }}
                  >
                    <strong>Usage:</strong> Brand logo displayed in the app
                    header and brand cards
                    <br />
                    <strong>Format:</strong> SVG (Scalable Vector Graphics)
                    <br />
                    <strong>Recommended:</strong> Simple, clean design that
                    works at any size
                  </div>
                  <div
                    className="file-upload"
                    onClick={() =>
                      document.getElementById("logo-input").click()
                    }
                  >
                    <input
                      id="logo-input"
                      type="file"
                      accept=".svg"
                      onChange={handleLogoChange}
                    />
                    <div className="file-upload-icon">📁</div>
                    <div className="file-upload-text">
                      {logoFile ? logoFile.name : "Click to upload logo.svg"}
                    </div>
                  </div>
                  {brand && (
                    <div className="asset-preview">
                      <img
                        src={brandApi.getLogoUrl(brand.shortcode)}
                        alt="Current logo"
                      />
                      <div className="asset-preview-info">
                        <div className="asset-preview-name">Current Logo</div>
                      </div>
                    </div>
                  )}
                </div>

                {[
                  {
                    name: "icon.png",
                    usage: "App icon on iOS and Android home screens",
                    dimensions: "1024×1024px",
                    format: "PNG with transparency",
                  },
                  {
                    name: "adaptive-icon.png",
                    usage: "Android adaptive icon (foreground layer)",
                    dimensions: "1024×1024px (safe zone: 768×768px center)",
                    format: "PNG with transparency",
                  },
                  {
                    name: "favicon.png",
                    usage: "Browser tab icon and PWA icon",
                    dimensions: "48×48px or 64×64px",
                    format: "PNG",
                  },
                  {
                    name: "splash-icon.png",
                    usage: "App splash screen logo",
                    dimensions: "1024×1024px",
                    format: "PNG with transparency",
                  },
                ].map((asset) => (
                  <div key={asset.name} className="form-group">
                    <label className="form-label">{asset.name}</label>
                    <div
                      className="form-help"
                      style={{ marginBottom: "0.75rem" }}
                    >
                      <strong>Usage:</strong> {asset.usage}
                      <br />
                      <strong>Dimensions:</strong> {asset.dimensions}
                      <br />
                      <strong>Format:</strong> {asset.format}
                    </div>
                    <div
                      className="file-upload"
                      onClick={() =>
                        document.getElementById(`asset-${asset.name}`).click()
                      }
                    >
                      <input
                        id={`asset-${asset.name}`}
                        type="file"
                        accept="image/png"
                        onChange={(e) => handleAssetChange(asset.name, e)}
                      />
                      <div className="file-upload-icon">🖼️</div>
                      <div className="file-upload-text">
                        {assetFiles[asset.name]
                          ? assetFiles[asset.name].name
                          : `Click to upload ${asset.name}`}
                      </div>
                    </div>
                    {brand && (
                      <div className="asset-preview">
                        <img
                          src={brandApi.getAssetUrl(
                            brand.shortcode,
                            asset.name
                          )}
                          alt={asset.name}
                          onError={(e) => (e.target.style.display = "none")}
                        />
                        <div className="asset-preview-info">
                          <div className="asset-preview-name">
                            Current {asset.name}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : brand
                ? "Update Brand"
                : "Create Brand"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrandForm;
