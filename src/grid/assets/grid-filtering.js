/**
 * Filtering functionality for the molecule grid
 */
class GridFiltering {
    constructor() {
        this.activeFilters = new Map(); // Store multiple filters by property name
        this.tempRangeProperty = '';
        this.tempCategoricalProperty = '';
    }

    populateSortOptions(molecules) {
        const sortSelect = document.getElementById('sortSelect');
        if (!sortSelect) return;

        const currentValue = sortSelect.value;

        // Clear existing options except the first two
        while (sortSelect.children.length > 2) {
            sortSelect.removeChild(sortSelect.lastChild);
        }

        if (molecules.length > 0) {
            const sampleMolecule = molecules[0];
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

    populateRangeOptions(molecules) {
        const rangeSelect = document.getElementById('rangePropertySelect');
        if (!rangeSelect) return;

        const currentValue = rangeSelect.value;

        // Clear existing options except the first one
        while (rangeSelect.children.length > 1) {
            rangeSelect.removeChild(rangeSelect.lastChild);
        }

        if (molecules.length > 0) {
            const sampleMolecule = molecules[0];
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
        rangeSelect.addEventListener('change', () => this.updateRangePlaceholders(molecules));
    }

    populateCategoricalOptions(molecules) {
        const categoricalSelect = document.getElementById('categoricalPropertySelect');
        if (!categoricalSelect) return;

        const currentValue = categoricalSelect.value;

        // Clear existing options except the first one
        while (categoricalSelect.children.length > 1) {
            categoricalSelect.removeChild(categoricalSelect.lastChild);
        }

        if (molecules.length > 0) {
            const sampleMolecule = molecules[0];
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
        categoricalSelect.addEventListener('change', () => this.updateCategoricalValues(molecules));
    }

    updateRangePlaceholders(molecules) {
        const rangeSelect = document.getElementById('rangePropertySelect');
        const minInput = document.getElementById('rangeMin');
        const maxInput = document.getElementById('rangeMax');

        if (!rangeSelect || !minInput || !maxInput) return;

        const selectedProperty = rangeSelect.value;

        if (selectedProperty && molecules.length > 0) {
            // Calculate min and max values for the selected property
            const values = molecules
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

    updateCategoricalValues(molecules) {
        const categoricalSelect = document.getElementById('categoricalPropertySelect');
        const categoricalValues = document.getElementById('categoricalValues');
        const categorySearchInput = document.getElementById('categorySearchInput');

        if (!categoricalSelect || !categoricalValues) return;

        const selectedProperty = categoricalSelect.value;

        categoricalValues.innerHTML = '';
        if (categorySearchInput) categorySearchInput.value = '';

        if (selectedProperty && molecules.length > 0) {
            // Get all unique values for the selected property
            const uniqueValues = new Set();
            molecules.forEach(mol => {
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
        if (!categoricalValues) return;

        const options = categoricalValues.querySelectorAll('.categorical-option:not([id*="selectAll"])');

        options.forEach(option => {
            const value = option.dataset.value || '';
            const matches = value.includes(searchTerm.toLowerCase());
            option.classList.toggle('hidden', !matches);
        });
    }

    filterAndSortMolecules(molecules, searchTerm, sortBy, sortOrder) {
        // First filter by search term
        let filtered;
        if (!searchTerm) {
            filtered = [...molecules];
        } else {
            filtered = molecules.filter(mol => {
                const searchFields = [mol.id, ...Object.values(mol.properties || {})];
                return searchFields.some(field =>
                    String(field).toLowerCase().includes(searchTerm)
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
        if (sortBy) {
            filtered.sort((a, b) => {
                let aValue, bValue;

                if (sortBy === 'id') {
                    aValue = a.id;
                    bValue = b.id;
                } else {
                    aValue = a.properties?.[sortBy];
                    bValue = b.properties?.[sortBy];
                }

                // Handle undefined values
                if (aValue === undefined && bValue === undefined) return 0;
                if (aValue === undefined) return 1;
                if (bValue === undefined) return -1;

                // Numeric sorting
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
                }

                // String sorting
                const aStr = String(aValue).toLowerCase();
                const bStr = String(bValue).toLowerCase();
                const comparison = aStr.localeCompare(bStr);
                return sortOrder === 'asc' ? comparison : -comparison;
            });
        }

        return filtered;
    }

    addRangeFilter() {
        const propertySelect = document.getElementById('rangePropertySelect');
        const minInput = document.getElementById('rangeMin');
        const maxInput = document.getElementById('rangeMax');

        if (!propertySelect || !minInput || !maxInput) return;

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
        return true; // Indicate success
    }

    addCategoricalFilter() {
        const propertySelect = document.getElementById('categoricalPropertySelect');
        const categoricalValues = document.getElementById('categoricalValues');

        if (!propertySelect || !categoricalValues) return;

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
        const categorySearchInput = document.getElementById('categorySearchInput');
        if (categorySearchInput) categorySearchInput.value = '';

        this.updateActiveFiltersDisplay();
        return true; // Indicate success
    }

    removeFilter(property) {
        this.activeFilters.delete(property);
        this.updateActiveFiltersDisplay();
        return true; // Indicate success for re-filtering
    }

    updateActiveFiltersDisplay() {
        const activeFiltersList = document.getElementById('activeFiltersList');
        if (!activeFiltersList) return;

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
                    <button class="remove-filter" onclick="window.moleculeGrid.filtering.removeFilter('${property}'); window.moleculeGrid.applyFiltersAndRender();" title="Remove filter">×</button>
                </div>
            `;
        });

        activeFiltersList.innerHTML = filtersHtml;
    }

    clearAllFilters() {
        this.activeFilters.clear();

        // Clear the inputs
        const elements = [
            'rangePropertySelect', 'rangeMin', 'rangeMax',
            'categoricalPropertySelect', 'categoricalValues', 'categorySearchInput'
        ];

        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (element.tagName === 'SELECT') {
                    element.value = '';
                } else if (element.tagName === 'INPUT') {
                    element.value = '';
                } else {
                    element.innerHTML = '';
                }
            }
        });

        this.updateActiveFiltersDisplay();
        return true; // Indicate success for re-filtering
    }
}

// Export for use in other modules
window.GridFiltering = GridFiltering;