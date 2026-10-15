module.exports = {
  apps: [
    {
      name: 'coop-backend',
      cwd: '/home/elshadayz/Coop_Vsit_hub/Coop_Vsit_hub',
      script: 'java',
      args: [
        '-Dcom.sun.jndi.ldap.object.disableEndpointIdentification=true',
        '-jar',
        'target/Coop_Vsit_hub-0.0.1-SNAPSHOT.jar'
      ],
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 4000,
      env: {
        SPRING_PROFILES_ACTIVE: 'prod'
      }
    }
  ]
};
