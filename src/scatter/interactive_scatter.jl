using WGLMakie:
    Figure,
    Axis,
    scatter!,
    image!,
    text!,
    hidedecorations!,
    Observable,
    events,
    mouseposition,
    Mouse,
    on,
    autolimits!,
    lines!,
    Colorbar,
    Legend
using Colors
using MoleculeFlow
using DataFrames
using ProgressMeter

function rotate_image_90_right(img::Matrix)
    return permutedims(reverse(img; dims = 1), (2, 1))
end

function resize_image(img::Matrix, target_size::Tuple{Int, Int})
    old_height, old_width = size(img)
    new_height, new_width = target_size

    if (old_height, old_width) == target_size
        return img
    end

    # Create output matrix
    resized = similar(img, new_height, new_width)

    # Calculate scaling factors
    y_scale = (old_height - 1) / (new_height - 1)
    x_scale = (old_width - 1) / (new_width - 1)

    # Bilinear interpolation
    for j in 1:new_width
        for i in 1:new_height
            # Map to original coordinates
            y = 1 + (i - 1) * y_scale
            x = 1 + (j - 1) * x_scale

            # Get integer parts
            y1 = floor(Int, y)
            x1 = floor(Int, x)
            y2 = min(y1 + 1, old_height)
            x2 = min(x1 + 1, old_width)

            # Get fractional parts
            dy = y - y1
            dx = x - x1

            # Clamp coordinates
            y1 = max(1, min(y1, old_height))
            x1 = max(1, min(x1, old_width))

            # Bilinear interpolation
            if y2 > old_height || x2 > old_width
                resized[i, j] = img[y1, x1]
            else
                resized[i, j] =
                    img[y1, x1] * (1 - dx) * (1 - dy) +
                    img[y1, x2] * dx * (1 - dy) +
                    img[y2, x1] * (1 - dx) * dy +
                    img[y2, x2] * dx * dy
            end
        end
    end

    return resized
end

"""
    mol_scatter(df::DataFrame,
                                      smiles_col::Symbol,
                                      x_col::Symbol,
                                      y_col::Symbol;
                                      color_col::Union{Symbol, Nothing}=nothing,
                                      molecule_size=(500, 500),
                                      figure_size=(1000, 500)) -> Figure

Create an interactive 2D scatter plot where points represent molecules from a DataFrame.

# Arguments

  - `df::DataFrame`: DataFrame containing molecular data
  - `smiles_col::Symbol`: Column name containing SMILES strings
  - `x_col::Symbol`: Column name for x-axis property
  - `y_col::Symbol`: Column name for y-axis property
  - `color_col::Union{Symbol, Nothing}`: Optional column name for coloring points (default: nothing)
  - `molecule_size::Tuple{Int,Int}`: Size of molecule images (default 500x500)
  - `figure_size::Tuple{Int,Int}`: Size of the figure
  - `show_progress::Bool`: Whether to display progress bar during image generation (default: true)
  - `markersize::Real`: Size of the scatter plot points (default: 12)

# Returns

  - `Figure`: Interactive WGLMakie figure

# Example

```julia
using DataFrames

df = DataFrame(;
    smiles = ["CCO", "c1ccccc1", "CC(=O)OC1=CC=CC=C1C(=O)O"],
    molecular_weight = [46.07, 78.11, 180.16],
    logP = [-0.31, 2.13, 1.19],
    tpsa = [20.23, 0.0, 63.6],
)

fig = mol_scatter(
    df, :smiles, :molecular_weight, :logP; color_col = :tpsa
)
```
"""
function mol_scatter(
    df::DataFrame,
    smiles_col::Symbol,
    x_col::Symbol,
    y_col::Symbol;
    color_col::Union{Symbol, Nothing} = nothing,
    molecule_size = (500, 500),
    figure_size = (1000, 500),
    show_progress::Bool = true,
    markersize::Real = 12,
)

    smiles = df[!, smiles_col]
    prop1 = df[!, x_col]
    prop2 = df[!, y_col]
    prop3 = color_col === nothing ? nothing : df[!, color_col]

    prop1_name = string(x_col)
    prop2_name = string(y_col)
    prop3_name = color_col === nothing ? "Property 3" : string(color_col)

    n = nrow(df)
    if n == 0
        error("DataFrame is empty")
    end

    molecule_images = []

    if show_progress
        println("Generating molecule images...")
        progress = Progress(n; desc = "Processing molecules: ")

        for (i, smi) in enumerate(smiles)
            try
                mol = mol_from_smiles(smi)
                img = mol_to_image(mol; size = molecule_size)
                img_rotated = rotate_image_90_right(img)

                push!(molecule_images, img_rotated)
            catch e
                @warn "Failed to generate image for SMILES '$smi': $e"
                placeholder = fill(RGB(0.9, 0.9, 0.9), molecule_size...)
                push!(molecule_images, placeholder)
            end

            next!(progress)
        end

        finish!(progress)
    else
        # Generate images without progress bar
        for (i, smi) in enumerate(smiles)
            try
                mol = mol_from_smiles(smi)
                img = mol_to_image(mol; size = molecule_size)
                img_rotated = rotate_image_90_right(img)

                push!(molecule_images, img_rotated)
            catch e
                @warn "Failed to generate image for SMILES '$smi': $e"
                # Create placeholder image
                placeholder = fill(RGB(0.9, 0.9, 0.9), molecule_size...)
                push!(molecule_images, placeholder)
            end
        end
    end
    println("Making the figure...")
    fig = Figure(; size = figure_size, backgroundcolor = :white, figure_padding = 20)

    # Determine coloring scheme
    if prop3 === nothing
        molecule_colors = [
            colorant"#E63946",  # Red
            colorant"#F77F00",  # Orange
            colorant"#FCBF49",  # Yellow
            colorant"#06D6A0",  # Mint
            colorant"#118AB2",  # Blue
            colorant"#073B4C",  # Dark blue
            colorant"#8E44AD",  # Purple
            colorant"#E74C3C",   # Red variant
        ]
        point_colors = [
            molecule_colors[((i - 1) % length(molecule_colors)) + 1] for
            i in 1:length(smiles)
        ]
        use_colorbar = false
        categorical_legend_info = nothing
    else
        # Check if prop3 is numerical or categorical
        if eltype(prop3) <: Real
            # Use blue-to-green gradient for numerical data
            prop3_min, prop3_max = extrema(prop3)
            prop3_range = prop3_max - prop3_min

            if prop3_range == 0
                point_colors = fill(colorant"#118AB2", n)  
            else
                # Normalize prop3 values to [0, 1]
                normalized_prop3 = (prop3 .- prop3_min) ./ prop3_range

                # Create blue-to-green gradient
                point_colors = [
                    RGB(0.0, 0.4 + 0.6 * val, 0.7 - 0.7 * val) for val in normalized_prop3
                ]
            end
            use_colorbar = true
            categorical_legend_info = nothing
        else
            # Use discrete colors for categorical data
            unique_categories = unique(prop3)
            category_colors = [
                colorant"#E63946",  # Red
                colorant"#118AB2",  # Blue
                colorant"#06D6A0",  # Mint
                colorant"#F77F00",  # Orange
                colorant"#8E44AD",  # Purple
                colorant"#FCBF49",  # Yellow
                colorant"#073B4C",  # Dark blue
                colorant"#E74C3C",   # Red variant
            ]

            # Create mapping from categories to colors
            category_to_color = Dict(
                cat => category_colors[((i - 1) % length(category_colors)) + 1] for
                (i, cat) in enumerate(unique_categories)
            )

            # Assign colors based on categories
            point_colors = [category_to_color[cat] for cat in prop3]
            use_colorbar = false

            # Store category info for legend
            categorical_legend_info = (unique_categories, category_to_color)
        end
    end

    # Main scatter plot with enhanced styling
    ax_main = Axis(
        fig[1, 1];
        title = "Molecular Property Explorer",
        titlesize = 18,
        titlecolor = colorant"#2C3E50",
        xlabel = prop1_name,
        ylabel = prop2_name,
        xlabelsize = 14,
        ylabelsize = 14,
        xgridwidth = 0.5,
        ygridwidth = 0.5,
        xgridcolor = colorant"#ECF0F1",
        ygridcolor = colorant"#ECF0F1",
        topspinevisible = false,
        rightspinevisible = false,
        spinewidth = 1.5,
        xticklabelsize = 12,
        yticklabelsize = 12,
        backgroundcolor = colorant"#FAFBFC",
    )

    # Create scatter plot with configurable marker size
    scatter_plot = scatter!(
        ax_main,
        prop1,
        prop2;
        markersize = markersize,
        color = point_colors,
        strokewidth = 2,
        strokecolor = :white,
        marker = :circle,
    )

    # Layout management based on color coding type
    if prop3 === nothing
        # Standard 2-column layout: scatter + molecule viewer
        ax_img = Axis(
            fig[1, 2];
            title = "Molecular Structure",
            titlesize = 16,
            titlecolor = colorant"#2C3E50",
            aspect = 1,
            backgroundcolor = colorant"#F8F9FA",
        )
    elseif use_colorbar
        # 3-column layout for numerical data: scatter + colorbar + molecule viewer
        # Add colorbar for the gradient in column 2
        colormap_values = [RGB(0.0, 0.4, 0.7), RGB(0.0, 1.0, 0.0)]  # Blue to Green

        Colorbar(
            fig[1, 2];
            limits = (minimum(prop3), maximum(prop3)),
            colormap = colormap_values,
            label = prop3_name,
            labelsize = 12,
            ticklabelsize = 10,
            width = 20,
        )

        # Move molecule viewer to column 3
        ax_img = Axis(
            fig[1, 3];
            title = "Molecular Structure Viewer",
            titlesize = 16,
            titlecolor = colorant"#2C3E50",
            aspect = 1,
            backgroundcolor = colorant"#F8F9FA",
        )
    else
        # 3-column layout for categorical data: scatter + legend + molecule viewer
        # Add categorical legend in column 2
        if categorical_legend_info !== nothing
            unique_categories, category_to_color = categorical_legend_info

            # Create legend elements
            legend_elements = []
            legend_labels = []

            for category in unique_categories
                # Create a scatter point for the legend
                push!(
                    legend_elements,
                    scatter!(
                        ax_main,
                        [NaN],
                        [NaN];
                        color = category_to_color[category],
                        markersize = 12,
                        marker = :circle,
                        visible = false,
                    ),
                )
                push!(legend_labels, string(category))
            end

            Legend(
                fig[1, 2],
                legend_elements,
                legend_labels,
                prop3_name;
                framevisible = true,
                backgroundcolor = colorant"#F8F9FA",
                labelsize = 11,
                titlesize = 12,
            )
        end

        # Move molecule viewer to column 3
        ax_img = Axis(
            fig[1, 3];
            title = "Molecular Structure Viewer",
            titlesize = 16,
            titlecolor = colorant"#2C3E50",
            aspect = 1,
            backgroundcolor = colorant"#F8F9FA",
        )
    end
    hidedecorations!(ax_img)

    # Observable for the currently displayed image
    current_image = Observable(molecule_images[1])

    # Display the current image
    image!(ax_img, current_image)

    # Add a decorative border around the image area
    # Create border points
    border_x = [0, 1, 1, 0, 0]
    border_y = [0, 0, 1, 1, 0]
    lines!(ax_img, border_x, border_y; color = colorant"#34495E", linewidth = 2)

    instructions_text = "Click points to explore molecules • Right-click to reset zoom"
    text!(
        ax_main,
        0.02,
        0.98;
        text = instructions_text,
        fontsize = 12,
        color = colorant"#7F8C8D",
        space = :relative,
        align = (:left, :top),
    )

    # Mouse click interaction
    on(events(fig).mousebutton) do event
        if event.button == Mouse.left && event.action == Mouse.press
            # Get mouse position
            pos = mouseposition(ax_main.scene)

            # Find closest point (normalized distance)
            prop1_range = maximum(prop1) - minimum(prop1)
            prop2_range = maximum(prop2) - minimum(prop2)

            # Avoid division by zero
            prop1_range = prop1_range == 0 ? 1 : prop1_range
            prop2_range = prop2_range == 0 ? 1 : prop2_range

            normalized_distances =
                sqrt.(
                    ((prop1 .- pos[1]) ./ prop1_range) .^ 2 .+
                    ((prop2 .- pos[2]) ./ prop2_range) .^ 2
                )
            closest_idx = argmin(normalized_distances)

            # Check if click is close enough (5% of the plot range)
            if normalized_distances[closest_idx] < 0.05
                # Update displayed image
                current_image[] = molecule_images[closest_idx]

                println("Selected molecule $(closest_idx): $(smiles[closest_idx])")
                println("   $(prop1_name): $(round(prop1[closest_idx], digits=2))")
                println("   $(prop2_name): $(round(prop2[closest_idx], digits=2))")
                if prop3 !== nothing
                    if eltype(prop3) <: Real
                        println("   $(prop3_name): $(round(prop3[closest_idx], digits=2))")
                    else
                        println("   $(prop3_name): $(prop3[closest_idx])")
                    end
                end
            end
            # Right-click to reset zoom
        elseif event.button == Mouse.right && event.action == Mouse.press
            autolimits!(ax_main)
        end
    end

    return fig
end
