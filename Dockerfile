# Stage 1: build the frontend
FROM node:20 AS fe
WORKDIR /fe
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: build the backend jar (with the built frontend served from static/)
FROM maven:3.9-eclipse-temurin-21 AS be
WORKDIR /be
COPY backend/pom.xml ./
RUN mvn -q -B dependency:go-offline
COPY backend/src ./src
COPY --from=fe /fe/dist/ ./src/main/resources/static/
RUN mvn -q -B -DskipTests package

# Stage 3: slim runtime image
FROM eclipse-temurin:21-jre
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=60.0 -XX:+UseSerialGC"
RUN useradd --system --no-create-home app
COPY --from=be /be/target/*.jar /app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
