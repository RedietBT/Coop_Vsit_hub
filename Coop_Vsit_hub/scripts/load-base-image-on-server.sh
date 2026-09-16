#!/usr/bin/env bash
# Load Temurin JRE on an offline/internal host after copying the tarball from a machine that can reach Docker Hub.
#
# On a machine with internet:
#   docker pull eclipse-temurin:21-jre-alpine
#   docker save eclipse-temurin:21-jre-alpine -o temurin-21-jre-alpine.tar
#   scp temurin-21-jre-alpine.tar user@10.8.101.151:/tmp/
#
# On 10.8.101.151:
#   docker load -i /tmp/temurin-21-jre-alpine.tar
#   docker build -f Dockerfile.runtime -t coop-backend .

set -euo pipefail
TAR="${1:-/tmp/temurin-21-jre-alpine.tar}"
docker load -i "$TAR"
echo "Loaded. Verify: docker images eclipse-temurin"
