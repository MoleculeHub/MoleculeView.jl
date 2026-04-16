using Test
using MoleculeView
using Aqua
using JuliaFormatter
import Base64
using DataFrames

@testset "MoleculeView.jl" begin
    @testset "Code quality (Aqua.jl)" begin
        Aqua.test_all(
            MoleculeView;
            ambiguities = false,
            deps_compat = false,
            stale_deps = false,
        )
    end

    @testset "render_placeholder_molecule" begin
        result = render_placeholder_molecule()
        @test startswith(result, "data:image/svg+xml;base64,")

        b64 = result[(length("data:image/svg+xml;base64,") + 1):end]
        svg = String(Base64.base64decode(b64))
        @test contains(svg, "<svg")
        @test contains(svg, "width=\"200\"")
        @test contains(svg, "height=\"150\"")
        @test contains(svg, "MOL")

        result2 = render_placeholder_molecule((100, 80))
        b64_2 = result2[(length("data:image/svg+xml;base64,") + 1):end]
        svg2 = String(Base64.base64decode(b64_2))
        @test contains(svg2, "width=\"100\"")
        @test contains(svg2, "height=\"80\"")
    end

    @testset "convert_image_to_base64" begin
        # Already a data URI -> unchanged
        uri = "data:image/png;base64,abc123"
        @test MoleculeView.convert_image_to_base64(uri) == uri

        # SVG string -> svg+xml data URI
        svg = "<svg><circle/></svg>"
        result = MoleculeView.convert_image_to_base64(svg)
        @test startswith(result, "data:image/svg+xml;base64,")

        # Vector{UInt8} ot png data URI
        bytes = UInt8[0x89, 0x50, 0x4e, 0x47]
        result = MoleculeView.convert_image_to_base64(bytes)
        @test startswith(result, "data:image/png;base64,")
        decoded = Base64.base64decode(result[(length("data:image/png;base64,") + 1):end])
        @test decoded == bytes
    end

    @testset "render_molecule_image dispatch" begin
        uri = "data:image/png;base64,testdata"
        @test render_molecule_image(uri) == uri

        # Unknown type to placeholder
        result = render_molecule_image(42)
        @test startswith(result, "data:image/svg+xml;base64,")
        b64 = result[(length("data:image/svg+xml;base64,") + 1):end]
        @test contains(String(Base64.base64decode(b64)), "MOL")

        # nothing to placeholder
        result2 = render_molecule_image(nothing)
        @test startswith(result2, "data:image/svg+xml;base64,")
    end

    @testset "render_smiles_molecule" begin
        # Valid SMILES -> some image data 
        result = render_smiles_molecule("CCO")
        @test startswith(result, "data:image/")

        # Invalid SMILES -> placeholder with MOL marker
        result_invalid = render_smiles_molecule("not_a_valid_smiles!!!")
        @test startswith(result_invalid, "data:image/svg+xml;base64,")
        b64 = result_invalid[(length("data:image/svg+xml;base64,") + 1):end]
        @test contains(String(Base64.base64decode(b64)), "MOL")
    end

    @testset "generate_html_template" begin
        html = MoleculeView.generate_html_template()

        @test !isempty(html)
        @test contains(html, "<html")
        @test contains(html, "</html>")

        # All placeholders must be substituted
        @test !contains(html, "{{")
        @test !contains(html, "}}")

        @test contains(html, "setMoleculeData")
        @test contains(html, "<script")
    end

    @testset "save_grid_html" begin
        df = DataFrame(
            id = ["mol1", "mol2"],
            smiles = ["CCO", "not_a_smiles"],
            mw = [46.07, 0.0],
        )
        grid = MolGrid(df; mol_col = "smiles", id_col = "id", properties = ["mw"])

        out_file = tempname() * ".html"
        try
            returned = save_grid_html(grid, out_file)

            @test returned == out_file
            @test isfile(out_file)

            html = read(out_file, String)
            @test contains(html, "<html")
            @test contains(html, "mol1")
            @test contains(html, "mol2")
            @test contains(html, "setMoleculeData")
            @test contains(html, "juliaCallback")
            @test contains(html, "data:image/")
        finally
            isfile(out_file) && rm(out_file)
        end
    end

    @testset "MolGrid construction" begin
        df = DataFrame(id = ["a"], mol = ["CCO"], logp = [1.2], mw = [46.0])

        # Defaults
        g = MolGrid(df)
        @test g.mol_col == "mol"
        @test g.id_col == "id"
        @test g.size == (300, 300)
        @test Set(g.properties) == Set(["logp", "mw"])
        @test startswith(g.grid_id, "grid_")

        # Custom mol/id columns; remaining column becomes the only property
        df2 = DataFrame(smiles = ["C"], name = ["methane"], score = [0.9])
        g2 = MolGrid(df2; mol_col = "smiles", id_col = "name")
        @test g2.mol_col == "smiles"
        @test g2.id_col == "name"
        @test g2.properties == ["score"]

        # Explicit properties override auto-detection
        g3 = MolGrid(df; properties = ["mw"])
        @test g3.properties == ["mw"]

        # Custom image size
        g4 = MolGrid(df; size = (100, 200))
        @test g4.size == (100, 200)
    end
end
