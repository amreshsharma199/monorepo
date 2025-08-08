pipeline {
  agent none

  environment {
    REGISTRY_CRED_ID = 'dockerhub-creds'
    IMAGE_PREFIX = 'amreshsharma199'
  }

  options {
    skipDefaultCheckout true
  }

  stages {
    stage('Checkout Code') {
      agent { label 'jenkinsslave' }
      steps {
        checkout scm
        script {
          env.BRANCH = env.BRANCH_NAME
        }
      }
    }

    stage('Detect Changed App') {
      agent { label 'jenkinsslave' }
      steps {
        script {
          def diff = sh(script: "git diff --name-only origin/${BRANCH}~1 origin/${BRANCH}", returnStdout: true).trim()
          echo "Changed files:\n${diff}"

          def changedApp = ''
          if (diff.contains('java-app/')) {
            changedApp = 'java-app'
          } else if (diff.contains('node-app/')) {
            changedApp = 'node-app'
          } else if (diff.contains('python-app/')) {
            changedApp = 'python-app'
          } else if (diff.contains('dotnet-app/')) {
            changedApp = 'dotnet-app'
          }

          if (!changedApp) {
            echo "No app-related changes detected. Skipping pipeline."
            currentBuild.result = 'SUCCESS'
            return
          }

          env.APP = changedApp
          echo "Detected changed app: ${env.APP}"
        }
      }
    }

    stage('Run Tests in Ephemeral Container') {
      when { expression { return env.APP } }
      agent {
        docker {
          image 'docker:24.0.7-cli'
          args '-v /var/run/docker.sock:/var/run/docker.sock -u root'
        }
      }
      steps {
        script {
          dir("${APP}") {
            if (APP == 'java-app') {
              sh 'apk add --no-cache openjdk17 maven && mvn test'
            } else if (APP == 'node-app') {
              sh 'apk add --no-cache nodejs npm && npm install && npm test'
            } else if (APP == 'python-app') {
              sh 'apk add --no-cache python3 py3-pip && pip install -r requirements.txt && pytest'
            } else if (APP == 'dotnet-app') {
              sh 'apk add --no-cache bash curl icu-libs krb5-libs libgcc libintl libssl1.1 libstdc++ zlib && echo "dotnet testing skipped (needs SDK setup)"'
            }
          }
        }
      }
    }

    stage('Build & Push Docker Image') {
      when {
        allOf {
          expression { return env.APP }
          anyOf { branch 'dev'; branch 'qa'; branch 'prod' }
        }
      }
      agent {
        docker {
          image 'docker:24.0.7-cli'
          args '-v /var/run/docker.sock:/var/run/docker.sock -u root'
        }
      }
      steps {
        script {
          sh "cd ${APP} && docker build -t ${IMAGE_PREFIX}/${APP}:${BRANCH}-${BUILD_NUMBER} ."
          withCredentials([usernamePassword(credentialsId: "${REGISTRY_CRED_ID}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
            sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
            sh "docker push ${IMAGE_PREFIX}/${APP}:${BRANCH}-${BUILD_NUMBER}"
          }
        }
      }
    }

    stage('Deploy') {
      when {
        allOf {
          expression { return env.APP }
          anyOf { branch 'dev'; branch 'qa'; branch 'prod' }
        }
      }
      agent { label 'master' }
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
      script {
        if (env.APP) {
          echo "✅ Build and deployment of ${APP} to ${BRANCH} successful!"
        }
      }
    }
  }
}
// pipeline {
//   agent any

//   environment {
//     IMAGE_PREFIX = 'amreshsharma199'
//     REGISTRY_CRED_ID = 'dockerhub-creds'
//     BRANCH = "${env.BRANCH_NAME}"
//   }

//   options {
//     skipDefaultCheckout true
//   }

//   stages {
//     stage('Checkout') {
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
//           if (diff.contains('java-app/')) changedApp = 'java-app'
//           else if (diff.contains('node-app/')) changedApp = 'node-app'
//           else if (diff.contains('python-app/')) changedApp = 'python-app'
//           else if (diff.contains('dotnet-app/')) changedApp = 'dotnet-app'
//           else {
//             echo "No app-related changes detected. Skipping pipeline."
//             currentBuild.result = 'SUCCESS'
//             return
//           }

//           env.APP = changedApp
//           echo "Detected changed app: ${env.APP}"
//         }
//       }
//     }

//     stage('Run Tests in Container') {
//       when { expression { return env.APP != null } }
//       steps {
//         script {
//           if (APP == 'java-app') {
//             docker.image('maven:3.9.9-eclipse-temurin-17').inside {
//               sh "cd ${APP} && mvn test"
//             }
//           } else if (APP == 'node-app') {
//             docker.image('node:20-alpine').inside {
//               sh "cd ${APP} && npm install && npm test"
//             }
//           } else if (APP == 'python-app') {
//             docker.image('python:3.11-alpine').inside {
//               sh "cd ${APP} && pip install -r requirements.txt && pytest"
//             }
//           } else if (APP == 'dotnet-app') {
//             docker.image('mcr.microsoft.com/dotnet/sdk:8.0').inside {
//               sh "cd ${APP} && dotnet test"
//             }
//           }
//         }
//       }
//     }

//     stage('Build Docker Image') {
//       when { expression { return env.APP != null } }
//       steps {
//         script {
//           docker.image('docker:24.0.7-cli').inside('-v /var/run/docker.sock:/var/run/docker.sock') {
//             sh "cd ${APP} && docker build -t ${IMAGE_PREFIX}/${APP}:${BRANCH}-${BUILD_NUMBER} ."
//           }
//         }
//       }
//     }

//     stage('Push to Registry') {
//       when {
//         allOf {
//           expression { return env.APP != null }
//           anyOf { branch 'dev'; branch 'qa'; branch 'prod' }
//         }
//       }
//       steps {
//         docker.image('docker:24.0.7-cli').inside('-v /var/run/docker.sock:/var/run/docker.sock') {
//           withCredentials([usernamePassword(credentialsId: "${REGISTRY_CRED_ID}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
//             sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
//             sh "docker push ${IMAGE_PREFIX}/${APP}:${BRANCH}-${BUILD_NUMBER}"
//           }
//         }
//       }
//     }
//   }

//   post {
//     failure { echo '❌ Build failed!' }
//     success { echo "✅ Build and deployment of ${APP} to ${BRANCH} successful!" }
//   }
// }
// // pipeline {
// //   agent none   // Default कोई agent नहीं, हर stage अपना container लेगा

// //   environment {
// //     REGISTRY_CRED_ID = 'dockerhub-creds'
// //     IMAGE_PREFIX     = 'amreshsharma199'
// //     BRANCH           = "${env.BRANCH_NAME}"
// //   }

// //   stages {
// //     stage('Checkout') {
// //       agent { label 'docker' } // Slave जिस पर docker available है
// //       steps {
// //         checkout scm
// //       }
// //     }

// //     stage('Detect Changed App') {
// //       agent { label 'docker' }
// //       steps {
// //         script {
// //           def diff = sh(script: "git diff --name-only origin/${BRANCH}~1 origin/${BRANCH}", returnStdout: true).trim()
// //           echo "Changed files:\n${diff}"

// //           if (diff.contains('java-app/')) {
// //             env.APP = 'java-app'
// //           } else if (diff.contains('node-app/')) {
// //             env.APP = 'node-app'
// //           } else if (diff.contains('python-app/')) {
// //             env.APP = 'python-app'
// //           } else if (diff.contains('dotnet-app/')) {
// //             env.APP = 'dotnet-app'
// //           } else {
// //             echo "No app-related changes detected. Skipping pipeline."
// //             currentBuild.result = 'SUCCESS'
// //             return
// //           }
// //           echo "Detected changed app: ${env.APP}"
// //         }
// //       }
// //     }

// //     stage('Test & Build in Ephemeral Container') {
// //       when { expression { return env.APP } }
// //       agent {
// //         docker {
// //           image getImageForApp(env.APP)
// //           args '-v /var/run/docker.sock:/var/run/docker.sock'
// //         }
// //       }
// //       steps {
// //         script {
// //           dir(env.APP) {
// //             if (APP == 'java-app') {
// //               sh 'mvn test && mvn package -DskipTests'
// //             } else if (APP == 'node-app') {
// //               sh 'npm install && npm test && npm run build'
// //             } else if (APP == 'python-app') {
// //               sh 'pip install -r requirements.txt && pytest'
// //             } else if (APP == 'dotnet-app') {
// //               sh 'echo "dotnet build/test skipped (needs SDK image)"'
// //             }
// //           }
// //         }
// //       }
// //     }

// //     stage('Push Docker Image') {
// //       when {
// //         allOf {
// //           expression { return env.APP }
// //           anyOf { branch 'dev'; branch 'qa'; branch 'prod' }
// //         }
// //       }
// //       agent { label 'docker' }
// //       steps {
// //         withCredentials([usernamePassword(credentialsId: "${REGISTRY_CRED_ID}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
// //           dir(env.APP) {
// //             sh "docker build -t ${IMAGE_PREFIX}/${APP}:${BRANCH}-${BUILD_NUMBER} ."
// //             sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
// //             sh "docker push ${IMAGE_PREFIX}/${APP}:${BRANCH}-${BUILD_NUMBER}"
// //           }
// //         }
// //       }
// //     }
// //   }

// //   post {
// //     failure {
// //       echo "❌ ${APP ?: 'No App'} build failed!"
// //     }
// //     success {
// //       echo "✅ ${APP ?: 'No App'} build & deploy successful!"
// //     }
// //   }
// // }

// // def getImageForApp(appName) {
// //   switch(appName) {
// //     case 'java-app':   return 'maven:3.9.6-eclipse-temurin-17'
// //     case 'node-app':   return 'node:20-alpine'
// //     case 'python-app': return 'python:3.12-alpine'
// //     case 'dotnet-app': return 'mcr.microsoft.com/dotnet/sdk:7.0'
// //     default:           return 'alpine:latest'
// //   }
// // }
// // // pipeline {
// // //   agent {
// // //     docker {
// // //       // image 'docker:24.0.7'
// // //       image 'docker:24.0.7-dind'  // Alpine based Docker image with Docker daemon
// // //       args '-v /var/run/docker.sock:/var/run/docker.sock -u root'
// // //     }
// // //   }

// // //   environment {
// // //     REGISTRY_CRED_ID = 'dockerhub-creds'
// // //     IMAGE_PREFIX = 'amreshsharma199'
// // //     BRANCH = "${env.BRANCH_NAME}"
// // //   }

// // //   options {
// // //     skipDefaultCheckout true
// // //   }

// // //   stages {
// // //     stage('Checkout Code') {
// // //       steps {
// // //         checkout scm
// // //       }
// // //     }

// // //     stage('Detect Changed App') {
// // //       steps {
// // //         script {
// // //           def diff = sh(script: "git diff --name-only origin/${BRANCH}~1 origin/${BRANCH}", returnStdout: true).trim()
// // //           echo "Changed files:\n${diff}"

// // //           changedApp = ''
// // //           if (diff.contains('java-app/')) {
// // //             changedApp = 'java-app'
// // //           } else if (diff.contains('node-app/')) {
// // //             changedApp = 'node-app'
// // //           } else if (diff.contains('python-app/')) {
// // //             changedApp = 'python-app'
// // //           } else if (diff.contains('dotnet-app/')) {
// // //             changedApp = 'dotnet-app'
// // //           } else {
// // //             echo "No app-related changes detected. Skipping pipeline."
// // //             currentBuild.result = 'SUCCESS'
// // //             return
// // //           }

// // //           env.APP = changedApp
// // //           echo "Detected changed app: ${env.APP}"
// // //         }
// // //       }
// // //     }

// // //     stage('Run Tests') {
// // //       when {
// // //         expression { return env.APP != null }
// // //       }
// // //       steps {
// // //         script {
// // //           dir("${APP}") {
// // //             if (APP == 'java-app') {
// // //               sh 'apk add openjdk17 maven && mvn test'
// // //             } else if (APP == 'node-app') {
// // //               sh 'apk add nodejs npm && npm install && npm test'
// // //             } else if (APP == 'python-app') {
// // //               sh 'apk add python3 py3-pip && pip install -r requirements.txt && pytest'
// // //             } else if (APP == 'dotnet-app') {
// // //               sh 'apk add bash curl icu-libs krb5-libs libgcc libintl libssl1.1 libstdc++ zlib && echo "dotnet testing skipped (needs SDK setup)"'
// // //               // Dotnet ke liye Alpine image se testing karna tricky hota hai
// // //             }
// // //           }
// // //         }
// // //       }
// // //     }

// // //     stage('Build Docker Image') {
// // //       when {
// // //         expression { return env.APP != null }
// // //       }
// // //       steps {
// // //         dir("${APP}") {
// // //           script {
// // //             sh "docker build -t ${IMAGE_PREFIX}/${APP}:${BRANCH}-${BUILD_NUMBER} ."
// // //           }
// // //         }
// // //       }
// // //     }

// // //     stage('Push to Registry') {
// // //       when {
// // //         allOf {
// // //           expression { return env.APP != null }
// // //           anyOf {
// // //             branch 'dev'
// // //             branch 'qa'
// // //             branch 'prod'
// // //           }
// // //         }
// // //       }
// // //       steps {
// // //         withCredentials([usernamePassword(credentialsId: "${REGISTRY_CRED_ID}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
// // //           sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
// // //           sh "docker push ${IMAGE_PREFIX}/${APP}:${BRANCH}-${BUILD_NUMBER}"
// // //         }
// // //       }
// // //     }

// // //     stage('Deploy') {
// // //       when {
// // //         anyOf {
// // //           branch 'dev'
// // //           branch 'qa'
// // //           branch 'prod'
// // //         }
// // //       }
// // //       steps {
// // //         script {
// // //           def portMap = [
// // //             'java-app'   : '8080',
// // //             'node-app'   : '3000',
// // //             'python-app' : '5000',
// // //             'dotnet-app' : '5000'
// // //           ]
// // //           def port = portMap[APP]

// // //           sh "docker rm -f ${APP} || true"
// // //           sh "docker run -d --name ${APP} -p ${port}:${port} ${IMAGE_PREFIX}/${APP}:${BRANCH}-${BUILD_NUMBER}"
// // //         }
// // //       }
// // //     }
// // //   }

// // //   post {
// // //     failure {
// // //       echo '❌ Build failed!'
// // //     }
// // //     success {
// // //       echo "✅ Build and deployment of ${APP} to ${BRANCH} successful!"
// // //     }
// // //   }
// // //  }


// // // // pipeline {
// // // //   agent any

// // // //   environment {
// // // //     REGISTRY_CRED_ID = 'dockerhub-creds'   // Jenkins credentials ID
// // // //     IMAGE_PREFIX = 'amreshsharma199' // Update this as needed
// // // //     BRANCH = "${env.BRANCH_NAME}"
// // // //   }

// // // //   options {
// // // //     skipDefaultCheckout true
// // // //   }

// // // //   stages {
// // // //     stage('Checkout Code') {
// // // //       steps {
// // // //         checkout scm
// // // //       }
// // // //     }

// // // //     stage('Detect Changed App') {
// // // //       steps {
// // // //         script {
// // // //           def diff = sh(script: "git diff --name-only origin/${BRANCH}~1 origin/${BRANCH}", returnStdout: true).trim()
// // // //           echo "Changed files:\n${diff}"

// // // //           changedApp = ''
// // // //           if (diff.contains('java-app/')) {
// // // //             changedApp = 'java-app'
// // // //           } else if (diff.contains('node-app/')) {
// // // //             changedApp = 'node-app'
// // // //           } else if (diff.contains('python-app/')) {
// // // //             changedApp = 'python-app'
// // // //           } else if (diff.contains('dotnet-app/')) {
// // // //             changedApp = 'dotnet-app'
// // // //           } else {
// // // //             echo "No app-related changes detected. Skipping pipeline."
// // // //             currentBuild.result = 'SUCCESS'
// // // //             return
// // // //           }

// // // //           env.APP = changedApp
// // // //           echo "Detected changed app: ${env.APP}"
// // // //         }
// // // //       }
// // // //     }

// // // //     stage('Run Tests') {
// // // //       when {
// // // //         expression { return env.APP != null }
// // // //       }
// // // //       steps {
// // // //         script {
// // // //           dir("${APP}") {
// // // //             if (APP == 'java-app') {
// // // //               sh 'mvn test'
// // // //             } else if (APP == 'node-app') {
// // // //               sh 'npm install'
// // // //               sh 'npm test'
// // // //             } else if (APP == 'python-app') {
// // // //               sh 'pip install -r requirements.txt'
// // // //               sh 'pytest'
// // // //             } else if (APP == 'dotnet-app') {
// // // //               sh 'dotnet restore'
// // // //               sh 'dotnet test'
// // // //             }
// // // //           }
// // // //         }
// // // //       }
// // // //     }

// // // //     stage('Build Docker Image') {
// // // //       when {
// // // //         expression { return env.APP != null }
// // // //       }
// // // //       steps {
// // // //         dir("${APP}") {
// // // //           script {
// // // //             sh "docker build -t ${IMAGE_PREFIX}/${APP}:${BRANCH}-${BUILD_NUMBER} ."
// // // //           }
// // // //         }
// // // //       }
// // // //     }

// // // //     stage('Push to Registry') {
// // // //       when {
// // // //         allOf {
// // // //           expression { return env.APP != null }
// // // //           anyOf {
// // // //             branch 'dev'
// // // //             branch 'qa'
// // // //             branch 'prod'
// // // //           }
// // // //         }
// // // //       }
// // // //       steps {
// // // //         withCredentials([usernamePassword(credentialsId: "${REGISTRY_CRED_ID}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
// // // //           sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
// // // //           sh "docker push ${IMAGE_PREFIX}/${APP}:${BRANCH}-${BUILD_NUMBER}"
// // // //         }
// // // //       }
// // // //     }

// // // //     stage('Deploy') {
// // // //       when {
// // // //         anyOf {
// // // //           branch 'dev'
// // // //           branch 'qa'
// // // //           branch 'prod'
// // // //         }
// // // //       }
// // // //       steps {
// // // //         script {
// // // //           def portMap = [
// // // //             'java-app'   : '8080',
// // // //             'node-app'   : '3000',
// // // //             'python-app' : '5000',
// // // //             'dotnet-app' : '5000'
// // // //           ]
// // // //           def port = portMap[APP]

// // // //           sh "docker rm -f ${APP} || true"
// // // //           sh "docker run -d --name ${APP} -p ${port}:${port} ${IMAGE_PREFIX}/${APP}:${BRANCH}-${BUILD_NUMBER}"
// // // //         }
// // // //       }
// // // //     }
// // // //   }

// // // //   post {
// // // //     failure {
// // // //       echo '❌ Build failed!'
// // // //     }
// // // //     success {
// // // //       echo "✅ Build and deployment of ${APP} to ${BRANCH} successful!"
// // // //     }
// // // //   }
// // // // }
