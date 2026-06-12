FROM jenkins/jenkins:lts-jdk17

USER root

# Install Ansible, its dependencies, Docker CLI, and Azure CLI
RUN apt-get update && \
    apt-get install -y python3 python3-pip ansible openssh-client docker.io curl ca-certificates gnupg lsb-release && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Azure CLI
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Install Node.js 20 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Add jenkins user to the docker group
RUN usermod -aG docker jenkins

USER jenkins