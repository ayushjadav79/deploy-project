pipeline {
    agent any

    environment {
        AWS_REGION      = "ap-south-1"
        AWS_ACCOUNT_ID  = "${env.AWS_ACCOUNT_ID}" // Defined in Jenkins -> System -> Global Properties
        ECR_BACKEND     = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/deploy-project-backend"
        ECR_FRONTEND    = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/deploy-project-frontend"
        EC2_HOST        = "${env.EC2_HOST}"       // Defined in Jenkins -> System -> Global Properties
        EC2_USER        = "ec2-user"               // Amazon Linux default user
        IMAGE_TAG       = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
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
                        docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                        
                        docker push ${ECR_BACKEND}:${IMAGE_TAG}
                        docker push ${ECR_BACKEND}:latest
                        docker push ${ECR_FRONTEND}:${IMAGE_TAG}
                        docker push ${ECR_FRONTEND}:latest
                    """
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} '
                            # Login to ECR from EC2 (EC2 uses IAM role, no keys needed)
                            aws ecr get-login-password --region ${AWS_REGION} | \
                            docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                            
                            # Pull latest images
                            docker pull ${ECR_BACKEND}:latest
                            docker pull ${ECR_FRONTEND}:latest
                            
                            # Navigate to app and restart with new images
                            cd /home/ec2-user/app
                            docker compose pull
                            docker compose up -d --no-build
                        '
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
            // Clean up local Docker images to save disk space
            sh "docker image prune -f"
        }
    }
}