pipeline {
    agent any

    environment {
        // Azure Container Registry settings
        ACR_NAME         = "${env.ACR_NAME}"
        ACR_LOGIN_SERVER = "${env.ACR_LOGIN_SERVER}"
        ACR_BACKEND      = "${ACR_LOGIN_SERVER}/deploy-project-backend"
        ACR_FRONTEND     = "${ACR_LOGIN_SERVER}/deploy-project-frontend"

        // Azure VM connection
        AZURE_VM_HOST    = "${env.AZURE_VM_HOST}"
        VM_USER          = "azureuser"

        IMAGE_TAG        = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // Run backend (pytest) and frontend (vitest) tests to generate coverage reports
        stage('Test') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        sh """
                            cd backend
                            pip3 install -r requirements.txt --break-system-packages -q
                            mkdir -p coverage-reports
                            python3 -m pytest tests/ \\
                              --cov=. \\
                              --cov-report=xml:coverage-reports/coverage.xml \\
                              --cov-config=.coveragerc \\
                              -q
                        """
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        sh '''
                            cd frontend
                            npm ci --no-fund --no-audit
                            npm run coverage
                        '''
                    }
                }
            }
        }

        // SonarQube static analysis
        stage('SonarQube Analysis') {
            steps {
                script {
                    withSonarQubeEnv('SonarQube') {
                        def scannerHome = tool 'SonarScanner'
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
        }

        // Quality Gate check
        stage('Quality Gate') {
            steps {
                timeout(time: 2, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // Build Docker images tagged for ACR
        stage('Build Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        sh "docker build -t ${ACR_BACKEND}:${IMAGE_TAG} ./backend"
                        sh "docker tag ${ACR_BACKEND}:${IMAGE_TAG} ${ACR_BACKEND}:latest"
                    }
                }
                stage('Build Frontend') {
                    steps {
                        sh "docker build -t ${ACR_FRONTEND}:${IMAGE_TAG} ./frontend"
                        sh "docker tag ${ACR_FRONTEND}:${IMAGE_TAG} ${ACR_FRONTEND}:latest"
                    }
                }
            }
        }

        // Push images to Azure Container Registry
        stage('Push to ACR') {
            steps {
                withCredentials([
                    string(credentialsId: 'azure-client-id',       variable: 'ARM_CLIENT_ID'),
                    string(credentialsId: 'azure-client-secret',   variable: 'ARM_CLIENT_SECRET'),
                    string(credentialsId: 'azure-tenant-id',       variable: 'ARM_TENANT_ID'),
                    string(credentialsId: 'azure-subscription-id', variable: 'ARM_SUBSCRIPTION_ID')
                ]) {
                    sh """
                        # Login to Azure using the Service Principal
                        az login --service-principal \\
                          --username \$ARM_CLIENT_ID \\
                          --password \$ARM_CLIENT_SECRET \\
                          --tenant \$ARM_TENANT_ID

                        # Login to ACR
                        az acr login --name ${ACR_NAME}

                        # Push images
                        docker push ${ACR_BACKEND}:${IMAGE_TAG}
                        docker push ${ACR_BACKEND}:latest
                        docker push ${ACR_FRONTEND}:${IMAGE_TAG}
                        docker push ${ACR_FRONTEND}:latest

                        # Logout
                        az logout
                    """
                }
            }
        }

        // Deploy using Ansible
        stage('Deploy via Ansible') {
            steps {
                // Use only the file credential — sshagent is removed intentionally.
                // sshagent sets SSH_AUTH_SOCK which causes Ansible to use ControlMaster
                // SSH multiplexing; that breaks inside containers (socket connection refused).
                withCredentials([file(credentialsId: 'azure-ssh-key-file', variable: 'SSH_KEY_FILE')]) {
                    // Copy SSH key to a temp location Ansible can use
                    sh "cp ${SSH_KEY_FILE} /tmp/azure_vm_key.pem && chmod 600 /tmp/azure_vm_key.pem"

                    // Write the inventory file dynamically with the real Azure VM IP
                    sh "sed 's/{{ EC2_HOST_VALUE }}/${AZURE_VM_HOST}/' ansible/inventory.ini > /tmp/ansible_inventory.ini"

                    // Purge any stale Ansible ControlMaster sockets left over from previous
                    // runs. These persist across builds and cause "connection refused" even
                    // after ControlMaster is disabled in ansible.cfg.
                    sh "rm -f /var/jenkins_home/.ansible/cp/*"

                    // Run the Ansible playbook.
                    // ANSIBLE_CONFIG must be set explicitly — Ansible only searches the CWD
                    // (workspace root), not subdirectories, so ansible/ansible.cfg is ignored otherwise.
                    sh """
                        export ANSIBLE_CONFIG=ansible/ansible.cfg
                        ansible-playbook ansible/deploy.yml \\
                          -i /tmp/ansible_inventory.ini \\
                          --extra-vars "acr_backend=${ACR_BACKEND} acr_frontend=${ACR_FRONTEND} acr_login_server=${ACR_LOGIN_SERVER} acr_name=${ACR_NAME}"
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful! Build #${BUILD_NUMBER} is live."
        }
        failure {
            echo "❌ Pipeline failed. Check console output for details."
        }
        always {
            sh "docker image prune -f"
            sh "rm -f /tmp/azure_vm_key.pem /tmp/ansible_inventory.ini"
        }
    }
}