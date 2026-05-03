FROM eclipse-temurin:17 AS build
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline
COPY src/ src/
RUN ./mvnw package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app

# Install Python and dependencies
RUN --mount=type=cache,target=/root/.cache/pip \
    apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install requests pdfplumber && \
    rm -rf /var/lib/apt/lists/*
ENV PATH="/opt/venv/bin:$PATH"

COPY --from=build /app/target/AIC-0.0.1-SNAPSHOT.jar app.jar
COPY extragereMeteoAutomatizata/ extragereMeteoAutomatizata/
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
