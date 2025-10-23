import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { brandApi } from "../services/api";
import ConfigEditor from "./ConfigEditor";

const BrandForm = ({ brand, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [availableFonts, setAvailableFonts] = useState(["System"]);
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
  const [logoHeaderFile, setLogoHeaderFile] = useState(null);
  const [logoHeaderDarkFile, setLogoHeaderDarkFile] = useState(null);
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

  // Fetch available fonts on mount
  useEffect(() => {
    const fetchFonts = async () => {
      try {
        const fonts = await brandApi.getAvailableFonts();
        setAvailableFonts(fonts);
      } catch (error) {
        console.error("Error fetching fonts:", error);
        // Keep default System font if fetch fails
      }
    };
    fetchFonts();
  }, []);

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

  // Update fonts
  const updateFont = (fontType, value) => {
    setConfig((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        fonts: {
          ...prev.theme?.fonts,
          [fontType]: value,
        },
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

      // Upload header logo if provided
      if (logoHeaderFile) {
        await brandApi.uploadAsset(
          formData.shortcode,
          "logo-header.svg",
          logoHeaderFile
        );
        toast.success("Header logo uploaded successfully");
      }

      // Upload header dark logo if provided
      if (logoHeaderDarkFile) {
        await brandApi.uploadAsset(
          formData.shortcode,
          "logo-header-dark.svg",
          logoHeaderDarkFile
        );
        toast.success("Header dark logo uploaded successfully");
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

  const handleLogoHeaderChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith(".svg")) {
        toast.error("Header logo must be an SVG file");
        return;
      }
      setLogoHeaderFile(file);
    }
  };

  const handleLogoHeaderDarkChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith(".svg")) {
        toast.error("Header dark logo must be an SVG file");
        return;
      }
      setLogoHeaderDarkFile(file);
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
            Colours
          </button>
          <button
            className={`tab ${activeTab === "fonts" ? "active" : ""}`}
            onClick={() => setActiveTab("fonts")}
          >
            Fonts
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

            {activeTab === "fonts" && (
              <>
                <div className="form-help" style={{ marginBottom: "1.5rem" }}>
                  Configure custom fonts for this brand. Fonts must be added to
                  the <code>assets/fonts/</code> directory first. Use
                  &quot;System&quot; for the default platform font.
                </div>

                <div className="form-group">
                  <label className="form-label">Primary Font</label>
                  <select
                    className="form-input"
                    value={config.theme?.fonts?.primary || "System"}
                    onChange={(e) => updateFont("primary", e.target.value)}
                  >
                    {availableFonts.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                  <div className="form-help">
                    Main font used throughout the app for all text elements
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Secondary Font</label>
                  <select
                    className="form-input"
                    value={config.theme?.fonts?.secondary || "System"}
                    onChange={(e) => updateFont("secondary", e.target.value)}
                  >
                    {availableFonts.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                  <div className="form-help">
                    Optional secondary font (currently not used in the app)
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "2rem",
                    padding: "1rem",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "6px",
                    border: "1px solid #dee2e6",
                  }}
                >
                  <h4 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
                    Available Fonts
                  </h4>
                  <ul style={{ marginBottom: 0, paddingLeft: "1.5rem" }}>
                    {availableFonts.map((font) => (
                      <li key={font} style={{ marginBottom: "0.25rem" }}>
                        <strong>{font}</strong>
                        {font === "System" && " (Platform default)"}
                      </li>
                    ))}
                  </ul>
                  <div
                    className="form-help"
                    style={{ marginTop: "1rem", marginBottom: 0 }}
                  >
                    To add more fonts, place .ttf or .otf files in the{" "}
                    <code>assets/fonts/</code> directory and restart the server.
                  </div>
                </div>
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

                <div className="form-group">
                  <label className="form-label">
                    Header Logo (SVG) - Optional
                  </label>
                  <div
                    className="form-help"
                    style={{ marginBottom: "0.75rem" }}
                  >
                    <strong>Usage:</strong> Alternative logo for tab headers and
                    navigation
                    <br />
                    <strong>Format:</strong> SVG (Scalable Vector Graphics)
                    <br />
                    <strong>Recommended:</strong> Horizontal layout optimized
                    for headers
                    <br />
                    <strong>Fallback:</strong> Uses main logo if not provided
                  </div>
                  <div
                    className="file-upload"
                    onClick={() =>
                      document.getElementById("logo-header-input").click()
                    }
                  >
                    <input
                      id="logo-header-input"
                      type="file"
                      accept=".svg"
                      onChange={handleLogoHeaderChange}
                    />
                    <div className="file-upload-icon">📁</div>
                    <div className="file-upload-text">
                      {logoHeaderFile
                        ? logoHeaderFile.name
                        : "Click to upload logo-header.svg"}
                    </div>
                  </div>
                  {brand && (
                    <div className="asset-preview">
                      <img
                        src={`${brandApi
                          .getLogoUrl(brand.shortcode)
                          .replace(
                            "logo.svg",
                            "logo-header.svg"
                          )}?t=${Date.now()}`}
                        alt="Current header logo"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <div className="asset-preview-info">
                        <div className="asset-preview-name">
                          Current Header Logo
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Header Logo Dark Mode (SVG) - Optional
                  </label>
                  <div
                    className="form-help"
                    style={{ marginBottom: "0.75rem" }}
                  >
                    <strong>Usage:</strong> Header logo for dark mode
                    <br />
                    <strong>Format:</strong> SVG (Scalable Vector Graphics)
                    <br />
                    <strong>Recommended:</strong> Light-colored version for dark
                    backgrounds
                    <br />
                    <strong>Fallback:</strong> Uses header logo or main logo if
                    not provided
                  </div>
                  <div
                    className="file-upload"
                    onClick={() =>
                      document.getElementById("logo-header-dark-input").click()
                    }
                  >
                    <input
                      id="logo-header-dark-input"
                      type="file"
                      accept=".svg"
                      onChange={handleLogoHeaderDarkChange}
                    />
                    <div className="file-upload-icon">📁</div>
                    <div className="file-upload-text">
                      {logoHeaderDarkFile
                        ? logoHeaderDarkFile.name
                        : "Click to upload logo-header-dark.svg"}
                    </div>
                  </div>
                  {brand && (
                    <div className="asset-preview">
                      <img
                        src={`${brandApi
                          .getLogoUrl(brand.shortcode)
                          .replace(
                            "logo.svg",
                            "logo-header-dark.svg"
                          )}?t=${Date.now()}`}
                        alt="Current header dark logo"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <div className="asset-preview-info">
                        <div className="asset-preview-name">
                          Current Header Dark Logo
                        </div>
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
