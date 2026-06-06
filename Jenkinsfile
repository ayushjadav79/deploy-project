pipeline {
    agent any

    environment {
        AWS_REGION      = "ap-south-1"
        AWS_ACCOUNT_ID  = "${env.AWS_ACCOUNT_ID}"
        ECR_BACKEND     = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/deploy-project-backend"
        ECR_FRONTEND    = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/deploy-project-frontend"
        ECR_REGISTRY    = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        EC2_HOST        = "${env.EC2_HOST}"
        EC2_USER        = "ec2-user"
        IMAGE_TAG       = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // NEW: Run SonarQube static analysis on the codebase
        stage('SonarQube Analysis') {
            steps {
                script {
                    // 'SonarQube' matches the name you set in Manage Jenkins → System
                    withSonarQubeEnv('SonarQube') {
                        // 'SonarScanner' matches the name in Manage Jenkins → Tools
                        def scannerHome = tool 'SonarScanner'
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
        }

        // NEW: Wait for SonarQube to process results and check quality gate
        // Quality Gate = set of conditions (e.g., code coverage, bugs, vulnerabilities)
        // If it FAILS, the pipeline stops here — no bad code gets deployed
        stage('Quality Gate') {
            steps {
                timeout(time: 2, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        sh "docker build -t ${ECR_BACKEND}:${IMAGE_TAG} ./backend"
                        sh "docker tag ${ECR_BACKEND}:${IMAGE_TAG} ${ECR_BACKEND}:latest"
                    }
                }
                stage('Build Frontend') {
                    steps {
                        sh "docker build -t ${ECR_FRONTEND}:${IMAGE_TAG} ./frontend"
                        sh "docker tag ${ECR_FRONTEND}:${IMAGE_TAG} ${ECR_FRONTEND}:latest"
                    }
                }
            }
        }

        stage('Push to ECR') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                    sh """
                        aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${ECR_REGISTRY}

                        docker push ${ECR_BACKEND}:${IMAGE_TAG}
                        docker push ${ECR_BACKEND}:latest
                        docker push ${ECR_FRONTEND}:${IMAGE_TAG}
                        docker push ${ECR_FRONTEND}:latest
                    """
                }
            }
        }

        // NEW: Deploy using Ansible instead of raw SSH
        // Ansible is idempotent, structured, and handles all setup automatically
        stage('Deploy via Ansible') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    withCredentials([file(credentialsId: 'ec2-ssh-key-file', variable: 'SSH_KEY_FILE')]) {
                        // Copy SSH key to a temp location Ansible can use
                        sh "cp ${SSH_KEY_FILE} /tmp/ec2_key.pem && chmod 600 /tmp/ec2_key.pem"

                        // Write the inventory file dynamically with the real EC2 IP
                        sh """
                            sed 's/{{ EC2_HOST_VALUE }}/${EC2_HOST}/' ansible/inventory.ini > /tmp/ansible_inventory.ini
                        """

                        // Copy .env file so Ansible can upload it to EC2
                        sh "cp .env /tmp/app.env"

                        // Run the Ansible playbook
                        sh """
                            ansible-playbook ansible/deploy.yml \
                              -i /tmp/ansible_inventory.ini \
                              --extra-vars "ecr_backend=${ECR_BACKEND} ecr_frontend=${ECR_FRONTEND} ecr_registry=${ECR_REGISTRY} aws_region=${AWS_REGION}"
                        """
                    }
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
            sh "rm -f /tmp/ec2_key.pem /tmp/app.env /tmp/ansible_inventory.ini"
        }
    }
}