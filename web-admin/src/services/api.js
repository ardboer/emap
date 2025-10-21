import axios from "axios";

const API_BASE_URL = "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Brand API
export const brandApi = {
  // Get all brands
  getAllBrands: async () => {
    const response = await api.get("/brands");
    return response.data.brands || [];
  },

  // Get active brand
  getActiveBrand: async () => {
    const response = await api.get("/system/active-brand");
    return response.data.activeBrand || null;
  },

  // Get brand by shortcode
  getBrand: async (shortcode) => {
    const response = await api.get(`/brands/${shortcode}`);
    return response.data;
  },

  // Create new brand
  createBrand: async (brandData) => {
    const response = await api.post("/brands", brandData);
    return response.data;
  },

  // Update brand
  updateBrand: async (shortcode, brandData) => {
    const response = await api.put(`/brands/${shortcode}`, brandData);
    return response.data;
  },

  // Delete brand
  deleteBrand: async (shortcode) => {
    const response = await api.delete(`/brands/${shortcode}`);
    return response.data;
  },

  // Switch active brand
  switchBrand: async (shortcode, runPrebuild = false) => {
    const response = await api.post("/system/switch-brand", {
      shortcode,
      runPrebuild,
    });
    return response.data;
  },

  // Upload logo
  uploadLogo: async (shortcode, file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", "logo.svg");
    const response = await api.post(`/brands/${shortcode}/assets`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Upload asset
  uploadAsset: async (shortcode, assetName, file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", assetName);
    const response = await api.post(`/brands/${shortcode}/assets`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Delete asset
  deleteAsset: async (shortcode, assetName) => {
    const response = await api.delete(
      `/brands/${shortcode}/assets/${assetName}`
    );
    return response.data;
  },

  // Get brand logo URL
  getLogoUrl: (shortcode) => {
    return `${API_BASE_URL}/brands/${shortcode}/assets/logo.svg`;
  },

  // Get asset URL
  getAssetUrl: (shortcode, assetName) => {
    return `${API_BASE_URL}/brands/${shortcode}/assets/${assetName}`;
  },

  // Get Firebase configuration status for all brands
  getFirebaseStatus: async () => {
    const response = await api.get(`/system/firebase-status`);
    return response.data;
  },

  // Get Firebase configuration status for a specific brand
  getFirebaseStatusForBrand: async (shortcode) => {
    const response = await api.get(`/system/firebase-status/${shortcode}`);
    return response.data;
  },

  // Get keystore status
  getKeystoreStatus: async (shortcode) => {
    const response = await api.get(`/system/keystore-status/${shortcode}`);
    return response.data.keystoreStatus;
  },

  // Check keystore alias (automatic verification)
  checkKeystoreAlias: async (shortcode) => {
    const response = await api.post(
      `/system/keystore-status/${shortcode}/check`
    );
    return response.data.keystoreStatus;
  },

  // Get available fonts
  getAvailableFonts: async () => {
    const response = await api.get("/system/available-fonts");
    return response.data.fonts || ["System"];
  },
};

export default api;
