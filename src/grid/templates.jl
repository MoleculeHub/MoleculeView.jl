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
    # Read main template
    template_path = joinpath(@__DIR__, "template.html")
    template = read(template_path, String)

    # Read partials
    head_path = joinpath(@__DIR__, "partials", "head.html")
    filter_ui_path = joinpath(@__DIR__, "partials", "filter-ui.html")
    plot_ui_path = joinpath(@__DIR__, "partials", "plot-ui.html")
    grid_body_path = joinpath(@__DIR__, "partials", "grid-body.html")

    head_content = read(head_path, String)
    filter_ui_content = read(filter_ui_path, String)
    plot_ui_content = read(plot_ui_path, String)
    grid_body_content = read(grid_body_path, String)

    # Read assets
    styles_path = joinpath(@__DIR__, "assets", "styles.css")
    javascript_path = joinpath(@__DIR__, "assets", "grid.js")

    styles_content = read(styles_path, String)
    javascript_content = read(javascript_path, String)

    # Replace partials
    template = replace(template, "{{HEAD}}" => head_content)
    template = replace(template, "{{FILTER_UI}}" => filter_ui_content)
    template = replace(template, "{{PLOT_UI}}" => plot_ui_content)
    template = replace(template, "{{GRID_BODY}}" => grid_body_content)

    # Replace assets
    template = replace(template, "{{STYLES}}" => styles_content)
    template = replace(template, "{{JAVASCRIPT}}" => javascript_content)

    return template
end
