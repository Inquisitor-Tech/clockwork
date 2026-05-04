# cleanup.ps1
# Run this from your project root:
# cd "C:\Users\User\Desktop\Coding Projects\clockwork-tracking-for-lawyers"
# .\cleanup.ps1

Write-Host "Cleaning up empty and conflicting files..." -ForegroundColor Cyan

# Remove old empty screen folders
$foldersToRemove = @(
    "app\clients",
    "app\consultations",
    "src"
)

foreach ($folder in $foldersToRemove) {
    if (Test-Path $folder) {
        Remove-Item -Recurse -Force $folder
        Write-Host "  Removed folder: $folder" -ForegroundColor Green
    }
}

# Remove old root-level screens that are no longer used
$filesToRemove = @(
    "app\home.tsx",
    "app\login.tsx",
    "app\signup.tsx",
    "app\index.tsx"
)

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Remove-Item -Force $file
        Write-Host "  Removed file: $file" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Done. Your project structure is now clean." -ForegroundColor Cyan
Write-Host ""
Write-Host "Final app folder structure:" -ForegroundColor Yellow
Get-ChildItem -Recurse "app" -Include "*.tsx" | Select-Object FullName
