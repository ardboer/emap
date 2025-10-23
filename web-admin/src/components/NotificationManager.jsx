import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { brandApi, notificationApi } from "../services/api";

function NotificationManager() {
  const [brands, setBrands] = useState([]);
  const [currentBrand, setCurrentBrand] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    if (currentBrand) {
      loadArticles();
    }
  }, [currentBrand]);

  const loadBrands = async () => {
    try {
      const brandsData = await notificationApi.getBrands();
      setBrands(brandsData);
      if (brandsData.length > 0) {
        // Set default brand to "nt" if available, otherwise use first brand
        const defaultBrand = brandsData.find((b) => b.shortcode === "nt");
        setCurrentBrand(defaultBrand ? "nt" : brandsData[0].shortcode);
      }
    } catch (error) {
      console.error("Error loading brands:", error);
      toast.error(
        "Failed to load brands: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const loadArticles = async (search = "") => {
    if (!currentBrand) return;

    setLoading(true);
    try {
      const articlesData = await notificationApi.getArticles(
        currentBrand,
        20,
        search
      );
      setArticles(articlesData);
    } catch (error) {
      console.error("Error loading articles:", error);
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadArticles(searchTerm);
  };

  const handleClear = () => {
    setSearchTerm("");
    loadArticles();
  };

  const handleBrandChange = (e) => {
    setCurrentBrand(e.target.value);
    setSearchTerm("");
  };

  const handleSendClick = (article) => {
    setSelectedArticle(article);
    setShowConfirmModal(true);
  };

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  const handleConfirmSend = async () => {
    if (!selectedArticle) return;

    try {
      // Truncate title and body to meet validation requirements
      const title = truncateText(selectedArticle.title, 65);
      const body = truncateText(
        selectedArticle.excerpt || "New article available",
        240
      );

      await notificationApi.sendNotification({
        brand: currentBrand,
        title,
        body,
        articleId: selectedArticle.id,
      });

      toast.success("✓ Notification sent successfully!");
      setShowConfirmModal(false);
      setSelectedArticle(null);
    } catch (error) {
      console.error("Error sending notification:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message;
      const errorDetails = error.response?.data?.errors
        ? `: ${error.response.data.errors.join(", ")}`
        : "";
      toast.error(`Failed to send: ${errorMessage}${errorDetails}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getBrandColor = (brand) => {
    const colors = {
      cn: "#FFDD00",
      nt: "#00A3E0",
      jnl: "#FF6B6B",
    };
    return colors[brand] || "#667eea";
  };

  const getLogoUrl = () => {
    if (!currentBrand) return null;
    return brandApi.getLogoUrl(currentBrand);
  };

  const getBrandName = () => {
    const brand = brands.find((b) => b.shortcode === currentBrand);
    return brand?.displayName || brand?.name || currentBrand?.toUpperCase();
  };

  return (
    <div className="notification-manager">
      <div className="notification-header">
        <div className="notification-header-content">
          <div className="notification-title-section">
            <h2>📱 Push Notification Manager</h2>
            <p className="subtitle">Send push notifications to brand topics</p>
          </div>
          {currentBrand && (
            <div className="brand-logo-section">
              <img
                src={getLogoUrl()}
                alt={`${getBrandName()} logo`}
                className="brand-logo"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <span className="brand-name">{getBrandName()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="notification-controls">
        <div className="control-group">
          <label htmlFor="brandSelect">Brand</label>
          <select
            id="brandSelect"
            value={currentBrand || ""}
            onChange={handleBrandChange}
            className="form-select"
          >
            {brands.length === 0 ? (
              <option value="">Loading brands...</option>
            ) : (
              brands.map((brand) => (
                <option key={brand.shortcode} value={brand.shortcode}>
                  {brand.displayName || brand.name} (
                  {brand.shortcode.toUpperCase()})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="searchInput">Search Articles</label>
          <div className="search-box">
            <input
              type="text"
              id="searchInput"
              placeholder="Search by title or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="form-input"
            />
            <button onClick={handleSearch} className="btn btn-secondary">
              Search
            </button>
            <button onClick={handleClear} className="btn btn-secondary">
              Clear
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading articles...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="empty-state">
          <p>No articles found. Try a different search term.</p>
        </div>
      ) : (
        <div className="articles-grid">
          {articles.map((article) => (
            <div
              key={article.id}
              className="article-card"
              style={{ borderLeftColor: getBrandColor(currentBrand) }}
            >
              <h3 className="article-title">{article.title}</h3>
              <p className="article-excerpt">
                {article.excerpt || "No excerpt available"}
              </p>
              <div className="article-meta">
                <span className="article-id">ID: {article.id}</span>
                <span className="article-date">{formatDate(article.date)}</span>
              </div>
              <div className="article-actions">
                <button
                  onClick={() => handleSendClick(article)}
                  className="btn btn-success"
                >
                  📤 Send Notification
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showConfirmModal && selectedArticle && (
        <div
          className="modal-overlay"
          onClick={() => setShowConfirmModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Notification</h2>
            <div className="confirm-details">
              <p>
                <strong>Brand:</strong> {currentBrand?.toUpperCase()}
              </p>
              <p>
                <strong>Title:</strong> {selectedArticle.title}
              </p>
              <p>
                <strong>Body:</strong> {selectedArticle.excerpt || "No excerpt"}
              </p>
              <p>
                <strong>Article ID:</strong> {selectedArticle.id}
              </p>
              <p
                style={{
                  marginTop: "16px",
                  color: "#6c757d",
                  fontSize: "0.875rem",
                }}
              >
                This will send a push notification to all users subscribed to
                the &ldquo;{currentBrand}&rdquo; topic.
              </p>
            </div>
            <div className="modal-actions">
              <button onClick={handleConfirmSend} className="btn btn-primary">
                Send Notification
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationManager;
