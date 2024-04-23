FROM node:20-alpine as dependencies
WORKDIR /home/app
COPY . /home/app
RUN npm ci

# NOTE: Temporarily disable linting and tests
# FROM dependencies as test
# RUN npm run lint && \
#    npm run test

FROM dependencies as prebuild
RUN npm prune --production && \
    rm -rf test && \
    rm -rf integration-test && \
    rm -rf perf-test

FROM node:20-alpine as build
RUN adduser -D konduituser
WORKDIR /home/konduituser/app
USER konduituser
COPY --chown=konduituser --from=prebuild /home/app .
