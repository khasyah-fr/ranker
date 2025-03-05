pipeline {
    agent any
    
    stages {
        stage('Checkout Code') {
            steps {
                echo 'Checking out code from Github...'
                git url: 'https://github.com/khasyah-fr/ranker.git', branch: 'master'
            }
        }
        
        stage('Build and Deploy Services') {
            steps {
                script {
                    echo 'Building and deploying Docker containers...'
                    sh 'docker-compose down'
                    sh 'docker-compose up -d --build'
                }
            }
        }
        
        stage('Wait and Observe') {
            steps {
                script {
                    echo 'Waiting for 5 minutes to observe logs...'
                    sleep(time: 5, unit: 'MINUTES')
                }
            }
        }
        
        stage('Clean Up') {
            steps {
                script {
                    echo 'Stopping and cleaning up Docker containers...'
                    sh 'docker-compose down'
                }
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline finished.'
        }
    }
}