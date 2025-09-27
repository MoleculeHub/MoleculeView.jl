/**
 * Plotting functionality for the molecule grid
 */
class GridPlotting {
    constructor() {
        this.currentChart = null;
        this.currentPlotData = null;
        this.currentPlotProperty = null;
        this.currentPlotType = null;
    }

    populatePlotOptions(molecules) {
        const numericalSelect = document.getElementById('plotNumericalSelect');
        const categoricalSelect = document.getElementById('plotCategoricalSelect');

        if (!numericalSelect || !categoricalSelect) return;

        // Clear existing options except the first one
        while (numericalSelect.children.length > 1) {
            numericalSelect.removeChild(numericalSelect.lastChild);
        }
        while (categoricalSelect.children.length > 1) {
            categoricalSelect.removeChild(categoricalSelect.lastChild);
        }

        if (molecules.length > 0) {
            const sampleMolecule = molecules[0];
            const properties = Object.keys(sampleMolecule.properties || {});

            properties.forEach(prop => {
                const sampleValue = sampleMolecule.properties[prop];
                const option = document.createElement('option');
                option.value = prop;
                option.textContent = prop.replace(/_/g, ' ').split(' ').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                if (typeof sampleValue === 'number') {
                    numericalSelect.appendChild(option.cloneNode(true));
                } else {
                    categoricalSelect.appendChild(option.cloneNode(true));
                }
            });
        }
    }

    plotNumericalDistribution(filteredMolecules) {
        const propertySelect = document.getElementById('plotNumericalSelect');
        if (!propertySelect) return;

        const property = propertySelect.value;

        if (!property) {
            alert('Please select a numerical property to plot');
            return;
        }

        this.currentPlotProperty = property;
        this.currentPlotType = 'numerical';
        this.showPlotModal();
        this.renderNumericalPlot(property, filteredMolecules);
    }

    plotCategoricalDistribution(filteredMolecules) {
        const propertySelect = document.getElementById('plotCategoricalSelect');
        if (!propertySelect) return;

        const property = propertySelect.value;

        if (!property) {
            alert('Please select a categorical property to plot');
            return;
        }

        this.currentPlotProperty = property;
        this.currentPlotType = 'categorical';
        this.showPlotModal();
        this.renderCategoricalPlot(property, filteredMolecules);
    }

    showPlotModal() {
        const modal = document.getElementById('plotModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closePlotModal() {
        const modal = document.getElementById('plotModal');
        if (modal) {
            modal.style.display = 'none';
        }

        // Destroy existing chart if it exists
        if (this.currentChart) {
            this.currentChart.destroy();
            this.currentChart = null;
        }
    }

    renderNumericalPlot(property, filteredMolecules) {
        // Always use filtered data
        const dataToUse = filteredMolecules;

        // Extract values (excluding missing/invalid data)
        const totalMolecules = dataToUse.length;
        const values = dataToUse
            .map(mol => mol.properties && mol.properties[property])
            .filter(val => typeof val === 'number' && !isNaN(val) && isFinite(val));

        if (values.length === 0) {
            alert('No valid numerical data found for this property');
            return;
        }

        // Calculate histogram bins
        const bins = this.calculateHistogramBins(values);

        // Update title and stats
        const validValues = values.length;
        const title = `${property} Distribution (${validValues} valid values)`;
        const plotTitle = document.getElementById('plotTitle');
        const dataPointCount = document.getElementById('dataPointCount');

        if (plotTitle) plotTitle.textContent = title;
        if (dataPointCount) dataPointCount.textContent = totalMolecules;

        // Update statistics
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const sortedValues = [...values].sort((a, b) => a - b);
        const median = sortedValues[Math.floor(sortedValues.length / 2)];
        const min = Math.min(...values);
        const max = Math.max(...values);
        const missingCount = totalMolecules - validValues;
        const missingPercent = ((missingCount / totalMolecules) * 100).toFixed(1);

        const plotStats = document.getElementById('plotStats');
        if (plotStats) {
            plotStats.innerHTML = `
                <strong>Statistics:</strong> Min: ${min.toFixed(2)}, Max: ${max.toFixed(2)},
                Mean: ${mean.toFixed(2)}, Median: ${median.toFixed(2)} |
                <strong>Missing/Invalid:</strong> ${missingCount} (${missingPercent}%)
            `;
        }

        // Store current plot data for CSV export
        this.currentPlotData = { property, type: 'numerical', values, bins, totalMolecules, validValues };

        // Destroy existing chart
        if (this.currentChart) {
            this.currentChart.destroy();
        }

        // Create new chart
        const ctx = document.getElementById('distributionChart');
        if (ctx) {
            this.currentChart = new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: bins.labels,
                    datasets: [{
                        label: 'Frequency',
                        data: bins.counts,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: property
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Frequency'
                            },
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    renderCategoricalPlot(property, filteredMolecules) {
        // Always use filtered data
        const dataToUse = filteredMolecules;

        // Count categories (excluding missing/invalid data)
        const categoryCount = {};
        let totalMolecules = dataToUse.length;
        let validValues = 0;

        dataToUse.forEach(mol => {
            const value = mol.properties && mol.properties[property];
            if (value !== undefined && value !== null && value !== '' && !Number.isNaN(value)) {
                const key = String(value);
                categoryCount[key] = (categoryCount[key] || 0) + 1;
                validValues++;
            }
        });

        const categories = Object.keys(categoryCount);
        const counts = Object.values(categoryCount);

        if (categories.length === 0) {
            alert('No valid categorical data found for this property');
            return;
        }

        // Update title and stats
        const title = `${property} Distribution (${validValues} valid values)`;
        const plotTitle = document.getElementById('plotTitle');
        const dataPointCount = document.getElementById('dataPointCount');

        if (plotTitle) plotTitle.textContent = title;
        if (dataPointCount) dataPointCount.textContent = totalMolecules;

        // Update statistics
        const missingCount = totalMolecules - validValues;
        const missingPercent = ((missingCount / totalMolecules) * 100).toFixed(1);

        const plotStats = document.getElementById('plotStats');
        if (plotStats) {
            plotStats.innerHTML = `
                <strong>Categories:</strong> ${categories.length} unique values |
                <strong>Missing/Invalid:</strong> ${missingCount} (${missingPercent}%)
            `;
        }

        // Store current plot data for CSV export
        this.currentPlotData = { property, type: 'categorical', categories, counts, totalMolecules, validValues };

        // Destroy existing chart
        if (this.currentChart) {
            this.currentChart.destroy();
        }

        // Create color palette
        const colors = this.generateColors(categories.length);

        // Create new chart
        const ctx = document.getElementById('distributionChart');
        if (ctx) {
            this.currentChart = new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: categories,
                    datasets: [{
                        label: 'Count',
                        data: counts,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: property
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Count'
                            },
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    calculateHistogramBins(values, numBins = 20) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binWidth = (max - min) / numBins;

        const bins = Array(numBins).fill(0);
        const labels = [];

        // Create labels
        for (let i = 0; i < numBins; i++) {
            const binStart = min + i * binWidth;
            const binEnd = min + (i + 1) * binWidth;
            labels.push(`${binStart.toFixed(2)}-${binEnd.toFixed(2)}`);
        }

        // Count values in each bin
        values.forEach(value => {
            let binIndex = Math.floor((value - min) / binWidth);
            if (binIndex >= numBins) binIndex = numBins - 1; // Handle edge case
            bins[binIndex]++;
        });

        return { labels, counts: bins };
    }

    generateColors(count) {
        const baseColors = [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 205, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(199, 199, 199, 0.6)',
            'rgba(83, 102, 255, 0.6)'
        ];

        const borderColors = [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
            'rgba(83, 102, 255, 1)'
        ];

        const background = [];
        const border = [];

        for (let i = 0; i < count; i++) {
            background.push(baseColors[i % baseColors.length]);
            border.push(borderColors[i % borderColors.length]);
        }

        return { background, border };
    }

    exportPlotData() {
        if (!this.currentPlotData) {
            alert('No plot data available to export');
            return;
        }

        const { property, type, totalMolecules, validValues } = this.currentPlotData;
        let csvContent = '';

        if (type === 'numerical') {
            const { values, bins } = this.currentPlotData;

            // Create CSV header
            csvContent = 'Bin_Range,Frequency,Bin_Start,Bin_End\n';

            // Add histogram data
            bins.labels.forEach((label, i) => {
                const [start, end] = label.split('-').map(parseFloat);
                csvContent += `"${label}",${bins.counts[i]},${start},${end}\n`;
            });

            // Add metadata as comments
            csvContent += `\n# Metadata\n`;
            csvContent += `# Property: ${property}\n`;
            csvContent += `# Total molecules: ${totalMolecules}\n`;
            csvContent += `# Valid values: ${validValues}\n`;
            csvContent += `# Missing/Invalid: ${totalMolecules - validValues}\n`;

        } else if (type === 'categorical') {
            const { categories, counts } = this.currentPlotData;

            // Create CSV header
            csvContent = 'Category,Count\n';

            // Add categorical data
            categories.forEach((category, i) => {
                csvContent += `"${category}",${counts[i]}\n`;
            });

            // Add metadata
            csvContent += `\n# Metadata\n`;
            csvContent += `# Property: ${property}\n`;
            csvContent += `# Total molecules: ${totalMolecules}\n`;
            csvContent += `# Valid values: ${validValues}\n`;
            csvContent += `# Missing/Invalid: ${totalMolecules - validValues}\n`;
            csvContent += `# Unique categories: ${categories.length}\n`;
        }

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${property}_distribution.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Export for use in other modules
window.GridPlotting = GridPlotting;