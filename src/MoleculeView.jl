module MoleculeView

using DataFrames
using JSON3
import Base64

include("grid/types.jl")
include("grid/rendering.jl")
include("grid/templates.jl")
include("grid/display.jl")
include("interactive_scatter.jl")

export MolGrid,
    create_molecule_grid,
    display_grid,
    save_grid_html,
    display_mol_grid,
    render_molecule_image,
    render_placeholder_molecule,
    render_smiles_molecule,
    render_generic_molecule,
    mol_scatter

end
