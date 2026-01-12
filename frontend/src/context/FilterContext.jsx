import { createContext, useContext, useState, useCallback } from 'react';

const FilterContext = createContext(null);

const initialFilters = {
  engagement_model_id: [],
  service_category_id: [],
  sector_id: [],
  technology_ids: [],
  status: [],
  resource_count: null,
  search: '',
  customer_type: null,
  manager_id: null,
  date_range: {
    start: null,
    end: null,
  },
};

const initialPagination = {
  page: 1,
  page_size: 20,
};

const initialSort = {
  field: 'created_at',
  direction: 'desc',
};

export function FilterProvider({ children }) {
  // Services filters
  const [servicesFilters, setServicesFilters] = useState({ ...initialFilters });
  const [servicesPagination, setServicesPagination] = useState({ ...initialPagination });
  const [servicesSort, setServicesSort] = useState({ ...initialSort });

  // Products filters
  const [productsFilters, setProductsFilters] = useState({ ...initialFilters });
  const [productsPagination, setProductsPagination] = useState({ ...initialPagination });
  const [productsSort, setProductsSort] = useState({ ...initialSort });

  // Analytics filters
  const [analyticsFilters, setAnalyticsFilters] = useState({
    time_period: {
      preset: 'last_30_days',
      start: null,
      end: null,
    },
    department_id: [],
    technology_ids: [],
  });

  // Update single filter value
  const updateFilter = useCallback((module, key, value) => {
    const setters = {
      services: setServicesFilters,
      products: setProductsFilters,
      analytics: setAnalyticsFilters,
    };

    const setter = setters[module];
    if (setter) {
      setter(prev => ({ ...prev, [key]: value }));
    }
  }, []);

  // Update multiple filters at once
  const updateFilters = useCallback((module, updates) => {
    const setters = {
      services: setServicesFilters,
      products: setProductsFilters,
      analytics: setAnalyticsFilters,
    };

    const setter = setters[module];
    if (setter) {
      setter(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // Reset filters for a module
  const resetFilters = useCallback((module) => {
    switch (module) {
      case 'services':
        setServicesFilters({ ...initialFilters });
        setServicesPagination({ ...initialPagination });
        setServicesSort({ ...initialSort });
        break;
      case 'products':
        setProductsFilters({ ...initialFilters });
        setProductsPagination({ ...initialPagination });
        setProductsSort({ ...initialSort });
        break;
      case 'analytics':
        setAnalyticsFilters({
          time_period: { preset: 'last_30_days', start: null, end: null },
          department_id: [],
          technology_ids: [],
        });
        break;
    }
  }, []);

  // Build filter request payload
  const buildFilterRequest = useCallback((module) => {
    const filterMaps = {
      services: {
        filters: servicesFilters,
        pagination: servicesPagination,
        sort: servicesSort,
      },
      products: {
        filters: productsFilters,
        pagination: productsPagination,
        sort: productsSort,
      },
    };

    const config = filterMaps[module];
    if (!config) return null;

    // Clean up empty filter values
    const cleanFilters = {};
    Object.entries(config.filters).forEach(([key, value]) => {
      if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        return;
      }
      if (typeof value === 'object' && !Array.isArray(value)) {
        const hasValue = Object.values(value).some(v => v !== null && v !== '');
        if (!hasValue) return;
      }
      cleanFilters[key] = value;
    });

    return {
      filters: cleanFilters,
      pagination: config.pagination,
      sort: config.sort,
    };
  }, [servicesFilters, servicesPagination, servicesSort, productsFilters, productsPagination, productsSort]);

  // Get active filter count
  const getActiveFilterCount = useCallback((module) => {
    const filterMaps = {
      services: servicesFilters,
      products: productsFilters,
      analytics: analyticsFilters,
    };

    const filters = filterMaps[module];
    if (!filters) return 0;

    let count = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'date_range' || key === 'time_period') {
        if (value?.start || value?.end) count++;
      } else if (Array.isArray(value) && value.length > 0) {
        count++;
      } else if (value && !Array.isArray(value) && typeof value !== 'object') {
        count++;
      }
    });

    return count;
  }, [servicesFilters, productsFilters, analyticsFilters]);

  const value = {
    // Services
    servicesFilters,
    setServicesFilters,
    servicesPagination,
    setServicesPagination,
    servicesSort,
    setServicesSort,

    // Products
    productsFilters,
    setProductsFilters,
    productsPagination,
    setProductsPagination,
    productsSort,
    setProductsSort,

    // Analytics
    analyticsFilters,
    setAnalyticsFilters,

    // Utilities
    updateFilter,
    updateFilters,
    resetFilters,
    buildFilterRequest,
    getActiveFilterCount,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}

export default FilterContext;
