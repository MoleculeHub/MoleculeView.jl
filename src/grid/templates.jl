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
    template_path = joinpath(@__DIR__, "template.html")
    return read(template_path, String)
end
