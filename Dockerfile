FROM node:7.4-slim

# Install yarn
RUN mkdir -p /opt/yarn && curl -sL https://yarnpkg.com/latest.tar.gz | tar zxf - -C /opt/yarn --strip-components=1
ENV PATH=/opt/yarn/bin:$PATH

ENV packageName=soflow

ENV \
  COMPILED_DIR=/$packageName/compiled \
  SRC_DIR=/$packageName/src

# Include node_modules/.bin in PATH for not having to prefix commands
ENV PATH=$PATH:/$packageName/node_modules/.bin

RUN mkdir -p \
  # Compiled files
  $COMPILED_DIR \

  # Source files
  $SRC_DIR

WORKDIR /$packageName

COPY package.json yarn.lock ./

RUN \
  yarn install \
  && ln -s /$packageName/node_modules $SRC_DIR/node_modules \
  && ln -s /$packageName/node_modules $COMPILED_DIR/node_modules

WORKDIR $COMPILED_DIR

COPY . .

RUN babel \
  --copy-files \
  --quiet \
  --ignore node_modules \
  --out-dir $COMPILED_DIR \
  .
