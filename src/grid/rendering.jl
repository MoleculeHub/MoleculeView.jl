using MoleculeFlow
using FileIO, ImageIO


function render_molecule_image(mol_data, size = (200, 150))
    # If mol_data is already a base64 encoded image string, return it
    if isa(mol_data, String) && startswith(mol_data, "data:image/")
        return mol_data
    end

    # If SMILES string
    if isa(mol_data, String)
        return render_smiles_molecule(mol_data, size)
    end

    if isa(mol_data, Molecule)
        try
            image_data = mol_to_image(mol_data; size = size)
            return convert_image_to_base64(image_data)
        catch e
            @warn "Failed to render molecule: $e"
            return render_placeholder_molecule(size)
        end
    end

    # Default to placeholder for unknown types
    return render_placeholder_molecule(size)
end


function render_placeholder_molecule(size = (200, 150))
    placeholder_svg = """
    <svg width="$(size[1])" height="$(size[2])" xmlns="http://www.w3.org/2000/svg">
        <rect width="$(size[1])" height="$(size[2])" fill="#f8f9fa" stroke="#dee2e6"/>
        <circle cx="$(size[1]÷2)" cy="$(size[2]÷2)" r="30" fill="#007bff" opacity="0.7"/>
        <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle"
              font-family="sans-serif" font-size="12" fill="white">MOL</text>
    </svg>
    """
    return "data:image/svg+xml;base64," * Base64.base64encode(placeholder_svg)
end


function render_smiles_molecule(smiles::String, size = (200, 150))
    try
        mol = mol_from_smiles(smiles)
        image_data = mol_to_image(mol; size = size)
        return convert_image_to_base64(image_data)
    catch e
        @warn "Failed to render SMILES '$smiles': $e"
        return render_placeholder_molecule(size)
    end
end


function render_generic_molecule(mol_data, size = (200, 150))
    try
        if isa(mol_data, Molecule)
            image_data = mol_to_image(mol_data; size = size)
            return convert_image_to_base64(image_data)
        else
            return render_placeholder_molecule(size)
        end
    catch e
        @warn "Failed to render molecule: $e"
        return render_placeholder_molecule(size)
    end
end


function convert_image_to_base64(image_data)
    try
        if isa(image_data, String) && startswith(image_data, "data:")
            return image_data
        end

        # If it's a color matrix from MoleculeFlow, convert to PNG
        if isa(image_data, Matrix)
            # Create a temporary file to save the image
            temp_path = tempname() * ".png"
            FileIO.save(temp_path, image_data)

            # Read the file as bytes and encode as base64
            png_bytes = read(temp_path)
            rm(temp_path)  

            return "data:image/png;base64," * Base64.base64encode(png_bytes)
        end

        if isa(image_data, Vector{UInt8})
            return "data:image/png;base64," * Base64.base64encode(image_data)
        end

        if isa(image_data, String) && contains(image_data, "<svg")
            return "data:image/svg+xml;base64," * Base64.base64encode(image_data)
        end

        return "data:image/png;base64," * Base64.base64encode(string(image_data))
    catch e
        @warn "Failed to convert image to base64: $e"
        return render_placeholder_molecule()
    end
end
