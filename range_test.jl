using MoleculeView, DataFrames, CSV
using MoleculeFlow

df = CSV.read("train_data.csv", DataFrame)
df = first(df, 1000)

result = display_mol_grid(
    df,
    mol_col = "SMILES",
    id_col = "CovInDB_ID",
    properties = ["DockingScore", "DockingScoreMAOB", "DockingScoreACHE", "Site"],
    size = (300, 300),
    open_browser = true
)
