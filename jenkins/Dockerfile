FROM jenkins/jenkins:lts-jdk17

USER root

# Install Ansible, Docker CLI, and its dependencies
RUN apt-get update && \
    apt-get install -y python3 python3-pip ansible openssh-client docker.io && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Add jenkins user to docker group
RUN usermod -aG docker jenkins

USER jenkins