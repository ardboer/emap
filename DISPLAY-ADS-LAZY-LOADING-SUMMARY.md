# Display Banner Ads Lazy Loading - Implementation Summary

## Executive Summary

This document outlines the implementation plan for lazy loading display banner ads to improve viewability metrics. Ads will load 250px before entering the viewport, prioritizing smooth scrolling performance while loading ads one at a time.

## Problem Statement

**Current Behavior:**

- Display banner ads load immediately when components mount
- All ads in the initial render load simultaneously
- No viewport detection or lazy loading
- Potential memory overhead with multiple ads
- Ads may load but never be viewed

**Impact:**

- Lower viewability rates (ads loaded but not seen)
- Unnecessary memory usage
- Potential performance impact on initial load
- Wasted ad impressions

## Solution Overview

Implement lazy loading for display banner ads using a viewport detection system that:

- Loads ads 250px before they enter the viewport
- Loads ads one at a time as users scroll
- Prioritizes smooth scrolling experience
- Tracks viewability metrics via analytics
- Maintains consistent UX with loading indicators

## Key Requirements

### User-Specified Requirements

1. **Threshold**: 250px before viewport
2. **Library**: Use `react-native-component-inview` (with custom hook fallback)
3. **Strategy**: Load ads one at a time
4. **Priority**: Smooth scrolling over aggressive preloading

### Technical Requirements

1. Viewport detection with 250px threshold
2. State management for ad loading lifecycle
3. Analytics integration for viewability tracking
4. Backward compatibility with existing ad system
5. Support for both article detail and list view contexts

## Architecture Overview

### Component Hierarchy

```
ScrollView/FlatList
  └── DisplayAd (with lazy loading)
      ├── useInView Hook (viewport detection)
      ├── displayAdLazyLoadManager (state management)
      └── BannerAd (conditional rendering)
          └── GoogleBannerAd (actual ad)
```

### Key Components

#### 1. useInView Hook

- **Purpose**: Detect when component approaches viewport
- **Threshold**: 250px before visible
- **Features**: Position tracking, scroll monitoring, callbacks

#### 2. displayAdLazyLoadManager Service

- **Purpose**: Manage ad loading state and lifecycle
- **Features**:
  - Track loading/loaded/viewed states
  - Prevent duplicate loads
  - Analytics integration
  - Viewability metrics

#### 3. DisplayAd Component (Updated)

- **New Features**:
  - Lazy loading support
  - Viewport detection integration
  - Loading placeholders
  - State management

#### 4. AdPlaceholder Component (New)

- **Purpose**: Show placeholder while ad loads
- **Features**: Match ad dimensions, prevent layout shift

## Implementation Phases

### Phase 1: Foundation (Week 1)

- [ ] Research `react-native-component-inview` compatibility
- [ ] Create `useInView` hook (custom or library-based)
- [ ] Create `displayAdLazyLoadManager` service
- [ ] Create `AdPlaceholder` component
- [ ] Update type definitions

### Phase 2: Core Components (Week 1-2)

- [ ] Update `DisplayAd` component with lazy loading
- [ ] Update `BannerAd` component (if needed)
- [ ] Add analytics integration
- [ ] Implement loading states

### Phase 3: Integration (Week 2)

- [ ] Integrate into article detail (after-lead ad)
- [ ] Integrate into `RichContentRenderer` (in-content ads)
- [ ] Integrate into list views (news, clinical tabs)
- [ ] Update brand configurations

### Phase 4: Testing & Documentation (Week 3)

- [ ] Unit tests for hook and service
- [ ] Integration tests for components
- [ ] Manual testing (scroll patterns, performance)
- [ ] Create user documentation
- [ ] Performance benchmarking

### Phase 5: Rollout (Week 4)

- [ ] Deploy to staging
- [ ] Monitor metrics
- [ ] Gradual production rollout (10% → 50% → 100%)
- [ ] Post-deployment monitoring

## Expected Benefits

### Performance Improvements

- **Memory Usage**: 50-60% reduction (only 1-2 ads loaded vs 4-5)
- **Initial Load**: Faster page render (ads load on demand)
- **Scroll Performance**: Maintained 60 FPS

### Viewability Improvements

- **Target Viewability Rate**: >80% (ads viewed / ads loaded)
- **Reduced Waste**: Only load ads likely to be viewed
- **Better Metrics**: Track actual viewability vs just impressions

### User Experience

- **Smooth Scrolling**: No jank from simultaneous ad loads
- **Faster Initial Load**: Content appears immediately
- **Loading Indicators**: Clear feedback during ad load

## Analytics & Monitoring

### Events to Track

1. `display_ad_approaching` - Ad entering threshold
2. `display_ad_load_started` - Load initiated
3. `display_ad_loaded` - Successfully loaded
4. `display_ad_load_failed` - Load failed
5. `display_ad_viewed` - Ad entered viewport
6. `display_ad_viewability` - Viewability metrics

### Key Metrics

- Average load time
- Load success rate
- Viewability rate
- Time in viewport
- Memory usage
- Scroll performance (FPS)

## Configuration

### Brand Configuration Updates

```json
{
  "displayAds": {
    "enabled": true,
    "lazyLoading": {
      "enabled": true,
      "threshold": 250,
      "showPlaceholder": true,
      "analytics": true
    }
  }
}
```

### Feature Flags

- `enableLazyLoad`: Toggle lazy loading on/off
- `lazyLoadThreshold`: Adjust threshold distance
- `showPlaceholder`: Show/hide loading placeholders

## Risk Mitigation

### Risk 1: Library Incompatibility

**Mitigation**: Custom `useInView` hook as fallback

### Risk 2: Performance Impact

**Mitigation**:

- Throttle scroll events
- Optimize re-renders with React.memo
- Monitor FPS metrics

### Risk 3: Viewability Decrease

**Mitigation**:

- 250px threshold ensures preloading
- Monitor analytics closely
- Adjust threshold if needed

### Risk 4: Layout Shift

**Mitigation**:

- Use placeholders with fixed dimensions
- Reserve space before ad loads
- Smooth transitions

## Success Criteria

### Must Have

- ✅ Ads load 250px before viewport
- ✅ One ad loads at a time
- ✅ Smooth scrolling maintained (60 FPS)
- ✅ Analytics tracking implemented
- ✅ Works in article detail and list views

### Should Have

- ✅ Viewability rate >80%
- ✅ Load success rate >95%
- ✅ Memory usage reduced by 50%+
- ✅ No layout shift

### Nice to Have

- ⭕ Configurable threshold per context
- ⭕ A/B testing support
- ⭕ Advanced viewability metrics

## Rollback Plan

If issues arise:

1. Disable lazy loading via feature flag
2. Revert to immediate loading
3. Investigate and fix issues
4. Re-deploy with fixes

## Documentation Deliverables

1. ✅ **Implementation Plan** ([`docs/display-ads-lazy-loading-plan.md`](docs/display-ads-lazy-loading-plan.md))

   - Detailed technical specifications
   - Component architecture
   - Implementation steps

2. ✅ **Architecture Overview** ([`docs/display-ads-lazy-loading-architecture.md`](docs/display-ads-lazy-loading-architecture.md))

   - System diagrams
   - Data flow sequences
   - Integration points

3. ⏳ **User Guide** (To be created)

   - Configuration options
   - Best practices
   - Troubleshooting

4. ⏳ **API Reference** (To be created)
   - Hook API
   - Service API
   - Component props

## Timeline

- **Week 1**: Foundation & Core Components
- **Week 2**: Integration & Configuration
- **Week 3**: Testing & Documentation
- **Week 4**: Rollout & Monitoring

**Total Duration**: 4 weeks

## Next Steps

1. **Review and approve this plan**
2. **Switch to Code mode** to begin implementation
3. **Start with Phase 1**: Foundation components
4. **Iterate through phases** with testing at each step
5. **Deploy and monitor** with gradual rollout

## References

- Existing native ads lazy loading: [`NATIVE-ADS-LAZY-LOADING-SUMMARY.md`](NATIVE-ADS-LAZY-LOADING-SUMMARY.md)
- Current display ad implementation: [`components/DisplayAd.tsx`](components/DisplayAd.tsx)
- Ad manager service: [`services/displayAdManager.ts`](services/displayAdManager.ts)

## Questions & Decisions

### Resolved

- ✅ Threshold: 250px
- ✅ Library: react-native-component-inview (with fallback)
- ✅ Strategy: One at a time
- ✅ Priority: Smooth scrolling

### Pending

- ⏳ Exact placeholder design
- ⏳ A/B testing approach
- ⏳ Production rollout schedule

---

**Status**: Planning Complete - Ready for Implementation
**Created**: 2025-01-08
**Last Updated**: 2025-01-08
**Next Review**: After Phase 1 completion
