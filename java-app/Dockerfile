FROM maven:3.9.3-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jdk
COPY --from=build /app/target/java-app-0.0.1.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
