# ==========================================
# Stage 1: Builder
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install semua dependencies (termasuk devDependencies untuk build TypeScript & Prisma)
RUN npm ci

# Copy seluruh source code dan schema Prisma
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript ke JavaScript (/dist)
RUN npm run build

# Filter node_modules hanya untuk production agar ukuran image lebih kecil
RUN npm prune --production


# ==========================================
# Stage 2: Production
# ==========================================
FROM node:20-alpine AS production

WORKDIR /app

# 1. Buat non-root user 'nodejs' terlebih dahulu
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 2. Salin package.json dengan ownership nodejs
COPY --chown=nodejs:nodejs package*.json ./

# 3. Salin hasil build & node_modules langsung dari stage 'builder' dengan ownership nodejs
# (Tanpa perlu RUN npm ci ulang dan TANPA RUN chown -R)
COPY --chown=nodejs:nodejs --from=builder /app/dist ./dist
COPY --chown=nodejs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs --from=builder /app/prisma ./prisma

# 4. Pindah ke non-root user demi keamanan
USER nodejs

# Expose port aplikasi
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Jalankan server
CMD ["node", "dist/index.js"]
