FROM trym/watchexec-alpine as watchexec
FROM node:10-alpine as production

COPY --from=watchexec /bin/watchexec /bin

RUN apk -U add bash git rsync

# Include node_modules/.bin in PATH for not having to prefix commands
ENV PATH=$PATH:/soflow/node_modules/.bin

RUN mkdir /soflow

WORKDIR /soflow

COPY package.json yarn.lock ./
RUN yarn
COPY . .
RUN ln -s /soflow /soflow/node_modules/soflow
RUN cd test && yarn install --flat --production --ignore-optional --modules-folder ../lambda-modules


CMD scripts/start-dev
