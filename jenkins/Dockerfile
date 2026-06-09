FROM jenkins/jenkins:lts-jdk17

USER root

# Install Ansible, its dependencies, and Docker CLI
# Docker CLI is needed so Jenkins can run `docker` commands via the mounted host socket (DooD pattern)
RUN apt-get update && \
    apt-get install -y python3 python3-pip ansible openssh-client docker.io && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Add jenkins user to the docker group (created by docker.io installation above)
# This lets jenkins access /var/run/docker.sock which is mounted from the host
RUN usermod -aG docker jenkins

USER jenkins