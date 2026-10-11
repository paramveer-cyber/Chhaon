FROM node:22-slim
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile --filter @repo/api...
RUN pnpm --filter @repo/api build
ENV NODE_ENV=prod
ENV AWS_REGION=ap-southeast-2
ENV PORT=8000
EXPOSE 8000
CMD ["node", "apps/api/dist/index.js"]
