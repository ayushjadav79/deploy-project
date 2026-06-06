FROM jenkins/jenkins:lts-jdk17

USER root

# Install Ansible and its dependencies
RUN apt-get update && \
    apt-get install -y python3 python3-pip ansible openssh-client && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

USER jenkins