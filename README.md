# MoleculeView.jl

[![Stable](https://img.shields.io/badge/docs-stable-blue.svg)](#installation)
[![Code Style: Blue](https://img.shields.io/badge/code%20style-blue-4495d1.svg)](https://github.com/JuliaDiff/BlueStyle)
[![Aqua QA](https://raw.githubusercontent.com/JuliaTesting/Aqua.jl/master/badge.svg)](https://github.com/JuliaTesting/Aqua.jl)

A Julia library for interactive molecular data visualization and exploration. 

<table>
  <tr>
    <td><img src="assets/scatter_demo_cont.gif" width="375"/></td>
    <td><img src="assets/scatter_demo_cat.gif"  width="375"/></td>
  </tr>
  <tr>
    <td colspan="2" align="center"><img src="assets/grid_demo.gif"  width="500"/></td>
  </tr>
  <tr>
    <td colspan="2" align="center"><img src="assets/range_sel_demo.gif" width="500"/></td>
  </tr>
</table>

## Installation

```julia
using Pkg
Pkg.add("MoleculeView")
```

## Quick Start

### Interactive Scatter Plot

```julia
using MoleculeView, DataFrames

df = DataFrame(
    smiles = ["CCO", "c1ccccc1", "CC(=O)OC1=CC=CC=C1C(=O)O"],
    molecular_weight = [46.07, 78.11, 180.16],
    logP = [-0.31, 2.13, 1.19],
    activity = ["active", "inactive", "active"]
)

mol_scatter(
    df,
    :smiles,
    :molecular_weight,
    :logP,
    color_col = :activity,
    markersize = 12
)
```

### Interactive Molecule Grid

```julia
display_mol_grid(
    df,
    mol_col = "smiles",
    id_col = "molecular_weight",
    properties = ["logP", "activity"],
    size = (300, 300),
    open_browser = true,
)
```

## API Reference

### mol_scatter

```julia
mol_scatter(
    df::DataFrame,
    smiles_col::Symbol,
    x_col::Symbol,
    y_col::Symbol;
    color_col::Union{Symbol, Nothing} = nothing,
    molecule_size = (500, 500),
    figure_size = (1000, 500)
) 
```

Create an interactive 2D scatter plot where points represent molecules from a DataFrame.

**Arguments:**
- `df::DataFrame`: DataFrame containing molecular data
- `smiles_col::Symbol`: Column name containing SMILES strings
- `x_col::Symbol`: Column name for x-axis property
- `y_col::Symbol`: Column name for y-axis property
- `color_col::Union{Symbol, Nothing}`: Optional column name for coloring points (default: nothing)
- `molecule_size::Tuple{Int,Int}`: Size of molecule images (default 500x500)
- `figure_size::Tuple{Int,Int}`: Size of the figure
- `show_progress::Bool`: Whether to display progress bar during image generation (default: true)
- `markersize::Real`: Size of the scatter plot points (default: 12)

### display_mol_grid

```julia
display_mol_grid(
    data::DataFrame;
    mol_col = "mol",
    id_col = "id",
    properties = String[],
    size = (300, 300),
    open_browser = true,
    save_file = nothing,
) 
```

Create and display an interactive molecule grid from a DataFrame in one step.

**Arguments:**
- `data::DataFrame`: The molecular data
- `mol_col::String`: Column name containing molecule data (SMILES, etc.)
- `id_col::String`: Column name containing molecule IDs
- `properties::Vector{String}`: List of property columns to display
- `size::Tuple{Int,Int}`: Size of molecule images (width, height)
- `port::Int`: Port for server (currently unused)
- `open_browser::Bool`: Whether to open the grid in browser
- `save_file::Union{String,Nothing}`: Optional filename to save HTML locally