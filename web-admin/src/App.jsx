import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BrandForm from "./components/BrandForm";
import BrandList from "./components/BrandList";
import BrandSwitcher from "./components/BrandSwitcher";
import NotificationManager from "./components/NotificationManager";
import { brandApi } from "./services/api";
import "./styles.css";

function App() {
  const [brands, setBrands] = useState([]);
  const [activeBrand, setActiveBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [showBrandSwitcher, setShowBrandSwitcher] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [activeTab, setActiveTab] = useState("brands"); // 'brands' or 'notifications'

  const fetchBrands = async () => {
    try {
      const [brandsResponse, activeResponse] = await Promise.all([
        brandApi.getAllBrands().catch(() => ({ success: true, data: [] })),
        brandApi.getActiveBrand().catch(() => ({ success: false, data: null })),
      ]);

      // Handle response format - check if data is wrapped in success/data structure
      const brandsData = brandsResponse?.data || brandsResponse || [];
      const activeData = activeResponse?.data || activeResponse || null;

      setBrands(Array.isArray(brandsData) ? brandsData : []);
      setActiveBrand(activeData);
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error(
        "Failed to load brands: " +
          (error.response?.data?.error || error.message)
      );
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleCreateBrand = () => {
    setEditingBrand(null);
    setShowBrandForm(true);
  };

  const handleEditBrand = (brand) => {
    setEditingBrand(brand);
    setShowBrandForm(true);
  };

  const handleCloseBrandForm = () => {
    setShowBrandForm(false);
    setEditingBrand(null);
  };

  const handleBrandFormSuccess = () => {
    fetchBrands();
  };

  const handleSwitchBrand = (shortcode) => {
    setShowBrandSwitcher(true);
  };

  const handleCloseBrandSwitcher = () => {
    setShowBrandSwitcher(false);
    fetchBrands();
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>EMAP App Development Dashboard</h1>
          {activeBrand && (
            <div className="active-brand-info">
              <div>
                <div className="active-brand-label">Active Brand:</div>
                <div className="active-brand-name">
                  {activeBrand.displayName || activeBrand.name}
                </div>
              </div>
              <button
                className="btn btn-small"
                style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
                onClick={() => setShowBrandSwitcher(true)}
              >
                Switch
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === "brands" ? "active" : ""}`}
          onClick={() => setActiveTab("brands")}
        >
          🏢 Brand Management
        </button>
        <button
          className={`tab-button ${
            activeTab === "notifications" ? "active" : ""
          }`}
          onClick={() => setActiveTab("notifications")}
        >
          📱 Push Notifications
        </button>
      </div>

      <div className="container">
        {activeTab === "brands" ? (
          <>
            <div className="actions-bar">
              <div>
                <h2 style={{ margin: 0, color: "#2c3e50" }}>
                  All Brands ({brands.length})
                </h2>
              </div>
              <button className="btn btn-primary" onClick={handleCreateBrand}>
                + Add New Brand
              </button>
            </div>

            <BrandList
              brands={brands}
              activeBrand={activeBrand}
              onEdit={handleEditBrand}
              onDelete={fetchBrands}
              onSwitch={handleSwitchBrand}
              onRefresh={fetchBrands}
            />

            {brands.length === 0 && (
              <div
                style={{
                  marginTop: "3rem",
                  padding: "2rem",
                  background: "white",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <h3 style={{ marginBottom: "1rem", color: "#2c3e50" }}>
                  Getting Started
                </h3>
                <ul style={{ lineHeight: "1.8", color: "#6c757d" }}>
                  <li>Click on a brand card to view its details</li>
                  <li>Use the "Edit" button to modify brand configuration</li>
                  <li>Use the "Switch" button to make a brand active</li>
                  <li>The active brand is highlighted with a blue border</li>
                  <li>Upload assets (logo, icons) in the brand form</li>
                  <li>Edit JSON configuration for advanced settings</li>
                </ul>
              </div>
            )}
          </>
        ) : (
          <NotificationManager />
        )}
      </div>

      {showBrandForm && (
        <BrandForm
          brand={editingBrand}
          onClose={handleCloseBrandForm}
          onSuccess={handleBrandFormSuccess}
        />
      )}

      {showBrandSwitcher && (
        <BrandSwitcher
          brands={brands}
          activeBrand={activeBrand}
          onSwitch={handleCloseBrandSwitcher}
        />
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default App;
