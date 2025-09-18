using Test
using MoleculeView
using Aqua
using JuliaFormatter

@testset "MoleculeView.jl" begin
    @testset "Code quality (Aqua.jl)" begin
        Aqua.test_all(
            MoleculeView;
            ambiguities = false,
            deps_compat = false,
            stale_deps = false,
        )
    end
end
