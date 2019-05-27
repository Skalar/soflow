FROM trym/watchexec-alpine as watchexec
FROM node:8.10.0-alpine
FROM node:9.6.1-alpine as production

COPY --from=watchexec /bin/watchexec /bin
COPY --from=node:8.10.0-alpine /usr/local /usr/local-8.10.0

# Prepare node binary links/wrappers in /node
RUN \
  mkdir -p /node && \
  ln -s /usr/local-8.10.0/bin/node /node/8.10.0 && \
  ln -s /usr/local/bin/node /node/9.6.1-native

ENV NODE_TARGETS="8.10.0 9.6.1-native"

RUN apk -U add bash git rsync

# Include node_modules/.bin in PATH for not having to prefix commands
ENV PATH=$PATH:/soflow/node_modules/.bin

RUN mkdir /soflow

WORKDIR /soflow

RUN \
  ln -s lib lib-9_6_1-native && \
  ln -s test test-9_6_1-native

COPY package.json yarn.lock ./
RUN yarn
COPY . .
RUN ln -s /soflow /soflow/node_modules/soflow
RUN cd test && yarn install --flat --production --ignore-optional --modules-folder ../lambda-modules


CMD scripts/start-dev
