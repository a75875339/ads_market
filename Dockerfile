ARG BASE_IMAGE=node:24.12.0
ARG PNPM_VERSION=10.26.2


FROM ${BASE_IMAGE} AS base
WORKDIR /app

FROM base AS build-base

ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION}
# pnpm fetch requires only lockfile
COPY pnpm-lock.yaml ./
RUN pnpm fetch --prod
COPY package.json ./
RUN pnpm install --frozen-lockfile --prod

FROM build-base as build
RUN pnpm install
COPY . .

ENV NODE_ENV=${NODE_ENV}

COPY config config