#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "Building Mini-AWS Instance Images..."

docker build -t mini-aws/alpine-ssh:3.21 -f alpine/Dockerfile .
docker build -t mini-aws/ubuntu-ssh:24.04 -f ubuntu/Dockerfile .
docker build -t mini-aws/debian-ssh:13 -f debian/Dockerfile .
docker build -t mini-aws/fedora-ssh:41 -f fedora/Dockerfile .
docker build -t mini-aws/rocky-ssh:9 -f rocky/Dockerfile .

echo "All images built successfully!"
