function get_selection_callback()
    return """
        // Julia callback function
        window.juliaCallback = function(selectedIds) {
            console.log('Selection changed:', selectedIds);

            // Store selection in local storage for persistence
            localStorage.setItem('molGrid_selection_' + window.location.pathname,
                                JSON.stringify(selectedIds));

            // Custom event for Julia integration
            window.dispatchEvent(new CustomEvent('molGridSelection', {
                detail: { selectedIds: selectedIds }
            }));
        };

        // Function to retrieve current selection
        window.getSelectionForJulia = function() {
            return window.getSelection();
        };

        // Function to set selection from Julia
        window.setSelectionFromJulia = function(ids) {
            if (window.moleculeGrid) {
                ids.forEach(id => {
                    window.moleculeGrid.selectedMolecules.add(id);
                });
                window.moleculeGrid.renderGrid();
            }
        };

        // Function to update molecule data from Julia
        window.updateMoleculeData = function(newData) {
            if (window.moleculeGrid) {
                window.moleculeGrid.setData(newData);
            }
        };
    """
end

"""
    generate_html_template() -> String

Generate the complete HTML template for the interactive molecule grid.
"""
function generate_html_template()
    return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            padding: 20px;
        }

        .mol-grid-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .grid-header {
            background: #343a40;
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }

        .grid-title {
            font-size: 1.5rem;
            font-weight: 600;
        }

        .grid-controls {
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
        }

        .search-box {
            padding: 8px 12px;
            border: none;
            border-radius: 4px;
            min-width: 200px;
            font-size: 14px;
        }

        .control-btn {
            padding: 8px 16px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
        }

        .control-btn:hover {
            background: #0056b3;
        }

        .control-btn.secondary {
            background: #6c757d;
        }

        .control-btn.secondary:hover {
            background: #545b62;
        }

        .range-selection {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
            background: rgba(255,255,255,0.1);
            padding: 10px;
            border-radius: 4px;
            margin-top: 10px;
        }

        .range-input {
            padding: 6px 8px;
            border: none;
            border-radius: 3px;
            width: 120px;
            font-size: 12px;
        }

        .range-property-select {
            padding: 6px 8px;
            border: none;
            border-radius: 3px;
            width: 150px;
            font-size: 12px;
        }

        .range-label {
            color: white;
            font-size: 14px;
        }

        .categorical-option {
            display: flex;
            align-items: center;
            gap: 5px;
            background: rgba(255,255,255,0.1);
            padding: 4px 8px;
            border-radius: 3px;
            white-space: nowrap;
            font-size: 12px;
            margin-bottom: 2px;
        }

        .categorical-option input[type="checkbox"] {
            margin: 0;
        }

        .categorical-option label {
            color: white;
            cursor: pointer;
            margin: 0;
            flex: 1;
        }

        .categorical-option.hidden {
            display: none;
        }

        #categoricalValuesContainer {
            background: rgba(255,255,255,0.05);
        }

        #categorySearchInput {
            background: white;
            border: 1px solid #ccc;
        }

        .filter-tag {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: #007bff;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            white-space: nowrap;
        }

        .filter-tag .remove-filter {
            background: rgba(255,255,255,0.3);
            border: none;
            color: white;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            cursor: pointer;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
        }

        .filter-tag .remove-filter:hover {
            background: rgba(255,255,255,0.5);
        }

        .grid-info {
            padding: 15px 20px;
            background: #e9ecef;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .selection-info {
            font-weight: 500;
        }

        .pagination-controls {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .pagination-btn {
            padding: 5px 10px;
            border: 1px solid #dee2e6;
            background: white;
            cursor: pointer;
            border-radius: 3px;
        }

        .pagination-btn:hover:not(:disabled) {
            background: #f8f9fa;
        }

        .pagination-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .molecule-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 15px;
            padding: 20px;
            min-height: 400px;
        }

        .molecule-card {
            border: 2px solid #e9ecef;
            border-radius: 8px;
            background: white;
            transition: all 0.2s ease;
            cursor: pointer;
            overflow: hidden;
        }

        .molecule-card:hover {
            border-color: #007bff;
            box-shadow: 0 4px 15px rgba(0,123,255,0.2);
            transform: translateY(-2px);
        }

        .molecule-card.selected {
            border-color: #28a745;
            background: #f8fff9;
        }

        .molecule-image {
            width: 100%;
            height: 180px;
            background: #f8f9fa;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .molecule-image img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }

        .select-checkbox {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 20px;
            height: 20px;
            cursor: pointer;
        }

        .molecule-info {
            padding: 12px;
            border-top: 1px solid #e9ecef;
        }

        .molecule-id {
            font-weight: 600;
            color: #343a40;
            margin-bottom: 8px;
        }

        .molecule-properties {
            font-size: 12px;
            color: #6c757d;
            line-height: 1.4;
        }

        .property-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
        }

        .property-label {
            font-weight: 500;
        }

        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 200px;
            color: #6c757d;
            font-size: 18px;
        }

        .no-results {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 300px;
            color: #6c757d;
            font-size: 16px;
        }

        @media (max-width: 768px) {
            .grid-header {
                flex-direction: column;
                align-items: stretch;
            }

            .grid-controls {
                justify-content: center;
            }

            .molecule-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="mol-grid-container">
        <div class="grid-header">
            <div class="grid-controls">
                <input type="text" class="search-box" id="searchBox" placeholder="Search molecules...">
                <div style="display: flex; align-items: center; gap: 5px;">
                    <select class="search-box" id="sortSelect" style="max-width: 150px;">
                        <option value="">Sort by...</option>
                        <option value="id">Molecule ID</option>
                    </select>
                    <button class="control-btn secondary" id="sortOrderBtn" style="min-width: 80px; padding: 6px 8px; font-size: 12px;" title="Toggle sort order">Ascending</button>
                </div>
                <button class="control-btn" id="selectAllBtn">Select All</button>
                <button class="control-btn" id="toggleFilterBtn">Filter</button>
                <button class="control-btn secondary" id="clearSelectionBtn">Clear</button>
                <button class="control-btn secondary" id="exportBtn">Export Selected</button>
            </div>
            <div class="range-selection" id="filterSelection" style="display: none;">
                <!-- Active Filters Display -->
                <div id="activeFiltersDisplay" style="margin-bottom: 15px;">
                    <label class="range-label">Active Filters:</label>
                    <div id="activeFiltersList" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; min-height: 30px; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 8px; background: rgba(255,255,255,0.05);">
                        <span id="noFiltersText" style="color: rgba(255,255,255,0.6); font-style: italic;">No active filters</span>
                    </div>
                </div>

                <!-- Add New Filter Section -->
                <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 15px;">
                    <label class="range-label">Add New Filter:</label>
                    <div style="display: flex; gap: 20px; margin-top: 10px; align-items: flex-start; flex-wrap: wrap; justify-content: center;">

                        <!-- Range Filter Section -->
                        <div style="display: flex; flex-direction: column; gap: 8px; min-width: 350px; padding: 15px; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; background: rgba(255,255,255,0.05);">
                            <label class="range-label" style="font-size: 12px; margin-bottom: 5px;">Numerical Filter:</label>
                            <select class="range-property-select" id="rangePropertySelect" style="margin-bottom: 10px; width: 100%; min-width: 200px;">
                                <option value="">Choose property...</option>
                            </select>
                            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                                <input type="number" class="range-input" id="rangeMin" placeholder="Min" step="any" style="flex: 1; min-width: 120px;">
                                <span class="range-label" style="font-size: 12px; flex-shrink: 0;">to</span>
                                <input type="number" class="range-input" id="rangeMax" placeholder="Max" step="any" style="flex: 1; min-width: 120px;">
                                <button class="control-btn" id="addRangeFilterBtn" style="padding: 6px 12px; font-size: 12px; flex-shrink: 0;">Add</button>
                            </div>
                        </div>

                        <!-- Categorical Filter Section -->
                        <div style="display: flex; flex-direction: column; gap: 8px; min-width: 350px; padding: 15px; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; background: rgba(255,255,255,0.05);">
                            <label class="range-label" style="font-size: 12px; margin-bottom: 5px;">Categorical Filter:</label>
                            <select class="range-property-select" id="categoricalPropertySelect" style="margin-bottom: 8px; width: 100%; min-width: 200px;">
                                <option value="">Choose property...</option>
                            </select>
                            <div id="categoricalValuesContainer" style="max-height: 150px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 8px; background: rgba(255,255,255,0.05); margin-bottom: 8px;">
                                <div id="categoricalSearch" style="margin-bottom: 6px;">
                                    <input type="text" id="categorySearchInput" placeholder="Search categories..." style="width: 100%; padding: 4px 8px; border: none; border-radius: 3px; font-size: 11px;">
                                </div>
                                <div id="categoricalValues" style="display: flex; flex-direction: column; gap: 2px; max-height: 100px; overflow-y: auto;">
                                    <!-- Categorical checkboxes will be populated here -->
                                </div>
                            </div>
                            <button class="control-btn" id="addCategoricalFilterBtn" style="padding: 6px 12px; font-size: 12px; width: 100%;">Add</button>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 10px; margin-top: 15px; justify-content: center; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 15px;">
                    <button class="control-btn secondary" id="clearAllFiltersBtn">Clear All Filters</button>
                </div>
            </div>
        </div>

        <div class="grid-info">
            <div class="selection-info">
                <span id="selectionCount">0</span> of <span id="totalCount">0</span> molecules selected
            </div>
            <div class="pagination-controls">
                <button class="pagination-btn" id="prevBtn">← Previous</button>
                <span id="pageInfo">Page 1 of 1</span>
                <button class="pagination-btn" id="nextBtn">Next →</button>
            </div>
        </div>

        <div class="molecule-grid" id="moleculeGrid">
            <div class="loading">Loading molecules...</div>
        </div>
    </div>

    <script>
        // Grid state management
        class MoleculeGrid {
            constructor() {
                this.molecules = [];
                this.filteredMolecules = [];
                this.selectedMolecules = new Set();
                this.currentPage = 1;
                this.itemsPerPage = 15;
                this.searchTerm = '';
                this.sortBy = '';
                this.sortOrder = 'asc';
                this.activeFilters = new Map(); // Store multiple filters by property name
                this.tempRangeProperty = '';
                this.tempCategoricalProperty = '';

                this.initializeEventListeners();
            }

            initializeEventListeners() {
                const searchBox = document.getElementById('searchBox');
                const sortSelect = document.getElementById('sortSelect');
                const sortOrderBtn = document.getElementById('sortOrderBtn');
                const selectAllBtn = document.getElementById('selectAllBtn');
                const clearSelectionBtn = document.getElementById('clearSelectionBtn');
                const exportBtn = document.getElementById('exportBtn');
                const prevBtn = document.getElementById('prevBtn');
                const nextBtn = document.getElementById('nextBtn');

                searchBox.addEventListener('input', (e) => {
                    this.searchTerm = e.target.value.toLowerCase();
                    this.filterAndSortMolecules();
                    this.currentPage = 1;
                    this.renderGrid();
                });

                sortSelect.addEventListener('change', (e) => {
                    this.sortBy = e.target.value;
                    this.filterAndSortMolecules();
                    this.currentPage = 1;
                    this.renderGrid();
                });

                sortOrderBtn.addEventListener('click', () => {
                    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
                    sortOrderBtn.textContent = this.sortOrder === 'asc' ? 'Ascending' : 'Descending';
                    if (this.sortBy) {
                        this.filterAndSortMolecules();
                        this.renderGrid();
                    }
                });

                selectAllBtn.addEventListener('click', () => this.selectAll());
                clearSelectionBtn.addEventListener('click', () => this.clearSelection());
                exportBtn.addEventListener('click', () => this.exportSelected());
                prevBtn.addEventListener('click', () => this.previousPage());
                nextBtn.addEventListener('click', () => this.nextPage());

                // Filter event listeners
                const toggleFilterBtn = document.getElementById('toggleFilterBtn');
                const addRangeFilterBtn = document.getElementById('addRangeFilterBtn');
                const addCategoricalFilterBtn = document.getElementById('addCategoricalFilterBtn');
                const clearAllFiltersBtn = document.getElementById('clearAllFiltersBtn');
                const categorySearchInput = document.getElementById('categorySearchInput');

                toggleFilterBtn.addEventListener('click', () => this.toggleFilterSelection());
                addRangeFilterBtn.addEventListener('click', () => this.addRangeFilter());
                addCategoricalFilterBtn.addEventListener('click', () => this.addCategoricalFilter());
                clearAllFiltersBtn.addEventListener('click', () => this.clearAllFilters());
                categorySearchInput.addEventListener('input', (e) => this.filterCategoryOptions(e.target.value));
            }

            setData(molecules) {
                this.molecules = molecules;
                this.populateSortOptions();
                this.populateRangeOptions();
                this.populateCategoricalOptions();
                this.filterAndSortMolecules();
                this.renderGrid();
                this.updateCounts();
            }

            populateSortOptions() {
                const sortSelect = document.getElementById('sortSelect');
                const currentValue = sortSelect.value;

                // Clear existing options except the first two
                while (sortSelect.children.length > 2) {
                    sortSelect.removeChild(sortSelect.lastChild);
                }

                if (this.molecules.length > 0) {
                    const sampleMolecule = this.molecules[0];
                    const properties = Object.keys(sampleMolecule.properties || {});

                    properties.forEach(prop => {
                        const option = document.createElement('option');
                        option.value = prop;
                        option.textContent = prop.replace(/_/g, ' ').split(' ').map(word =>
                            word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                        sortSelect.appendChild(option);
                    });
                }

                // Restore previous selection if valid
                if (currentValue && Array.from(sortSelect.options).some(opt => opt.value === currentValue)) {
                    sortSelect.value = currentValue;
                }
            }

            populateRangeOptions() {
                const rangeSelect = document.getElementById('rangePropertySelect');
                const currentValue = rangeSelect.value;

                // Clear existing options except the first one
                while (rangeSelect.children.length > 1) {
                    rangeSelect.removeChild(rangeSelect.lastChild);
                }

                if (this.molecules.length > 0) {
                    const sampleMolecule = this.molecules[0];
                    const properties = Object.keys(sampleMolecule.properties || {});

                    properties.forEach(prop => {
                        // Only add numeric properties to range selection
                        const sampleValue = sampleMolecule.properties[prop];
                        if (typeof sampleValue === 'number') {
                            const option = document.createElement('option');
                            option.value = prop;
                            option.textContent = prop.replace(/_/g, ' ').split(' ').map(word =>
                                word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                            rangeSelect.appendChild(option);
                        }
                    });
                }

                // Restore previous selection if valid
                if (currentValue && Array.from(rangeSelect.options).some(opt => opt.value === currentValue)) {
                    rangeSelect.value = currentValue;
                }

                // Add event listener to update placeholders when property is selected
                rangeSelect.addEventListener('change', () => this.updateRangePlaceholders());
            }

            populateCategoricalOptions() {
                const categoricalSelect = document.getElementById('categoricalPropertySelect');
                const currentValue = categoricalSelect.value;

                // Clear existing options except the first one
                while (categoricalSelect.children.length > 1) {
                    categoricalSelect.removeChild(categoricalSelect.lastChild);
                }

                if (this.molecules.length > 0) {
                    const sampleMolecule = this.molecules[0];
                    const properties = Object.keys(sampleMolecule.properties || {});

                    properties.forEach(prop => {
                        // Only add non-numeric properties to categorical selection
                        const sampleValue = sampleMolecule.properties[prop];
                        if (typeof sampleValue !== 'number') {
                            const option = document.createElement('option');
                            option.value = prop;
                            option.textContent = prop.replace(/_/g, ' ').split(' ').map(word =>
                                word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                            categoricalSelect.appendChild(option);
                        }
                    });
                }

                // Restore previous selection if valid
                if (currentValue && Array.from(categoricalSelect.options).some(opt => opt.value === currentValue)) {
                    categoricalSelect.value = currentValue;
                }

                // Add event listener to update categorical values when property is selected
                categoricalSelect.addEventListener('change', () => this.updateCategoricalValues());
            }

            updateRangePlaceholders() {
                const rangeSelect = document.getElementById('rangePropertySelect');
                const minInput = document.getElementById('rangeMin');
                const maxInput = document.getElementById('rangeMax');
                const selectedProperty = rangeSelect.value;

                if (selectedProperty && this.molecules.length > 0) {
                    // Calculate min and max values for the selected property
                    const values = this.molecules
                        .map(mol => mol.properties && mol.properties[selectedProperty])
                        .filter(val => typeof val === 'number');

                    if (values.length > 0) {
                        const minVal = Math.min.apply(Math, values);
                        const maxVal = Math.max.apply(Math, values);

                        minInput.placeholder = 'Min (' + minVal.toFixed(2) + ')';
                        maxInput.placeholder = 'Max (' + maxVal.toFixed(2) + ')';
                    }
                } else {
                    minInput.placeholder = 'Min';
                    maxInput.placeholder = 'Max';
                }
            }

            updateCategoricalValues() {
                const categoricalSelect = document.getElementById('categoricalPropertySelect');
                const categoricalValues = document.getElementById('categoricalValues');
                const selectedProperty = categoricalSelect.value;

                categoricalValues.innerHTML = '';
                document.getElementById('categorySearchInput').value = '';

                if (selectedProperty && this.molecules.length > 0) {
                    // Get all unique values for the selected property
                    const uniqueValues = new Set();
                    this.molecules.forEach(mol => {
                        const value = mol.properties && mol.properties[selectedProperty];
                        if (value !== undefined && value !== null && value !== '') {
                            uniqueValues.add(String(value));
                        }
                    });

                    const sortedValues = Array.from(uniqueValues).sort();

                    // Show count and select all option if many categories
                    if (sortedValues.length > 10) {
                        const selectAllContainer = document.createElement('div');
                        selectAllContainer.className = 'categorical-option';
                        selectAllContainer.style.fontWeight = 'bold';
                        selectAllContainer.style.borderBottom = '1px solid rgba(255,255,255,0.2)';
                        selectAllContainer.style.marginBottom = '5px';

                        const selectAllCheckbox = document.createElement('input');
                        selectAllCheckbox.type = 'checkbox';
                        selectAllCheckbox.id = 'selectAllCategories';

                        const selectAllLabel = document.createElement('label');
                        selectAllLabel.htmlFor = 'selectAllCategories';
                        selectAllLabel.textContent = `Select All (\${sortedValues.length} items)`;

                        selectAllContainer.appendChild(selectAllCheckbox);
                        selectAllContainer.appendChild(selectAllLabel);
                        categoricalValues.appendChild(selectAllContainer);

                        selectAllCheckbox.addEventListener('change', (e) => {
                            const allCheckboxes = categoricalValues.querySelectorAll('input[type="checkbox"]:not(#selectAllCategories)');
                            allCheckboxes.forEach(cb => {
                                cb.checked = e.target.checked;
                            });
                        });
                    }

                    sortedValues.forEach(value => {
                        const checkboxContainer = document.createElement('div');
                        checkboxContainer.className = 'categorical-option';
                        checkboxContainer.dataset.value = value.toLowerCase();

                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.id = 'cat_' + value.replace(/[^a-zA-Z0-9]/g, '_');
                        checkbox.value = value;

                        const label = document.createElement('label');
                        label.htmlFor = checkbox.id;
                        label.textContent = value;

                        checkboxContainer.appendChild(checkbox);
                        checkboxContainer.appendChild(label);
                        categoricalValues.appendChild(checkboxContainer);

                        checkbox.addEventListener('change', (e) => {
                            // Update select all checkbox
                            const selectAllCheckbox = document.getElementById('selectAllCategories');
                            if (selectAllCheckbox) {
                                const allCheckboxes = categoricalValues.querySelectorAll('input[type="checkbox"]:not(#selectAllCategories)');
                                const checkedCount = Array.from(allCheckboxes).filter(cb => cb.checked).length;
                                selectAllCheckbox.checked = checkedCount === allCheckboxes.length;
                                selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
                            }
                        });
                    });
                }
            }

            filterCategoryOptions(searchTerm) {
                const categoricalValues = document.getElementById('categoricalValues');
                const options = categoricalValues.querySelectorAll('.categorical-option:not([id*="selectAll"])');

                options.forEach(option => {
                    const value = option.dataset.value || '';
                    const matches = value.includes(searchTerm.toLowerCase());
                    option.classList.toggle('hidden', !matches);
                });
            }

            filterAndSortMolecules() {
                // First filter by search term
                let filtered;
                if (!this.searchTerm) {
                    filtered = [...this.molecules];
                } else {
                    filtered = this.molecules.filter(mol => {
                        const searchFields = [mol.id, ...Object.values(mol.properties || {})];
                        return searchFields.some(field =>
                            String(field).toLowerCase().includes(this.searchTerm)
                        );
                    });
                }

                // Apply all active filters
                this.activeFilters.forEach((filter, property) => {
                    if (filter.type === 'range') {
                        filtered = filtered.filter(mol => {
                            const value = mol.properties && mol.properties[property];
                            if (typeof value !== 'number') return false;

                            let inRange = true;
                            if (filter.min !== null && value < filter.min) inRange = false;
                            if (filter.max !== null && value > filter.max) inRange = false;

                            return inRange;
                        });
                    } else if (filter.type === 'categorical') {
                        filtered = filtered.filter(mol => {
                            const value = mol.properties && mol.properties[property];
                            if (value === undefined || value === null || value === '') return false;

                            return filter.values.has(String(value));
                        });
                    }
                });

                // Then sort
                if (this.sortBy) {
                    filtered.sort((a, b) => {
                        let aValue, bValue;

                        if (this.sortBy === 'id') {
                            aValue = a.id;
                            bValue = b.id;
                        } else {
                            aValue = a.properties?.[this.sortBy];
                            bValue = b.properties?.[this.sortBy];
                        }

                        // Handle undefined values
                        if (aValue === undefined && bValue === undefined) return 0;
                        if (aValue === undefined) return 1;
                        if (bValue === undefined) return -1;

                        // Numeric sorting
                        if (typeof aValue === 'number' && typeof bValue === 'number') {
                            return this.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
                        }

                        // String sorting
                        const aStr = String(aValue).toLowerCase();
                        const bStr = String(bValue).toLowerCase();
                        const comparison = aStr.localeCompare(bStr);
                        return this.sortOrder === 'asc' ? comparison : -comparison;
                    });
                }

                this.filteredMolecules = filtered;
            }

            renderGrid() {
                const grid = document.getElementById('moleculeGrid');
                const startIndex = (this.currentPage - 1) * this.itemsPerPage;
                const endIndex = startIndex + this.itemsPerPage;
                const pageItems = this.filteredMolecules.slice(startIndex, endIndex);

                if (pageItems.length === 0) {
                    grid.innerHTML = '<div class="no-results">No molecules found</div>';
                    return;
                }

                grid.innerHTML = pageItems.map(mol => this.createMoleculeCard(mol)).join('');
                this.updatePagination();
                this.updateCounts();

                // Add click listeners to cards
                document.querySelectorAll('.molecule-card').forEach(card => {
                    card.addEventListener('click', (e) => {
                        if (e.target.type !== 'checkbox') {
                            const checkbox = card.querySelector('.select-checkbox');
                            checkbox.checked = !checkbox.checked;
                            this.toggleSelection(card.dataset.molId, checkbox.checked);
                        }
                    });
                });

                // Add checkbox listeners
                document.querySelectorAll('.select-checkbox').forEach(checkbox => {
                    checkbox.addEventListener('change', (e) => {
                        e.stopPropagation();
                        const molId = e.target.closest('.molecule-card').dataset.molId;
                        this.toggleSelection(molId, e.target.checked);
                    });
                });
            }

            createMoleculeCard(molecule) {
                const isSelected = this.selectedMolecules.has(molecule.id);
                const properties = molecule.properties || {};

                const propertiesHtml = Object.entries(properties)
                    .map(([key, value]) =>
                        `<div class="property-row">
                            <span class="property-label">\${key}:</span>
                            <span>\${value}</span>
                        </div>`
                    ).join('');

                return `
                    <div class="molecule-card \${isSelected ? 'selected' : ''}" data-mol-id="\${molecule.id}">
                        <div class="molecule-image">
                            <img src="\${molecule.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCI+TW9sZWN1bGU8L3RleHQ+PC9zdmc='}" alt="Molecule \${molecule.id}">
                            <input type="checkbox" class="select-checkbox" \${isSelected ? 'checked' : ''}>
                        </div>
                        <div class="molecule-info">
                            <div class="molecule-id">\${molecule.id}</div>
                            <div class="molecule-properties">
                                \${propertiesHtml}
                            </div>
                        </div>
                    </div>
                `;
            }

            toggleSelection(molId, selected) {
                if (selected) {
                    this.selectedMolecules.add(molId);
                } else {
                    this.selectedMolecules.delete(molId);
                }

                const card = document.querySelector(`[data-mol-id="\${molId}"]`);
                if (card) {
                    card.classList.toggle('selected', selected);
                }

                this.updateCounts();
                this.notifySelection();
            }

            selectAll() {
                this.filteredMolecules.forEach(mol => {
                    this.selectedMolecules.add(mol.id);
                });
                this.renderGrid();
                this.notifySelection();
            }

            clearSelection() {
                this.selectedMolecules.clear();
                this.renderGrid();
                this.notifySelection();
            }

            exportSelected() {
                const selectedData = this.molecules.filter(mol =>
                    this.selectedMolecules.has(mol.id)
                );

                if (selectedData.length === 0) {
                    alert('No molecules selected');
                    return;
                }

                // Convert to CSV
                const headers = ['id', ...Object.keys(selectedData[0].properties || {})];
                const csvContent = [
                    headers.join(','),
                    ...selectedData.map(mol => {
                        const row = [mol.id];
                        const props = mol.properties || {};
                        headers.slice(1).forEach(header => {
                            row.push(props[header] || '');
                        });
                        return row.join(',');
                    })
                ].join('\\n');

                // Download CSV
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'selected_molecules.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }

            previousPage() {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderGrid();
                }
            }

            nextPage() {
                const totalPages = Math.ceil(this.filteredMolecules.length / this.itemsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderGrid();
                }
            }

            updatePagination() {
                const totalPages = Math.ceil(this.filteredMolecules.length / this.itemsPerPage);
                const pageInfo = document.getElementById('pageInfo');
                const prevBtn = document.getElementById('prevBtn');
                const nextBtn = document.getElementById('nextBtn');

                pageInfo.textContent = `Page \${this.currentPage} of \${totalPages}`;
                prevBtn.disabled = this.currentPage === 1;
                nextBtn.disabled = this.currentPage === totalPages;
            }

            updateCounts() {
                const selectionCount = document.getElementById('selectionCount');
                const totalCount = document.getElementById('totalCount');

                selectionCount.textContent = this.selectedMolecules.size;
                totalCount.textContent = this.filteredMolecules.length;
            }

            notifySelection() {
                // Call Julia callback if available
                if (window.juliaCallback) {
                    window.juliaCallback(Array.from(this.selectedMolecules));
                }
            }

            toggleFilterSelection() {
                const filterSelection = document.getElementById('filterSelection');
                const toggleBtn = document.getElementById('toggleFilterBtn');

                if (filterSelection.style.display === 'none') {
                    filterSelection.style.display = 'block';
                    toggleBtn.textContent = 'Hide Filter';
                } else {
                    filterSelection.style.display = 'none';
                    toggleBtn.textContent = 'Filter';
                }
            }

            addRangeFilter() {
                const propertySelect = document.getElementById('rangePropertySelect');
                const minInput = document.getElementById('rangeMin');
                const maxInput = document.getElementById('rangeMax');

                const property = propertySelect.value;
                const min = minInput.value ? parseFloat(minInput.value) : null;
                const max = maxInput.value ? parseFloat(maxInput.value) : null;

                if (!property) {
                    alert('Please select a property for range filtering');
                    return;
                }

                if (min === null && max === null) {
                    alert('Please enter min and/or max values');
                    return;
                }

                if (this.activeFilters.has(property)) {
                    alert('Filter for this property already exists. Remove it first to add a new one.');
                    return;
                }

                // Add the filter
                this.activeFilters.set(property, {
                    type: 'range',
                    min: min,
                    max: max
                });

                // Clear the inputs
                propertySelect.value = '';
                minInput.value = '';
                maxInput.value = '';

                this.updateActiveFiltersDisplay();
                this.filterAndSortMolecules();
                this.currentPage = 1;
                this.renderGrid();
            }

            addCategoricalFilter() {
                const propertySelect = document.getElementById('categoricalPropertySelect');
                const categoricalValues = document.getElementById('categoricalValues');

                const property = propertySelect.value;
                if (!property) {
                    alert('Please select a property for categorical filtering');
                    return;
                }

                // Get selected values
                const selectedValues = new Set();
                const checkboxes = categoricalValues.querySelectorAll('input[type="checkbox"]:not(#selectAllCategories):checked');
                checkboxes.forEach(cb => selectedValues.add(cb.value));

                if (selectedValues.size === 0) {
                    alert('Please select at least one category value');
                    return;
                }

                if (this.activeFilters.has(property)) {
                    alert('Filter for this property already exists. Remove it first to add a new one.');
                    return;
                }

                // Add the filter
                this.activeFilters.set(property, {
                    type: 'categorical',
                    values: selectedValues
                });

                // Clear the inputs
                propertySelect.value = '';
                categoricalValues.innerHTML = '';
                document.getElementById('categorySearchInput').value = '';

                this.updateActiveFiltersDisplay();
                this.filterAndSortMolecules();
                this.currentPage = 1;
                this.renderGrid();
            }

            removeFilter(property) {
                this.activeFilters.delete(property);
                this.updateActiveFiltersDisplay();
                this.filterAndSortMolecules();
                this.currentPage = 1;
                this.renderGrid();
            }

            updateActiveFiltersDisplay() {
                const activeFiltersList = document.getElementById('activeFiltersList');
                const noFiltersText = document.getElementById('noFiltersText');

                if (this.activeFilters.size === 0) {
                    activeFiltersList.innerHTML = '<span id="noFiltersText" style="color: rgba(255,255,255,0.6); font-style: italic;">No active filters</span>';
                    return;
                }

                let filtersHtml = '';
                this.activeFilters.forEach((filter, property) => {
                    let filterText = '';
                    if (filter.type === 'range') {
                        const minText = filter.min !== null ? filter.min : '';
                        const maxText = filter.max !== null ? filter.max : '';
                        filterText = `\${property}: \${minText}-\${maxText}`;
                    } else if (filter.type === 'categorical') {
                        const valuesList = Array.from(filter.values).slice(0, 3).join(', ');
                        const more = filter.values.size > 3 ? ` (+\${filter.values.size - 3} more)` : '';
                        filterText = `\${property}: \${valuesList}\${more}`;
                    }

                    filtersHtml += `
                        <div class="filter-tag">
                            <span>\${filterText}</span>
                            <button class="remove-filter" onclick="window.moleculeGrid.removeFilter('\${property}')" title="Remove filter">×</button>
                        </div>
                    `;
                });

                activeFiltersList.innerHTML = filtersHtml;
            }

            clearAllFilters() {
                this.activeFilters.clear();

                // Clear the inputs
                document.getElementById('rangePropertySelect').value = '';
                document.getElementById('rangeMin').value = '';
                document.getElementById('rangeMax').value = '';
                document.getElementById('categoricalPropertySelect').value = '';
                document.getElementById('categoricalValues').innerHTML = '';
                document.getElementById('categorySearchInput').value = '';

                this.updateActiveFiltersDisplay();
                this.filterAndSortMolecules();
                this.currentPage = 1;
                this.renderGrid();
            }
        }

        // Initialize grid
        window.moleculeGrid = new MoleculeGrid();

        // Function to be called from Julia
        window.setMoleculeData = function(data) {
            window.moleculeGrid.setData(data);
        };

        // Function to get current selection
        window.getSelection = function() {
            return Array.from(window.moleculeGrid.selectedMolecules);
        };
    </script>
</body>
</html>
    """
end
