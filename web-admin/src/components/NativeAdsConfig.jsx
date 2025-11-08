const NativeAdsConfig = ({
  config,
  updateNativeAds,
  updateNativeAdsCarousel,
  updateNativeAdsListView,
  updateNativeAdsListViewView,
  updateNativeAdsAdUnitIdsNested,
}) => {
  const hasAdvancedStructure =
    config.nativeAds?.carousel || config.nativeAds?.listView;

  return (
    <div className="form-section" style={{ marginTop: "2rem" }}>
      <h3 className="form-section-title">Native Ads Configuration</h3>

      <div className="form-group">
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="nativeAdsEnabled"
            checked={config.nativeAds?.enabled || false}
            onChange={(e) => updateNativeAds("enabled", e.target.checked)}
          />
          <label
            htmlFor="nativeAdsEnabled"
            style={{ cursor: "pointer", userSelect: "none" }}
          >
            Enable Native Ads
          </label>
        </div>
        <div className="form-help">
          Master switch for all native ads throughout the app
        </div>
      </div>

      {config.nativeAds?.enabled && (
        <>
          <div className="form-group">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="nativeAdsTestMode"
                checked={config.nativeAds?.testMode || false}
                onChange={(e) => updateNativeAds("testMode", e.target.checked)}
              />
              <label
                htmlFor="nativeAdsTestMode"
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                Test Mode
              </label>
            </div>
            <div className="form-help">
              Use Google test ad units for testing (recommended during
              development)
            </div>
          </div>

          {/* Carousel Configuration */}
          <div style={{ marginTop: "2rem", marginBottom: "1rem" }}>
            <h4 style={{ color: "#2c3e50" }}>Carousel Ads (Highlights)</h4>
          </div>

          <div className="form-group">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="nativeAdsCarouselEnabled"
                checked={config.nativeAds?.carousel?.enabled || false}
                onChange={(e) =>
                  updateNativeAdsCarousel("enabled", e.target.checked)
                }
              />
              <label
                htmlFor="nativeAdsCarouselEnabled"
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                Enable Carousel Ads
              </label>
            </div>
          </div>

          {config.nativeAds?.carousel?.enabled && (
            <>
              <div className="form-group">
                <label className="form-label">First Ad Position</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="20"
                  value={config.nativeAds?.carousel?.firstAdPosition || 2}
                  onChange={(e) =>
                    updateNativeAdsCarousel(
                      "firstAdPosition",
                      parseInt(e.target.value) || 2
                    )
                  }
                  placeholder="2"
                />
                <div className="form-help">
                  Position of the first ad in carousel (e.g., 2 = after 2
                  articles)
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ad Interval</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="20"
                  value={config.nativeAds?.carousel?.adInterval || 5}
                  onChange={(e) =>
                    updateNativeAdsCarousel(
                      "adInterval",
                      parseInt(e.target.value) || 5
                    )
                  }
                  placeholder="5"
                />
                <div className="form-help">Show ad after every N articles</div>
              </div>

              <div className="form-group">
                <label className="form-label">Preload Distance</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  max="10"
                  value={config.nativeAds?.carousel?.preloadDistance || 1}
                  onChange={(e) =>
                    updateNativeAdsCarousel(
                      "preloadDistance",
                      parseInt(e.target.value) || 1
                    )
                  }
                  placeholder="1"
                />
                <div className="form-help">
                  Number of positions ahead to preload ads
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Unload Distance</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  max="10"
                  value={config.nativeAds?.carousel?.unloadDistance || 3}
                  onChange={(e) =>
                    updateNativeAdsCarousel(
                      "unloadDistance",
                      parseInt(e.target.value) || 3
                    )
                  }
                  placeholder="3"
                />
                <div className="form-help">
                  Number of positions away to unload ads
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Max Cached Ads</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="10"
                  value={config.nativeAds?.carousel?.maxCachedAds || 3}
                  onChange={(e) =>
                    updateNativeAdsCarousel(
                      "maxCachedAds",
                      parseInt(e.target.value) || 3
                    )
                  }
                  placeholder="3"
                />
                <div className="form-help">
                  Maximum number of ads to keep in memory
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Max Ads Per Session</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={config.nativeAds?.carousel?.maxAdsPerSession || ""}
                  onChange={(e) =>
                    updateNativeAdsCarousel(
                      "maxAdsPerSession",
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  placeholder="Leave empty for unlimited"
                />
                <div className="form-help">
                  Maximum ads per user session (empty = unlimited)
                </div>
              </div>

              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="carouselShowLoadingIndicator"
                    checked={
                      config.nativeAds?.carousel?.showLoadingIndicator || false
                    }
                    onChange={(e) =>
                      updateNativeAdsCarousel(
                        "showLoadingIndicator",
                        e.target.checked
                      )
                    }
                  />
                  <label
                    htmlFor="carouselShowLoadingIndicator"
                    style={{ cursor: "pointer", userSelect: "none" }}
                  >
                    Show Loading Indicator
                  </label>
                </div>
              </div>

              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="carouselSkipIfNotReady"
                    checked={
                      config.nativeAds?.carousel?.skipIfNotReady === false
                    }
                    onChange={(e) =>
                      updateNativeAdsCarousel(
                        "skipIfNotReady",
                        !e.target.checked
                      )
                    }
                  />
                  <label
                    htmlFor="carouselSkipIfNotReady"
                    style={{ cursor: "pointer", userSelect: "none" }}
                  >
                    Wait For Ad (Don&apos;t Skip)
                  </label>
                </div>
                <div className="form-help">
                  When checked, carousel will wait for ad to load instead of
                  skipping
                </div>
              </div>
            </>
          )}

          {/* List View Configuration */}
          <div style={{ marginTop: "2rem", marginBottom: "1rem" }}>
            <h4 style={{ color: "#2c3e50" }}>List View Ads</h4>
          </div>

          <div className="form-group">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="nativeAdsListViewEnabled"
                checked={config.nativeAds?.listView?.enabled || false}
                onChange={(e) =>
                  updateNativeAdsListView("enabled", e.target.checked)
                }
              />
              <label
                htmlFor="nativeAdsListViewEnabled"
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                Enable List View Ads
              </label>
            </div>
          </div>

          {config.nativeAds?.listView?.enabled && (
            <>
              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="listViewPreloadAds"
                    checked={config.nativeAds?.listView?.preloadAds !== false}
                    onChange={(e) =>
                      updateNativeAdsListView("preloadAds", e.target.checked)
                    }
                  />
                  <label
                    htmlFor="listViewPreloadAds"
                    style={{ cursor: "pointer", userSelect: "none" }}
                  >
                    Preload Ads
                  </label>
                </div>
              </div>

              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="listViewShowLoadingIndicator"
                    checked={
                      config.nativeAds?.listView?.showLoadingIndicator || false
                    }
                    onChange={(e) =>
                      updateNativeAdsListView(
                        "showLoadingIndicator",
                        e.target.checked
                      )
                    }
                  />
                  <label
                    htmlFor="listViewShowLoadingIndicator"
                    style={{ cursor: "pointer", userSelect: "none" }}
                  >
                    Show Loading Indicator
                  </label>
                </div>
              </div>

              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="listViewSkipIfNotReady"
                    checked={
                      config.nativeAds?.listView?.skipIfNotReady !== false
                    }
                    onChange={(e) =>
                      updateNativeAdsListView(
                        "skipIfNotReady",
                        e.target.checked
                      )
                    }
                  />
                  <label
                    htmlFor="listViewSkipIfNotReady"
                    style={{ cursor: "pointer", userSelect: "none" }}
                  >
                    Skip If Not Ready
                  </label>
                </div>
              </div>

              {/* View-specific configurations */}
              {["news", "clinical", "events", "trending"].map((viewName) => (
                <div
                  key={viewName}
                  style={{
                    marginTop: "1.5rem",
                    padding: "1rem",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "6px",
                    border: "1px solid #dee2e6",
                  }}
                >
                  <h5
                    style={{
                      marginTop: 0,
                      marginBottom: "1rem",
                      textTransform: "capitalize",
                    }}
                  >
                    {viewName} View
                  </h5>

                  <div className="form-group">
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id={`listView${viewName}Enabled`}
                        checked={
                          config.nativeAds?.listView?.views?.[viewName]
                            ?.enabled || false
                        }
                        onChange={(e) =>
                          updateNativeAdsListViewView(
                            viewName,
                            "enabled",
                            e.target.checked
                          )
                        }
                      />
                      <label
                        htmlFor={`listView${viewName}Enabled`}
                        style={{ cursor: "pointer", userSelect: "none" }}
                      >
                        Enable ads in {viewName} view
                      </label>
                    </div>
                  </div>

                  {config.nativeAds?.listView?.views?.[viewName]?.enabled && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Ad Positions</label>
                        <input
                          type="text"
                          className="form-input"
                          value={(
                            config.nativeAds?.listView?.views?.[viewName]
                              ?.positions || []
                          ).join(", ")}
                          onChange={(e) =>
                            updateNativeAdsListViewView(
                              viewName,
                              "positions",
                              e.target.value
                                .split(",")
                                .map((p) => parseInt(p.trim()))
                                .filter((p) => !isNaN(p))
                            )
                          }
                          placeholder="e.g., 3, 8, 15, 22"
                        />
                        <div className="form-help">
                          Comma-separated list of positions where ads should
                          appear
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Max Ads Per List</label>
                        <input
                          type="number"
                          className="form-input"
                          min="0"
                          max="20"
                          value={
                            config.nativeAds?.listView?.views?.[viewName]
                              ?.maxAdsPerList || 0
                          }
                          onChange={(e) =>
                            updateNativeAdsListViewView(
                              viewName,
                              "maxAdsPerList",
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder="4"
                        />
                      </div>

                      {viewName === "news" && (
                        <>
                          <div className="form-group">
                            <label className="form-label">
                              Block Positions
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              value={(
                                config.nativeAds?.listView?.views?.news
                                  ?.blockPositions || []
                              ).join(", ")}
                              onChange={(e) =>
                                updateNativeAdsListViewView(
                                  "news",
                                  "blockPositions",
                                  e.target.value
                                    .split(",")
                                    .map((p) => parseInt(p.trim()))
                                    .filter((p) => !isNaN(p))
                                )
                              }
                              placeholder="e.g., 1, 3"
                            />
                            <div className="form-help">
                              Block positions for news view
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="form-label">
                              Max Ads Per Block
                            </label>
                            <input
                              type="number"
                              className="form-input"
                              min="0"
                              max="10"
                              value={
                                config.nativeAds?.listView?.views?.news
                                  ?.maxAdsPerBlock || 0
                              }
                              onChange={(e) =>
                                updateNativeAdsListViewView(
                                  "news",
                                  "maxAdsPerBlock",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              placeholder="2"
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Ad Unit IDs */}
          <div style={{ marginTop: "2rem" }}>
            <h4 style={{ marginBottom: "1rem", color: "#2c3e50" }}>
              Native Ad Unit IDs
            </h4>
            <div className="form-help" style={{ marginBottom: "1rem" }}>
              {config.nativeAds?.testMode
                ? "Test mode is enabled - these IDs will be ignored and Google test units will be used"
                : "Production native ad unit IDs from Google AdMob"}
            </div>

            {hasAdvancedStructure && (
              <>
                <div style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>
                  <strong>Carousel Ad Units</strong>
                </div>
                <div className="form-group">
                  <label className="form-label">iOS Carousel Ad Unit ID</label>
                  <input
                    type="text"
                    className="form-input"
                    value={config.nativeAds?.adUnitIds?.carousel?.ios || ""}
                    onChange={(e) =>
                      updateNativeAdsAdUnitIdsNested(
                        "carousel",
                        "ios",
                        e.target.value
                      )
                    }
                    placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY"
                    disabled={config.nativeAds?.testMode}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Android Carousel Ad Unit ID
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={config.nativeAds?.adUnitIds?.carousel?.android || ""}
                    onChange={(e) =>
                      updateNativeAdsAdUnitIdsNested(
                        "carousel",
                        "android",
                        e.target.value
                      )
                    }
                    placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ"
                    disabled={config.nativeAds?.testMode}
                  />
                </div>

                <div style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>
                  <strong>List View Ad Units</strong>
                </div>
                <div className="form-group">
                  <label className="form-label">iOS List View Ad Unit ID</label>
                  <input
                    type="text"
                    className="form-input"
                    value={config.nativeAds?.adUnitIds?.listView?.ios || ""}
                    onChange={(e) =>
                      updateNativeAdsAdUnitIdsNested(
                        "listView",
                        "ios",
                        e.target.value
                      )
                    }
                    placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY"
                    disabled={config.nativeAds?.testMode}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Android List View Ad Unit ID
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={config.nativeAds?.adUnitIds?.listView?.android || ""}
                    onChange={(e) =>
                      updateNativeAdsAdUnitIdsNested(
                        "listView",
                        "android",
                        e.target.value
                      )
                    }
                    placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ"
                    disabled={config.nativeAds?.testMode}
                  />
                </div>
              </>
            )}
          </div>
        </>
      )}

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
          Native Ads Configuration Notes
        </h4>
        <ul
          style={{ marginBottom: 0, paddingLeft: "1.5rem", lineHeight: "1.8" }}
        >
          <li>
            <strong>Carousel Ads:</strong> Full-screen ads in the highlights
            carousel
          </li>
          <li>
            <strong>List View Ads:</strong> Native ads integrated into article
            lists
          </li>
          <li>
            <strong>View-Specific:</strong> Configure ads separately for news,
            clinical, events, and trending views
          </li>
          <li>
            <strong>Positions:</strong> Specify exact positions where ads should
            appear in each view
          </li>
          <li>
            <strong>Test Mode:</strong> Always enable during development to use
            Google&apos;s test ad units
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NativeAdsConfig;
