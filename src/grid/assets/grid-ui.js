/**
 * UI management and event handling for the molecule grid
 */
class GridUI {
    constructor() {
        this.initialized = false;
    }

    initializeEventListeners(grid) {
        if (this.initialized) return;

        console.log('Initializing UI event listeners...');

        try {
            // Basic grid controls
            this.setupBasicControls(grid);

            // Filter controls
            this.setupFilterControls(grid);

            // Plot controls
            this.setupPlotControls(grid);

            this.initialized = true;
            console.log('UI event listeners initialized successfully');
        } catch (error) {
            console.error('Failed to initialize UI event listeners:', error);
            throw error;
        }
    }

    setupBasicControls(grid) {
        const searchBox = document.getElementById('searchBox');
        const sortSelect = document.getElementById('sortSelect');
        const sortOrderBtn = document.getElementById('sortOrderBtn');
        const selectAllBtn = document.getElementById('selectAllBtn');
        const clearSelectionBtn = document.getElementById('clearSelectionBtn');
        const exportBtn = document.getElementById('exportBtn');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        // Search functionality
        if (searchBox) {
            searchBox.addEventListener('input', (e) => {
                grid.searchTerm = e.target.value.toLowerCase();
                grid.applyFiltersAndRender();
            });
        }

        // Sorting functionality
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                grid.sortBy = e.target.value;
                grid.applyFiltersAndRender();
            });
        }

        if (sortOrderBtn) {
            sortOrderBtn.addEventListener('click', () => {
                grid.sortOrder = grid.sortOrder === 'asc' ? 'desc' : 'asc';
                sortOrderBtn.textContent = grid.sortOrder === 'asc' ? 'Ascending' : 'Descending';
                if (grid.sortBy) {
                    grid.applyFiltersAndRender();
                }
            });
        }

        // Selection controls
        if (selectAllBtn) selectAllBtn.addEventListener('click', () => grid.core.selectAll());
        if (clearSelectionBtn) clearSelectionBtn.addEventListener('click', () => grid.core.clearSelection());
        if (exportBtn) exportBtn.addEventListener('click', () => grid.core.exportSelected());

        // Pagination controls
        if (prevBtn) prevBtn.addEventListener('click', () => grid.core.previousPage());
        if (nextBtn) nextBtn.addEventListener('click', () => grid.core.nextPage());
    }

    setupFilterControls(grid) {
        const toggleFilterBtn = document.getElementById('toggleFilterBtn');
        const addRangeFilterBtn = document.getElementById('addRangeFilterBtn');
        const addCategoricalFilterBtn = document.getElementById('addCategoricalFilterBtn');
        const clearAllFiltersBtn = document.getElementById('clearAllFiltersBtn');
        const categorySearchInput = document.getElementById('categorySearchInput');

        if (toggleFilterBtn) {
            toggleFilterBtn.addEventListener('click', () => this.toggleFilterSelection());
        }

        if (addRangeFilterBtn) {
            addRangeFilterBtn.addEventListener('click', () => {
                if (grid.filtering.addRangeFilter()) {
                    grid.applyFiltersAndRender();
                }
            });
        }

        if (addCategoricalFilterBtn) {
            addCategoricalFilterBtn.addEventListener('click', () => {
                if (grid.filtering.addCategoricalFilter()) {
                    grid.applyFiltersAndRender();
                }
            });
        }

        if (clearAllFiltersBtn) {
            clearAllFiltersBtn.addEventListener('click', () => {
                if (grid.filtering.clearAllFilters()) {
                    grid.applyFiltersAndRender();
                }
            });
        }

        if (categorySearchInput) {
            categorySearchInput.addEventListener('input', (e) => {
                grid.filtering.filterCategoryOptions(e.target.value);
            });
        }
    }

    setupPlotControls(grid) {
        const togglePlotBtn = document.getElementById('togglePlotBtn');
        const plotNumericalBtn = document.getElementById('plotNumericalBtn');
        const plotCategoricalBtn = document.getElementById('plotCategoricalBtn');
        const closePlotModal = document.getElementById('closePlotModal');
        const exportPlotCsvBtn = document.getElementById('exportPlotCsvBtn');

        if (togglePlotBtn) {
            togglePlotBtn.addEventListener('click', () => this.togglePlotSelection());
        }

        if (plotNumericalBtn) {
            plotNumericalBtn.addEventListener('click', () => {
                grid.plotting.plotNumericalDistribution(grid.core.filteredMolecules);
            });
        }

        if (plotCategoricalBtn) {
            plotCategoricalBtn.addEventListener('click', () => {
                grid.plotting.plotCategoricalDistribution(grid.core.filteredMolecules);
            });
        }

        if (closePlotModal) {
            closePlotModal.addEventListener('click', () => grid.plotting.closePlotModal());
        }

        if (exportPlotCsvBtn) {
            exportPlotCsvBtn.addEventListener('click', () => grid.plotting.exportPlotData());
        }
    }

    toggleFilterSelection() {
        const filterSelection = document.getElementById('filterSelection');
        const toggleBtn = document.getElementById('toggleFilterBtn');

        if (!filterSelection) {
            console.error('Filter selection element not found');
            return;
        }

        if (filterSelection.style.display === 'none' || filterSelection.style.display === '') {
            filterSelection.style.display = 'block';
            if (toggleBtn) toggleBtn.textContent = 'Hide Filter';
        } else {
            filterSelection.style.display = 'none';
            if (toggleBtn) toggleBtn.textContent = 'Filter';
        }
    }

    togglePlotSelection() {
        const plotSelection = document.getElementById('plotSelection');
        const toggleBtn = document.getElementById('togglePlotBtn');

        if (!plotSelection) {
            console.error('Plot selection element not found');
            return;
        }

        if (plotSelection.style.display === 'none' || plotSelection.style.display === '') {
            plotSelection.style.display = 'block';
            if (toggleBtn) toggleBtn.textContent = 'Hide Plot';
        } else {
            plotSelection.style.display = 'none';
            if (toggleBtn) toggleBtn.textContent = 'Plot';
        }
    }

    // Utility method to safely add event listeners
    safeAddEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
            return true;
        } else {
            console.warn(`Element with ID '${elementId}' not found`);
            return false;
        }
    }

    // Method to show/hide loading states
    showLoading() {
        const grid = document.getElementById('moleculeGrid');
        if (grid) {
            grid.innerHTML = '<div class="loading">Loading molecules...</div>';
        }
    }

    hideLoading() {
        // Loading will be hidden when renderGrid is called
    }

    // Method to show error messages
    showError(message) {
        const grid = document.getElementById('moleculeGrid');
        if (grid) {
            grid.innerHTML = `<div class="no-results">Error: ${message}</div>`;
        }
    }

    // Method to show info messages
    showInfo(message) {
        const grid = document.getElementById('moleculeGrid');
        if (grid) {
            grid.innerHTML = `<div class="no-results">${message}</div>`;
        }
    }

    // Method to update button states based on data
    updateControlStates(hasData, hasSelection) {
        const exportBtn = document.getElementById('exportBtn');
        const selectAllBtn = document.getElementById('selectAllBtn');
        const clearSelectionBtn = document.getElementById('clearSelectionBtn');

        if (exportBtn) {
            exportBtn.disabled = !hasSelection;
        }

        if (selectAllBtn) {
            selectAllBtn.disabled = !hasData;
        }

        if (clearSelectionBtn) {
            clearSelectionBtn.disabled = !hasSelection;
        }
    }

    // Method to reset UI to initial state
    reset() {
        // Reset search
        const searchBox = document.getElementById('searchBox');
        if (searchBox) searchBox.value = '';

        // Reset sort
        const sortSelect = document.getElementById('sortSelect');
        const sortOrderBtn = document.getElementById('sortOrderBtn');
        if (sortSelect) sortSelect.value = '';
        if (sortOrderBtn) {
            sortOrderBtn.textContent = 'Ascending';
        }

        // Hide panels
        const filterSelection = document.getElementById('filterSelection');
        const plotSelection = document.getElementById('plotSelection');
        if (filterSelection) filterSelection.style.display = 'none';
        if (plotSelection) plotSelection.style.display = 'none';

        // Reset toggle buttons
        const toggleFilterBtn = document.getElementById('toggleFilterBtn');
        const togglePlotBtn = document.getElementById('togglePlotBtn');
        if (toggleFilterBtn) toggleFilterBtn.textContent = 'Filter';
        if (togglePlotBtn) togglePlotBtn.textContent = 'Plot';
    }
}

// Export for use in other modules
window.GridUI = GridUI;