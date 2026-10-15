#!/bin/bash
# =============================================================================
# CoopBank Visit Hub Backend - PM2 Runner
# =============================================================================
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

export JAVA_TOOL_OPTIONS="-Dcom.sun.jndi.ldap.object.disableEndpointIdentification=true"

# If a packaged jar exists, run it directly for instant startup and low memory footprint
JAR_PATH="$DIR/target/Coop_Vsit_hub-0.0.1-SNAPSHOT.jar"
if [ -f "$JAR_PATH" ]; then
    echo "[Coop-Backend] Starting from packaged JAR: $JAR_PATH"
    exec java $JAVA_TOOL_OPTIONS -jar "$JAR_PATH"
else
    echo "[Coop-Backend] JAR not found, starting via Maven wrapper..."
    exec ./mvnw spring-boot:run
fi
