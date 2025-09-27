/**
 * Core grid functionality - basic data management and rendering
 */
class GridCore {
    constructor() {
        this.molecules = [];
        this.filteredMolecules = [];
        this.selectedMolecules = new Set();
        this.currentPage = 1;
        this.itemsPerPage = 15;
        this.searchTerm = '';
        this.sortBy = '';
        this.sortOrder = 'asc';
    }

    setData(molecules) {
        this.molecules = molecules;
        this.filteredMolecules = [...molecules];
        this.currentPage = 1;
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

    updateCounts() {
        const selectionCount = document.getElementById('selectionCount');
        const totalCount = document.getElementById('totalCount');

        if (selectionCount) selectionCount.textContent = this.selectedMolecules.size;
        if (totalCount) totalCount.textContent = this.filteredMolecules.length;
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredMolecules.length / this.itemsPerPage);
        const pageInfo = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (pageInfo) pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage === totalPages;
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

    notifySelection() {
        // Call Julia callback if available
        if (window.juliaCallback) {
            window.juliaCallback(Array.from(this.selectedMolecules));
        }
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
}

// Export for use in other modules
window.GridCore = GridCore;