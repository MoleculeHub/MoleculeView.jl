/**
 * Utility functions and constants for the molecule grid
 */
class GridUtils {
    // Constants
    static get DEFAULT_ITEMS_PER_PAGE() { return 15; }
    static get DEFAULT_HISTOGRAM_BINS() { return 20; }
    static get MAX_CATEGORY_DISPLAY() { return 10; }

    // Default placeholder image for molecules
    static get DEFAULT_MOLECULE_IMAGE() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCI+TW9sZWN1bGU8L3RleHQ+PC9zdmc=';
    }

    /**
     * Format property names for display (snake_case to Title Case)
     */
    static formatPropertyName(propName) {
        return propName
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Validate molecule data structure
     */
    static validateMoleculeData(molecules) {
        if (!Array.isArray(molecules)) {
            throw new Error('Molecules data must be an array');
        }

        if (molecules.length === 0) {
            return { valid: true, warnings: ['No molecules provided'] };
        }

        const warnings = [];
        const errors = [];

        molecules.forEach((mol, index) => {
            // Check required fields
            if (!mol.id) {
                errors.push(`Molecule at index ${index} missing required 'id' field`);
            }

            // Check properties structure
            if (mol.properties && typeof mol.properties !== 'object') {
                errors.push(`Molecule '${mol.id}' has invalid properties structure`);
            }

            // Check for common issues
            if (!mol.image) {
                warnings.push(`Molecule '${mol.id}' missing image`);
            }
        });

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Detect property types from molecule data
     */
    static analyzeProperties(molecules) {
        if (molecules.length === 0) return {};

        const propertyAnalysis = {};
        const sampleSize = Math.min(molecules.length, 100); // Sample for performance

        // Get all unique property names
        const allProperties = new Set();
        molecules.slice(0, sampleSize).forEach(mol => {
            if (mol.properties) {
                Object.keys(mol.properties).forEach(prop => allProperties.add(prop));
            }
        });

        // Analyze each property
        allProperties.forEach(prop => {
            const values = molecules
                .slice(0, sampleSize)
                .map(mol => mol.properties && mol.properties[prop])
                .filter(val => val !== undefined && val !== null && val !== '');

            if (values.length === 0) {
                propertyAnalysis[prop] = { type: 'unknown', hasData: false };
                return;
            }

            // Determine type based on values
            const numericValues = values.filter(val => typeof val === 'number' && !isNaN(val));
            const isNumeric = numericValues.length > values.length * 0.8; // 80% threshold

            if (isNumeric) {
                propertyAnalysis[prop] = {
                    type: 'numerical',
                    hasData: true,
                    min: Math.min(...numericValues),
                    max: Math.max(...numericValues),
                    sampleCount: numericValues.length
                };
            } else {
                // Categorical
                const uniqueValues = new Set(values.map(val => String(val)));
                propertyAnalysis[prop] = {
                    type: 'categorical',
                    hasData: true,
                    uniqueCount: uniqueValues.size,
                    sampleCount: values.length,
                    examples: Array.from(uniqueValues).slice(0, 5)
                };
            }
        });

        return propertyAnalysis;
    }

    /**
     * Generate a unique ID for grid instances
     */
    static generateGridId() {
        return 'grid_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Debounce function for search input
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Deep clone an object (for data safety)
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (obj instanceof Set) return new Set([...obj].map(item => this.deepClone(item)));
        if (obj instanceof Map) return new Map([...obj].map(([key, val]) => [key, this.deepClone(val)]));

        const clonedObj = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = this.deepClone(obj[key]);
            }
        }
        return clonedObj;
    }

    /**
     * Format numbers for display
     */
    static formatNumber(num, decimals = 2) {
        if (typeof num !== 'number' || isNaN(num)) return 'N/A';

        if (Math.abs(num) >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (Math.abs(num) >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        } else {
            return num.toFixed(decimals);
        }
    }

    /**
     * Create a safe filename from a string
     */
    static sanitizeFilename(filename) {
        return filename
            .replace(/[^a-z0-9]/gi, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .toLowerCase();
    }

    /**
     * Check if a value is empty/missing
     */
    static isEmpty(value) {
        return value === null ||
               value === undefined ||
               value === '' ||
               (typeof value === 'number' && isNaN(value));
    }

    /**
     * Get statistics for numerical data
     */
    static getNumericStats(values) {
        const validValues = values.filter(val =>
            typeof val === 'number' && !isNaN(val) && isFinite(val)
        );

        if (validValues.length === 0) {
            return {
                count: 0,
                min: null,
                max: null,
                mean: null,
                median: null,
                std: null
            };
        }

        const sorted = [...validValues].sort((a, b) => a - b);
        const mean = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
        const variance = validValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validValues.length;

        return {
            count: validValues.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            mean: mean,
            median: sorted[Math.floor(sorted.length / 2)],
            std: Math.sqrt(variance)
        };
    }

    /**
     * Create CSV content from data
     */
    static createCSV(data, headers) {
        if (!Array.isArray(data) || data.length === 0) {
            return 'No data available';
        }

        const csvHeaders = headers || Object.keys(data[0]);
        const csvRows = data.map(row =>
            csvHeaders.map(header => {
                const value = row[header];
                // Handle values that might contain commas or quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        );

        return [csvHeaders.join(','), ...csvRows].join('\n');
    }

    /**
     * Download data as a file
     */
    static downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Log performance metrics
     */
    static logPerformance(operation, startTime) {
        const duration = performance.now() - startTime;
        console.log(`${operation} completed in ${duration.toFixed(2)}ms`);
        return duration;
    }

    /**
     * Handle errors gracefully
     */
    static handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);

        // Return user-friendly error message
        if (error.message) {
            return `Error: ${error.message}`;
        } else {
            return 'An unexpected error occurred';
        }
    }

    /**
     * Check browser compatibility
     */
    static checkBrowserSupport() {
        const features = {
            es6: typeof Symbol !== 'undefined',
            fetch: typeof fetch !== 'undefined',
            chartjs: typeof Chart !== 'undefined',
            localStorage: typeof Storage !== 'undefined'
        };

        const unsupported = Object.entries(features)
            .filter(([feature, supported]) => !supported)
            .map(([feature]) => feature);

        return {
            supported: unsupported.length === 0,
            missing: unsupported
        };
    }
}

// Export for use in other modules
window.GridUtils = GridUtils;