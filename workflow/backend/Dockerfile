# Build stage
FROM public.ecr.aws/docker/library/gradle:8.7-jdk17 AS build
WORKDIR /app
COPY . .
RUN gradle --no-daemon bootJar

# Runtime stage
FROM public.ecr.aws/docker/library/eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar /app/app.jar
EXPOSE 8080
ENV JAVA_OPTS=""
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]
