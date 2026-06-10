FROM jenkins/jenkins:lts-jdk17

USER root

# Install Ansible, its dependencies, and Docker CLI
# Docker CLI is needed so Jenkins can run `docker` commands via the mounted host socket (DooD pattern)
RUN apt-get update && \
    apt-get install -y python3 python3-pip ansible openssh-client docker.io curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js 20 LTS via the official NodeSource setup script.
# This lets Jenkins run `npm ci` and `npm run coverage` directly in the Frontend Tests
# stage — no `docker run node:20-alpine` wrapper needed, so docker socket permissions
# are never a concern during the test phase.
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Add jenkins user to the docker group (created by docker.io installation above)
# This lets jenkins access /var/run/docker.sock which is mounted from the host
RUN usermod -aG docker jenkins

USER jenkins