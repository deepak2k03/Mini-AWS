Write-Host "Building Mini-AWS Instance Images..."

Set-Location $PSScriptRoot

docker build -t mini-aws/alpine-ssh:3.21 -f alpine/Dockerfile .
if ($LASTEXITCODE -ne 0) { throw "Alpine build failed" }

docker build -t mini-aws/ubuntu-ssh:24.04 -f ubuntu/Dockerfile .
if ($LASTEXITCODE -ne 0) { throw "Ubuntu build failed" }

docker build -t mini-aws/debian-ssh:13 -f debian/Dockerfile .
if ($LASTEXITCODE -ne 0) { throw "Debian build failed" }

docker build -t mini-aws/fedora-ssh:41 -f fedora/Dockerfile .
if ($LASTEXITCODE -ne 0) { throw "Fedora build failed" }

docker build -t mini-aws/rocky-ssh:9 -f rocky/Dockerfile .
if ($LASTEXITCODE -ne 0) { throw "Rocky build failed" }

Write-Host "All images built successfully!"
