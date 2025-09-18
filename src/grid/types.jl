"""
    MolGrid

Interactive molecule grid for displaying and exploring molecular data.

# Fields

  - `data::DataFrame`: The molecular data
  - `mol_col::String`: Column name containing molecule data (SMILES, etc.)
  - `id_col::String`: Column name containing molecule IDs
  - `properties::Vector{String}`: List of property columns to display
  - `grid_id::String`: Unique identifier for this grid
  - `size::Tuple{Int,Int}`: Size of molecule images (width, height)
"""
struct MolGrid
    data::DataFrame
    mol_col::String
    id_col::String
    properties::Vector{String}
    grid_id::String
    size::Tuple{Int, Int}

    function MolGrid(
        data::DataFrame;
        mol_col = "mol",
        id_col = "id",
        properties = String[],
        size = (300, 300),
    )
        grid_id = "grid_" * string(abs(hash(data)); base = 16)[1:8]
        if isempty(properties)
            properties = [name for name in names(data) if name ∉ [mol_col, id_col]]
        end
        new(data, mol_col, id_col, properties, grid_id, size)
    end
end
