FROM jenkins/jenkins:lts-jdk17

USER root

# Install Ansible, its dependencies, and Docker CLI
# Docker CLI is needed so Jenkins can run `docker` commands via the mounted host socket (DooD pattern)
RUN apt-get update && \
    apt-get install -y python3 python3-pip ansible openssh-client docker.io && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Add jenkins user to the docker group so it can access /var/run/docker.sock
# GID 999 is the standard docker group GID on most Linux distros (Amazon Linux, Ubuntu, Debian)
# If your host uses a different GID, change 999 to match: run `getent group docker` on the host
RUN groupmod -g 999 docker && usermod -aG docker jenkins

USER jenkins