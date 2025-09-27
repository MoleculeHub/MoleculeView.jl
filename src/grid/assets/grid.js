// Grid state management
class MoleculeGrid {
    constructor() {
        console.log('MoleculeGrid constructor starting...');
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

        try {
            this.initializeEventListeners();
            console.log('MoleculeGrid constructor completed successfully');
        } catch (error) {
            console.error('Failed to initialize event listeners:', error);
            throw error; // Re-throw to prevent incomplete object creation
        }
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

        // Only add event listeners if elements exist
        if (searchBox) {
            searchBox.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterAndSortMolecules();
            this.currentPage = 1;
            this.renderGrid();
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.filterAndSortMolecules();
                this.currentPage = 1;
                this.renderGrid();
            });
        }

        if (sortOrderBtn) {
            sortOrderBtn.addEventListener('click', () => {
                this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
                sortOrderBtn.textContent = this.sortOrder === 'asc' ? 'Ascending' : 'Descending';
                if (this.sortBy) {
                    this.filterAndSortMolecules();
                    this.renderGrid();
                }
            });
        }

        if (selectAllBtn) selectAllBtn.addEventListener('click', () => this.selectAll());
        if (clearSelectionBtn) clearSelectionBtn.addEventListener('click', () => this.clearSelection());
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportSelected());
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousPage());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextPage());

        // Filter event listeners
        const toggleFilterBtn = document.getElementById('toggleFilterBtn');
        const addRangeFilterBtn = document.getElementById('addRangeFilterBtn');
        const addCategoricalFilterBtn = document.getElementById('addCategoricalFilterBtn');
        const clearAllFiltersBtn = document.getElementById('clearAllFiltersBtn');
        const categorySearchInput = document.getElementById('categorySearchInput');

        if (toggleFilterBtn) toggleFilterBtn.addEventListener('click', () => this.toggleFilterSelection());
        if (addRangeFilterBtn) addRangeFilterBtn.addEventListener('click', () => this.addRangeFilter());
        if (addCategoricalFilterBtn) addCategoricalFilterBtn.addEventListener('click', () => this.addCategoricalFilter());
        if (clearAllFiltersBtn) clearAllFiltersBtn.addEventListener('click', () => this.clearAllFilters());
        if (categorySearchInput) categorySearchInput.addEventListener('input', (e) => this.filterCategoryOptions(e.target.value));
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
                selectAllLabel.textContent = `Select All (${sortedValues.length} items)`;

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
                    <span class="property-label">${key}:</span>
                    <span>${value}</span>
                </div>`
            ).join('');

        return `
            <div class="molecule-card ${isSelected ? 'selected' : ''}" data-mol-id="${molecule.id}">
                <div class="molecule-image">
                    <img src="${molecule.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCI+TW9sZWN1bGU8L3RleHQ+PC9zdmc='}" alt="Molecule ${molecule.id}">
                    <input type="checkbox" class="select-checkbox" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="molecule-info">
                    <div class="molecule-id">${molecule.id}</div>
                    <div class="molecule-properties">
                        ${propertiesHtml}
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

        const card = document.querySelector(`[data-mol-id="${molId}"]`);
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

        pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
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
                filterText = `${property}: ${minText}-${maxText}`;
            } else if (filter.type === 'categorical') {
                const valuesList = Array.from(filter.values).slice(0, 3).join(', ');
                const more = filter.values.size > 3 ? ` (+${filter.values.size - 3} more)` : '';
                filterText = `${property}: ${valuesList}${more}`;
            }

            filtersHtml += `
                <div class="filter-tag">
                    <span>${filterText}</span>
                    <button class="remove-filter" onclick="window.moleculeGrid.removeFilter('${property}')" title="Remove filter">×</button>
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

// Function to be called from Julia
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
    return window.moleculeGrid ? Array.from(window.moleculeGrid.selectedMolecules) : [];
};