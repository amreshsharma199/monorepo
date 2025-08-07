pipeline {
  agent {
    docker {
      image 'docker:24.0.7-dind'  // Alpine based Docker image with Docker daemon
      args '-v /var/run/docker.sock:/var/run/docker.sock -u root'
    }
  }

  environment {
    REGISTRY_CRED_ID = 'dockerhub-creds'
    IMAGE_PREFIX = 'amreshsharma199'
    BRANCH = "${env.BRANCH_NAME}"
  }

  options {
    skipDefaultCheckout true
  }

  stages {
    stage('Checkout Code') {
      steps {
        checkout scm
      }
    }

    stage('Detect Changed App') {
      steps {
        script {
          def diff = sh(script: "git diff --name-only origin/${BRANCH}~1 origin/${BRANCH}", returnStdout: true).trim()
          echo "Changed files:\n${diff}"

          changedApp = ''
          if (diff.contains('java-app/')) {
            changedApp = 'java-app'
          } else if (diff.contains('node-app/')) {
            changedApp = 'node-app'
          } else if (diff.contains('python-app/')) {
            changedApp = 'python-app'
          } else if (diff.contains('dotnet-app/')) {
            changedApp = 'dotnet-app'
          } else {
            echo "No app-related changes detected. Skipping pipeline."
            currentBuild.result = 'SUCCESS'
            return
          }

          env.APP = changedApp
          echo "Detected changed app: ${env.APP}"
        }
      }
    }

    stage('Run Tests') {
      when {
        expression { return env.APP != null }
      }
      steps {
        script {
          dir("${APP}") {
            if (APP == 'java-app') {
              sh 'apk add openjdk17 maven && mvn test'
            } else if (APP == 'node-app') {
              sh 'apk add nodejs npm && npm install && npm test'
            } else if (APP == 'python-app') {
              sh 'apk add python3 py3-pip && pip install -r requirements.txt && pytest'
            } else if (APP == 'dotnet-app') {
              sh 'apk add bash curl icu-libs krb5-libs libgcc libintl libssl1.1 libstdc++ zlib && echo "dotnet testing skipped (needs SDK setup)"'
              // Dotnet ke liye Alpine image se testing karna tricky hota hai
            }
          }
        }
      }
    }

    stage('Build Docker Image') {
      when {
        expression { return env.APP != null }
      }
      steps {
        dir("${APP}") {
          script {
            sh "docker build -t ${IMAGE_PREFIX}/${APP}:${BRANCH}-${BUILD_NUMBER} ."
          }
        }
      }
    }

    stage('Push to Registry') {
      when {
        allOf {
          expression { return env.APP != null }
          anyOf {
            branch 'dev'
            branch 'qa'
            branch 'prod'
          }
        }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: "${REGISTRY_CRED_ID}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
          sh "docker push ${IMAGE_PREFIX}/${APP}:${BRANCH}-${BUILD_NUMBER}"
        }
      }
    }

    stage('Deploy') {
      when {
        anyOf {
          branch 'dev'
          branch 'qa'
          branch 'prod'
        }
      }
      steps {
        script {
          def portMap = [
            'java-app'   : '8080',
            'node-app'   : '3000',
            'python-app' : '5000',
            'dotnet-app' : '5000'
          ]
          def port = portMap[APP]

          sh "docker rm -f ${APP} || true"
          sh "docker run -d --name ${APP} -p ${port}:${port} ${IMAGE_PREFIX}/${APP}:${BRANCH}-${BUILD_NUMBER}"
        }
      }
    }
  }

  post {
    failure {
      echo '❌ Build failed!'
    }
    success {
      echo "✅ Build and deployment of ${APP} to ${BRANCH} successful!"
    }
  }
}


// pipeline {
//   agent any

//   environment {
//     REGISTRY_CRED_ID = 'dockerhub-creds'   // Jenkins credentials ID
//     IMAGE_PREFIX = 'amreshsharma199' // Update this as needed
//     BRANCH = "${env.BRANCH_NAME}"
//   }

//   options {
//     skipDefaultCheckout true
//   }

//   stages {
//     stage('Checkout Code') {
//       steps {
//         checkout scm
//       }
//     }

//     stage('Detect Changed App') {
//       steps {
//         script {
//           def diff = sh(script: "git diff --name-only origin/${BRANCH}~1 origin/${BRANCH}", returnStdout: true).trim()
//           echo "Changed files:\n${diff}"

//           changedApp = ''
//           if (diff.contains('java-app/')) {
//             changedApp = 'java-app'
//           } else if (diff.contains('node-app/')) {
//             changedApp = 'node-app'
//           } else if (diff.contains('python-app/')) {
//             changedApp = 'python-app'
//           } else if (diff.contains('dotnet-app/')) {
//             changedApp = 'dotnet-app'
//           } else {
//             echo "No app-related changes detected. Skipping pipeline."
//             currentBuild.result = 'SUCCESS'
//             return
//           }

//           env.APP = changedApp
//           echo "Detected changed app: ${env.APP}"
//         }
//       }
//     }

//     stage('Run Tests') {
//       when {
//         expression { return env.APP != null }
//       }
//       steps {
//         script {
//           dir("${APP}") {
//             if (APP == 'java-app') {
//               sh 'mvn test'
//             } else if (APP == 'node-app') {
//               sh 'npm install'
//               sh 'npm test'
//             } else if (APP == 'python-app') {
//               sh 'pip install -r requirements.txt'
//               sh 'pytest'
//             } else if (APP == 'dotnet-app') {
//               sh 'dotnet restore'
//               sh 'dotnet test'
//             }
//           }
//         }
//       }
//     }

//     stage('Build Docker Image') {
//       when {
//         expression { return env.APP != null }
//       }
//       steps {
//         dir("${APP}") {
//           script {
//             sh "docker build -t ${IMAGE_PREFIX}/${APP}:${BRANCH}-${BUILD_NUMBER} ."
//           }
//         }
//       }
//     }

//     stage('Push to Registry') {
//       when {
//         allOf {
//           expression { return env.APP != null }
//           anyOf {
//             branch 'dev'
//             branch 'qa'
//             branch 'prod'
//           }
//         }
//       }
//       steps {
//         withCredentials([usernamePassword(credentialsId: "${REGISTRY_CRED_ID}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
//           sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
//           sh "docker push ${IMAGE_PREFIX}/${APP}:${BRANCH}-${BUILD_NUMBER}"
//         }
//       }
//     }

//     stage('Deploy') {
//       when {
//         anyOf {
//           branch 'dev'
//           branch 'qa'
//           branch 'prod'
//         }
//       }
//       steps {
//         script {
//           def portMap = [
//             'java-app'   : '8080',
//             'node-app'   : '3000',
//             'python-app' : '5000',
//             'dotnet-app' : '5000'
//           ]
//           def port = portMap[APP]

//           sh "docker rm -f ${APP} || true"
//           sh "docker run -d --name ${APP} -p ${port}:${port} ${IMAGE_PREFIX}/${APP}:${BRANCH}-${BUILD_NUMBER}"
//         }
//       }
//     }
//   }

//   post {
//     failure {
//       echo '❌ Build failed!'
//     }
//     success {
//       echo "✅ Build and deployment of ${APP} to ${BRANCH} successful!"
//     }
//   }
// }
