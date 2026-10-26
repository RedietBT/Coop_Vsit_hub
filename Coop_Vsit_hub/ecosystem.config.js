const fs = require('fs');
const path = require('path');

function parseEnv(filePath) {
  const env = {};
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx !== -1) {
        const key = line.substring(0, idx).trim();
        let val = line.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        env[key] = val;
      }
    }
  }
  return env;
}

const envRoot = parseEnv(path.join(__dirname, '../.env'));
const envBackend = parseEnv(path.join(__dirname, '.env'));
const mergedEnv = Object.assign({}, envRoot, envBackend, {
  SPRING_PROFILES_ACTIVE: 'prod',
  COOPBANK_AD_USERNAME: "CN=Business Process Model,OU=Coopbank Application Users,DC=coopbank,DC=local",
  COOPBANK_AD_PASSWORD: "Lu01J3)£9R}~(rkv",
  AD_USERNAME: "CN=Business Process Model,OU=Coopbank Application Users,DC=coopbank,DC=local",
  AD_PASSWORD: "Lu01J3)£9R}~(rkv"
});

module.exports = {
  apps: [
    {
      name: 'coop-backend',
      cwd: '/home/elshadayz/Coop_Vsit_hub/Coop_Vsit_hub',
      script: 'java',
      args: [
        '-Dcom.sun.jndi.ldap.object.disableEndpointIdentification=true',
        '-jar',
        'target/Coop_Vsit_hub-0.0.1-SNAPSHOT.jar',
        '--spring.config.additional-location=file:./src/main/resources/application.properties'
      ],
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 4000,
      env: mergedEnv
    }
  ]
};

