function create_molecule_grid(data::DataFrame; kwargs...)
    return MolGrid(data; kwargs...)
end

function display_grid(grid::MolGrid; port = 8080, open_browser = true, callback = nothing)
    molecules = []

    for row in eachrow(grid.data)
        mol_id = string(row[grid.id_col])

        properties = Dict{String, Any}()
        for prop in grid.properties
            if hasproperty(row, prop)
                properties[prop] = row[prop]
            end
        end

        # Render molecule image
        mol_data = hasproperty(row, grid.mol_col) ? row[grid.mol_col] : nothing
        image_data = render_molecule_image(mol_data, grid.size)

        push!(
            molecules,
            Dict("id" => mol_id, "image" => image_data, "properties" => properties),
        )
    end

    # Create the complete HTML with data
    html_content = generate_html_template()

    # Add JavaScript to load the data and setup callbacks
    data_script = """
    <script>
        $(get_selection_callback())

        document.addEventListener('DOMContentLoaded', function() {
            const moleculeData = $(JSON3.write(molecules));
            window.setMoleculeData(moleculeData);

            // Restore previous selection if available
            const savedSelection = localStorage.getItem('molGrid_selection_' + window.location.pathname);
            if (savedSelection) {
                try {
                    const selectedIds = JSON.parse(savedSelection);
                    window.setSelectionFromJulia(selectedIds);
                } catch (e) {
                    console.warn('Could not restore selection:', e);
                }
            }
        });
    </script>
    </body>
    """

    html_content = replace(html_content, "</body>" => data_script)

    # Write to temporary file and open
    temp_file = tempname() * ".html"
    write(temp_file, html_content)

    println("Interactive molecule grid saved to: $temp_file")

    if open_browser
        if Sys.isapple()
            run(`open $temp_file`)
        elseif Sys.iswindows()
            run(`cmd /c start $temp_file`)
        else
            run(`xdg-open $temp_file`)
        end
    end

    return temp_file
end


"""
    save_grid_html(grid::MolGrid, filename::String)

Save the interactive grid to an HTML file.
"""
function save_grid_html(grid::MolGrid, filename::String)
    molecules = []

    for row in eachrow(grid.data)
        mol_id = string(row[grid.id_col])
        properties = Dict{String, Any}()
        for prop in grid.properties
            if hasproperty(row, prop)
                properties[prop] = row[prop]
            end
        end

        mol_data = hasproperty(row, grid.mol_col) ? row[grid.mol_col] : nothing
        image_data = render_molecule_image(mol_data, grid.size)

        push!(
            molecules,
            Dict("id" => mol_id, "image" => image_data, "properties" => properties),
        )
    end

    html_content = generate_html_template()
    data_script = """
    <script>
        $(get_selection_callback())

        document.addEventListener('DOMContentLoaded', function() {
            const moleculeData = $(JSON3.write(molecules));
            window.setMoleculeData(moleculeData);
        });
    </script>
    </body>
    """

    html_content = replace(html_content, "</body>" => data_script)
    write(filename, html_content)

    return filename
end

"""
    display_mol_grid(data::DataFrame;
                     mol_col="mol",
                     id_col="id",
                     properties=String[],
                     size=(300, 300),
                     port=8080,
                     open_browser=true,
                     save_file=nothing,
                     callback=nothing) -> String

Create and display an interactive molecule grid from a DataFrame in one step.

# Arguments

  - `data::DataFrame`: The molecular data
  - `mol_col::String`: Column name containing molecule data (SMILES, etc.)
  - `id_col::String`: Column name containing molecule IDs
  - `properties::Vector{String}`: List of property columns to display
  - `size::Tuple{Int,Int}`: Size of molecule images (width, height)
  - `port::Int`: Port for server (currently unused)
  - `open_browser::Bool`: Whether to open the grid in browser
  - `save_file::Union{String,Nothing}`: Optional filename to save HTML locally
  - `callback`: Optional callback function (currently unused)

# Returns

  - `String`: Path to the temporary or saved HTML file

# Examples

```julia
# Create and display grid, opening in browser
file_path = display_mol_grid(df; mol_col = "smiles", open_browser = true)

# Create and save to specific file without opening browser
file_path = display_mol_grid(df; save_file = "my_molecules.html", open_browser = false)

# Create, save, and open in browser
file_path = display_mol_grid(df; save_file = "molecules.html", open_browser = true)
```
"""
function display_mol_grid(
    data::DataFrame;
    mol_col = "mol",
    id_col = "id",
    properties = String[],
    size = (300, 300),
    port = 8080,
    open_browser = true,
    save_file = nothing,
    callback = nothing,
)
    grid = MolGrid(
        data; mol_col = mol_col, id_col = id_col, properties = properties, size = size
    )

    molecules = []
    for row in eachrow(grid.data)
        mol_id = string(row[grid.id_col])

        properties_dict = Dict{String, Any}()
        for prop in grid.properties
            if hasproperty(row, prop)
                properties_dict[prop] = row[prop]
            end
        end

        mol_data = hasproperty(row, grid.mol_col) ? row[grid.mol_col] : nothing
        image_data = render_molecule_image(mol_data, grid.size)

        push!(
            molecules,
            Dict("id" => mol_id, "image" => image_data, "properties" => properties_dict),
        )
    end

    # Create the complete HTML with data
    html_content = generate_html_template()

    # Add JavaScript to load the data and setup callbacks
    data_script = """
    <script>
        $(get_selection_callback())

        document.addEventListener('DOMContentLoaded', function() {
            const moleculeData = $(JSON3.write(molecules));
            window.setMoleculeData(moleculeData);

            // Restore previous selection if available
            const savedSelection = localStorage.getItem('molGrid_selection_' + window.location.pathname);
            if (savedSelection) {
                try {
                    const selectedIds = JSON.parse(savedSelection);
                    window.setSelectionFromJulia(selectedIds);
                } catch (e) {
                    console.warn('Could not restore selection:', e);
                }
            }
        });
    </script>
    </body>
    """

    html_content = replace(html_content, "</body>" => data_script)

    output_file = if save_file !== nothing
        save_file
    else
        tempname() * ".html"
    end

    write(output_file, html_content)

    if open_browser
        if Sys.isapple()
            run(`open $output_file`)
        elseif Sys.iswindows()
            run(`cmd /c start $output_file`)
        else
            run(`xdg-open $output_file`)
        end
    end

    return output_file
end
