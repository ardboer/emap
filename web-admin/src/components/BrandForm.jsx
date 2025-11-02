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
      onboarding: {
        editorQuote: "",
        editorImage: "",
        editorName: "",
        editorJobTitle: "",
      },
      features: {
        enablePodcasts: false,
        enableClinical: false,
        enableEvents: false,
        enableAsk: false,
        enableMagazine: false,
      },
      podcastFeeds: [],
      misoConfig: {
        apiKey: "",
        publishableKey: "",
        brandFilter: "",
        baseUrl: "https://api.askmiso.com/v1",
      },
      trendingBlockListView: {
        enabled: true,
        position: 1,
        itemCount: 5,
      },
      relatedArticlesBlock: {
        enabled: true,
        afterParagraph: 3,
        itemCount: 5,
      },
      trendingArticlesDetail: {
        enabled: true,
        itemCount: 5,
      },
    }
  );
  const [logoFile, setLogoFile] = useState(null);
  const [logoHeaderFile, setLogoHeaderFile] = useState(null);
  const [logoHeaderDarkFile, setLogoHeaderDarkFile] = useState(null);
  const [editorImageFile, setEditorImageFile] = useState(null);
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

  // Update onboarding fields
  const updateOnboarding = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      onboarding: {
        ...prev.onboarding,
        [field]: value,
      },
    }));
  };

  // Update podcast feeds
  const updatePodcastFeed = (index, field, value) => {
    setConfig((prev) => {
      const feeds = [...(prev.podcastFeeds || [])];
      feeds[index] = { ...feeds[index], [field]: value };
      return { ...prev, podcastFeeds: feeds };
    });
  };

  const addPodcastFeed = () => {
    setConfig((prev) => ({
      ...prev,
      podcastFeeds: [...(prev.podcastFeeds || []), { name: "", url: "" }],
    }));
  };

  const removePodcastFeed = (index) => {
    setConfig((prev) => ({
      ...prev,
      podcastFeeds: (prev.podcastFeeds || []).filter((_, i) => i !== index),
    }));
  };

  // Update miso config
  const updateMisoConfig = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      misoConfig: {
        ...prev.misoConfig,
        [field]: value,
      },
    }));
  };

  // Update trending/related blocks
  const updateTrendingBlockListView = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      trendingBlockListView: {
        ...prev.trendingBlockListView,
        [field]: value,
      },
    }));
  };

  const updateRelatedArticlesBlock = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      relatedArticlesBlock: {
        ...prev.relatedArticlesBlock,
        [field]: value,
      },
    }));
  };

  const updateTrendingArticlesDetail = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      trendingArticlesDetail: {
        ...prev.trendingArticlesDetail,
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

      // Upload editor image if provided
      if (editorImageFile) {
        await brandApi.uploadAsset(
          formData.shortcode,
          "editor.jpg",
          editorImageFile
        );
        toast.success("Editor image uploaded successfully");
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

  const handleEditorImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        toast.error("Editor image must be a JPG or PNG file");
        return;
      }
      setEditorImageFile(file);
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
            className={`tab ${activeTab === "onboarding" ? "active" : ""}`}
            onClick={() => setActiveTab("onboarding")}
          >
            Onboarding
          </button>
          <button
            className={`tab ${activeTab === "features" ? "active" : ""}`}
            onClick={() => setActiveTab("features")}
          >
            Features
          </button>
          <button
            className={`tab ${activeTab === "podcasts" ? "active" : ""}`}
            onClick={() => setActiveTab("podcasts")}
          >
            Podcast Feeds
          </button>
          <button
            className={`tab ${activeTab === "miso" ? "active" : ""}`}
            onClick={() => setActiveTab("miso")}
          >
            Miso Config
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

                <div className="form-group">
                  <label className="form-label">Terms of Service URL</label>
                  <input
                    type="text"
                    className="form-input"
                    value={config.termsOfServiceUrl || ""}
                    onChange={(e) =>
                      updateConfig({ termsOfServiceUrl: e.target.value })
                    }
                    placeholder="e.g., https://www.nursingtimes.net/consents/terms-and-conditions/"
                  />
                  <div className="form-help">
                    URL to the brand&apos;s terms of service page
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Support Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={config.supportEmail || ""}
                    onChange={(e) =>
                      updateConfig({ supportEmail: e.target.value })
                    }
                    placeholder="e.g., support@example.com"
                  />
                  <div className="form-help">
                    Contact email for user support and inquiries
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

                  <div className="form-group">
                    <label className="form-label">Max Featured Articles</label>
                    <input
                      type="number"
                      className="form-input"
                      value={config.apiConfig?.maxNbOfItems || 10}
                      onChange={(e) =>
                        updateApiConfig(
                          "maxNbOfItems",
                          parseInt(e.target.value) || 10
                        )
                      }
                      min="1"
                      max="50"
                      placeholder="10"
                    />
                    <div className="form-help">
                      Maximum number of featured articles to display (default:
                      10)
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
            {activeTab === "onboarding" && (
              <>
                <div className="form-help" style={{ marginBottom: "1.5rem" }}>
                  Configure the onboarding experience for new users. This
                  includes the welcome screen with editor information.
                </div>

                <div className="form-group">
                  <label className="form-label">Editor Quote</label>
                  <textarea
                    className="form-input"
                    value={config.onboarding?.editorQuote || ""}
                    onChange={(e) =>
                      updateOnboarding("editorQuote", e.target.value)
                    }
                    placeholder="e.g., Welcome to the app, allowing you to take our content with you wherever you go."
                    rows={4}
                    style={{ resize: "vertical", minHeight: "100px" }}
                  />
                  <div className="form-help">
                    Welcome message shown on the first onboarding screen
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Editor Image</label>
                  <div
                    className="form-help"
                    style={{ marginBottom: "0.75rem" }}
                  >
                    <strong>Usage:</strong> Photo of the editor shown on welcome
                    screen
                    <br />
                    <strong>Format:</strong> JPG or PNG
                    <br />
                    <strong>Recommended:</strong> Square image, at least
                    400×400px
                    <br />
                    <strong>File name:</strong> Will be saved as editor.jpg
                  </div>
                  <div
                    className="file-upload"
                    onClick={() =>
                      document.getElementById("editor-image-input").click()
                    }
                  >
                    <input
                      id="editor-image-input"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleEditorImageChange}
                    />
                    <div className="file-upload-icon">📷</div>
                    <div className="file-upload-text">
                      {editorImageFile
                        ? editorImageFile.name
                        : "Click to upload editor image"}
                    </div>
                  </div>
                  {brand && (
                    <div className="asset-preview">
                      <img
                        src={`${brandApi.getAssetUrl(
                          brand.shortcode,
                          "editor.jpg"
                        )}?t=${Date.now()}`}
                        alt="Current editor"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <div className="asset-preview-info">
                        <div className="asset-preview-name">
                          Current Editor Image
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Editor Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={config.onboarding?.editorName || ""}
                    onChange={(e) =>
                      updateOnboarding("editorName", e.target.value)
                    }
                    placeholder="e.g., John Smith"
                  />
                  <div className="form-help">
                    Name of the editor displayed on the welcome screen
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Editor Job Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={config.onboarding?.editorJobTitle || ""}
                    onChange={(e) =>
                      updateOnboarding("editorJobTitle", e.target.value)
                    }
                    placeholder="e.g., Editor-in-Chief"
                  />
                  <div className="form-help">
                    Job title of the editor displayed on the welcome screen
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
                    Preview Information
                  </h4>
                  <p style={{ marginBottom: "0.5rem", color: "#6c757d" }}>
                    These settings control the welcome screen shown to new users
                    during their first app launch. The editor image and
                    information help personalize the onboarding experience.
                  </p>
                  <p style={{ marginBottom: 0, color: "#6c757d" }}>
                    <strong>Note:</strong> After uploading an editor image, you
                    may need to run the prebuild script to regenerate the editor
                    image registry for the mobile app.
                  </p>
                </div>
              </>
            )}

            {activeTab === "podcasts" && (
              <>
                <div className="form-help" style={{ marginBottom: "1.5rem" }}>
                  Configure podcast RSS feeds for this brand. These feeds will
                  be displayed in the Podcasts tab of the app.
                </div>

                {(config.podcastFeeds || []).map((feed, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "1rem",
                      marginBottom: "1rem",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "6px",
                      border: "1px solid #dee2e6",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1rem",
                      }}
                    >
                      <h4 style={{ margin: 0 }}>Podcast Feed {index + 1}</h4>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => removePodcastFeed(index)}
                        style={{
                          padding: "0.25rem 0.75rem",
                          fontSize: "0.875rem",
                        }}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Podcast Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={feed.name || ""}
                        onChange={(e) =>
                          updatePodcastFeed(index, "name", e.target.value)
                        }
                        placeholder="e.g., CN First Site"
                      />
                      <div className="form-help">
                        Display name for the podcast feed
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">RSS Feed URL</label>
                      <input
                        type="url"
                        className="form-input"
                        value={feed.url || ""}
                        onChange={(e) =>
                          updatePodcastFeed(index, "url", e.target.value)
                        }
                        placeholder="e.g., https://feed.podbean.com/cnfirstsite/feed.xml"
                      />
                      <div className="form-help">
                        Full URL to the podcast RSS feed
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={addPodcastFeed}
                  style={{ marginTop: "1rem" }}
                >
                  + Add Podcast Feed
                </button>
              </>
            )}

            {activeTab === "miso" && (
              <>
                <div className="form-help" style={{ marginBottom: "1.5rem" }}>
                  Configure Miso AI recommendations and content blocks for this
                  brand.
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">Miso API Configuration</h3>

                  <div className="form-group">
                    <label className="form-label">API Key</label>
                    <input
                      type="text"
                      className="form-input"
                      value={config.misoConfig?.apiKey || ""}
                      onChange={(e) =>
                        updateMisoConfig("apiKey", e.target.value)
                      }
                      placeholder="e.g., fAd2K3q1t6pw5SwzQcm0gPkHYvBpqFWkxBWwLvyL"
                    />
                    <div className="form-help">
                      Miso API key for authentication
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Publishable Key</label>
                    <input
                      type="text"
                      className="form-input"
                      value={config.misoConfig?.publishableKey || ""}
                      onChange={(e) =>
                        updateMisoConfig("publishableKey", e.target.value)
                      }
                      placeholder="e.g., VNMnQW8LlARMf8TPdZvtidWCi8EljMSbPFppPgJo"
                    />
                    <div className="form-help">
                      Miso publishable key for client-side requests
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Brand Filter</label>
                    <input
                      type="text"
                      className="form-input"
                      value={config.misoConfig?.brandFilter || ""}
                      onChange={(e) =>
                        updateMisoConfig("brandFilter", e.target.value)
                      }
                      placeholder="e.g., Nursing Times"
                    />
                    <div className="form-help">
                      Brand name used to filter Miso recommendations
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Base URL</label>
                    <input
                      type="url"
                      className="form-input"
                      value={
                        config.misoConfig?.baseUrl ||
                        "https://api.askmiso.com/v1"
                      }
                      onChange={(e) =>
                        updateMisoConfig("baseUrl", e.target.value)
                      }
                      placeholder="https://api.askmiso.com/v1"
                    />
                    <div className="form-help">Miso API base URL</div>
                  </div>
                </div>
                <div className="form-section">
                  <h3 className="form-section-title">
                    Highlights Recommendations
                  </h3>

                  <div className="form-group">
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="highlightsRecommendationsEnabled"
                        checked={
                          config.highlightsRecommendations?.enabled || false
                        }
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            highlightsRecommendations: {
                              ...prev.highlightsRecommendations,
                              enabled: e.target.checked,
                              misoItemCount:
                                prev.highlightsRecommendations?.misoItemCount ||
                                10,
                            },
                          }))
                        }
                      />
                      <label htmlFor="highlightsRecommendationsEnabled">
                        Enable Miso recommendations in highlights carousel
                      </label>
                    </div>
                    <div className="form-help">
                      When enabled, Miso recommendations will appear after
                      WordPress highlights
                    </div>
                  </div>

                  {config.highlightsRecommendations?.enabled && (
                    <div className="form-group">
                      <label className="form-label">Number of Miso Items</label>
                      <input
                        type="number"
                        className="form-input"
                        min="1"
                        max="50"
                        value={
                          config.highlightsRecommendations?.misoItemCount || 10
                        }
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            highlightsRecommendations: {
                              ...prev.highlightsRecommendations,
                              enabled:
                                prev.highlightsRecommendations?.enabled ||
                                false,
                              misoItemCount: parseInt(e.target.value) || 10,
                            },
                          }))
                        }
                        placeholder="10"
                      />
                      <div className="form-help">
                        Number of Miso recommended articles to show after
                        WordPress highlights (1-50)
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">
                    Trending Block (List View)
                  </h3>

                  <div className="form-group">
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="trendingBlockEnabled"
                        checked={config.trendingBlockListView?.enabled || false}
                        onChange={(e) =>
                          updateTrendingBlockListView(
                            "enabled",
                            e.target.checked
                          )
                        }
                      />
                      <label
                        htmlFor="trendingBlockEnabled"
                        style={{ cursor: "pointer", userSelect: "none" }}
                      >
                        Enable Trending Block in List View
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Position</label>
                    <input
                      type="number"
                      className="form-input"
                      value={config.trendingBlockListView?.position || 1}
                      onChange={(e) =>
                        updateTrendingBlockListView(
                          "position",
                          parseInt(e.target.value) || 1
                        )
                      }
                      min="1"
                      placeholder="1"
                    />
                    <div className="form-help">
                      Position in the article list (1 = first)
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Item Count</label>
                    <input
                      type="number"
                      className="form-input"
                      value={config.trendingBlockListView?.itemCount || 5}
                      onChange={(e) =>
                        updateTrendingBlockListView(
                          "itemCount",
                          parseInt(e.target.value) || 5
                        )
                      }
                      min="1"
                      max="20"
                      placeholder="5"
                    />
                    <div className="form-help">
                      Number of trending articles to display
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">Related Articles Block</h3>

                  <div className="form-group">
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="relatedArticlesEnabled"
                        checked={config.relatedArticlesBlock?.enabled || false}
                        onChange={(e) =>
                          updateRelatedArticlesBlock(
                            "enabled",
                            e.target.checked
                          )
                        }
                      />
                      <label
                        htmlFor="relatedArticlesEnabled"
                        style={{ cursor: "pointer", userSelect: "none" }}
                      >
                        Enable Related Articles Block
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">After Paragraph</label>
                    <input
                      type="number"
                      className="form-input"
                      value={config.relatedArticlesBlock?.afterParagraph || 3}
                      onChange={(e) =>
                        updateRelatedArticlesBlock(
                          "afterParagraph",
                          parseInt(e.target.value) || 3
                        )
                      }
                      min="1"
                      placeholder="3"
                    />
                    <div className="form-help">
                      Insert related articles after this paragraph number
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Item Count</label>
                    <input
                      type="number"
                      className="form-input"
                      value={config.relatedArticlesBlock?.itemCount || 5}
                      onChange={(e) =>
                        updateRelatedArticlesBlock(
                          "itemCount",
                          parseInt(e.target.value) || 5
                        )
                      }
                      min="1"
                      max="20"
                      placeholder="5"
                    />
                    <div className="form-help">
                      Number of related articles to display
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">
                    Trending Articles (Detail View)
                  </h3>

                  <div className="form-group">
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="trendingArticlesDetailEnabled"
                        checked={
                          config.trendingArticlesDetail?.enabled || false
                        }
                        onChange={(e) =>
                          updateTrendingArticlesDetail(
                            "enabled",
                            e.target.checked
                          )
                        }
                      />
                      <label
                        htmlFor="trendingArticlesDetailEnabled"
                        style={{ cursor: "pointer", userSelect: "none" }}
                      >
                        Enable Trending Articles in Detail View
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Item Count</label>
                    <input
                      type="number"
                      className="form-input"
                      value={config.trendingArticlesDetail?.itemCount || 5}
                      onChange={(e) =>
                        updateTrendingArticlesDetail(
                          "itemCount",
                          parseInt(e.target.value) || 5
                        )
                      }
                      min="1"
                      max="20"
                      placeholder="5"
                    />
                    <div className="form-help">
                      Number of trending articles to display at bottom of
                      article
                    </div>
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
