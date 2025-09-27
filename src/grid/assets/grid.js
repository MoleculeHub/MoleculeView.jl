// Main MoleculeGrid class that orchestrates all modules
class MoleculeGrid {
    constructor() {
        console.log('MoleculeGrid constructor starting...');

        // Initialize core properties
        this.molecules = [];
        this.searchTerm = '';
        this.sortBy = '';
        this.sortOrder = 'asc';

        // Initialize modules
        this.core = new GridCore();
        this.filtering = new GridFiltering();
        this.plotting = new GridPlotting();
        this.ui = new GridUI();

        try {
            // Set up the UI event listeners
            this.ui.initializeEventListeners(this);
            console.log('MoleculeGrid constructor completed successfully');
        } catch (error) {
            console.error('Failed to initialize event listeners:', error);
            throw error;
        }
    }

    // Main coordination methods
    setData(molecules) {
        console.log('Setting molecule data:', molecules.length, 'molecules');

        // Validate data
        const validation = GridUtils.validateMoleculeData(molecules);
        if (!validation.valid) {
            console.error('Invalid molecule data:', validation.errors);
            this.ui.showError('Invalid molecule data: ' + validation.errors.join(', '));
            return;
        }

        if (validation.warnings.length > 0) {
            console.warn('Data warnings:', validation.warnings);
        }

        // Set data in modules
        this.molecules = molecules;
        this.core.setData(molecules);

        // Populate all options
        this.filtering.populateSortOptions(molecules);
        this.filtering.populateRangeOptions(molecules);
        this.filtering.populateCategoricalOptions(molecules);
        this.plotting.populatePlotOptions(molecules);

        // Apply initial filtering and render
        this.applyFiltersAndRender();
    }

    applyFiltersAndRender() {
        // Apply filtering and sorting
        this.core.filteredMolecules = this.filtering.filterAndSortMolecules(
            this.molecules,
            this.searchTerm,
            this.sortBy,
            this.sortOrder
        );

        // Reset to first page when filters change
        this.core.currentPage = 1;

        // Render the grid
        this.core.renderGrid();

        // Update UI states
        this.ui.updateControlStates(
            this.molecules.length > 0,
            this.core.selectedMolecules.size > 0
        );
    }

    // Public API methods for external access
    getSelectedMolecules() {
        return Array.from(this.core.selectedMolecules);
    }

    clearAllSelections() {
        this.core.clearSelection();
    }

    selectMolecules(moleculeIds) {
        moleculeIds.forEach(id => this.core.selectedMolecules.add(id));
        this.core.renderGrid();
    }

    // Reset the entire grid
    reset() {
        this.molecules = [];
        this.searchTerm = '';
        this.sortBy = '';
        this.sortOrder = 'asc';

        this.core.molecules = [];
        this.core.filteredMolecules = [];
        this.core.selectedMolecules.clear();
        this.core.currentPage = 1;

        this.filtering.activeFilters.clear();
        this.filtering.updateActiveFiltersDisplay();

        this.ui.reset();
        this.ui.showInfo('Grid reset');
    }

    // Error handling
    handleError(error, context = 'Grid operation') {
        const message = GridUtils.handleError(error, context);
        this.ui.showError(message);
        console.error(`${context}:`, error);
    }

    // Performance monitoring
    measurePerformance(operation, fn) {
        const startTime = performance.now();
        try {
            const result = fn();
            GridUtils.logPerformance(operation, startTime);
            return result;
        } catch (error) {
            this.handleError(error, operation);
            throw error;
        }
    }
}

// Global functions for Julia integration
window.setMoleculeData = function(data) {
    console.log('setMoleculeData called with data:', data.length, 'molecules');
    console.log('Current moleculeGrid:', window.moleculeGrid);
    console.log('Creating fresh MoleculeGrid...');

    try {
        window.moleculeGrid = new MoleculeGrid();
        console.log('MoleculeGrid created:', window.moleculeGrid);
        console.log('setData method exists:', typeof window.moleculeGrid.setData);
    } catch (error) {
        console.error('Failed to create MoleculeGrid:', error);
        return;
    }

    window.moleculeGrid.setData(data);
};

// Function to get current selection
window.getSelection = function() {
    return window.moleculeGrid ? window.moleculeGrid.getSelectedMolecules() : [];
};

// Additional utility functions for external access
window.getMoleculeGrid = function() {
    return window.moleculeGrid;
};

window.resetMoleculeGrid = function() {
    if (window.moleculeGrid) {
        window.moleculeGrid.reset();
    }
};

// Browser compatibility check
document.addEventListener('DOMContentLoaded', function() {
    const support = GridUtils.checkBrowserSupport();
    if (!support.supported) {
        console.warn('Browser compatibility issues detected:', support.missing);
        const grid = document.getElementById('moleculeGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="no-results">
                    Browser compatibility issue detected.
                    Missing features: ${support.missing.join(', ')}.
                    Please use a modern browser.
                </div>
            `;
        }
    }
});