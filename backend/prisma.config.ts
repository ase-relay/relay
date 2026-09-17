import { defineConfig } from '@prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: {
    kind: 'single',
    filePath: 'prisma/schema.prisma',
  },
  datasources: [
    {
      name: 'db',
      url: process.env.DATABASE_URL,
      directUrl: process.env.DIRECT_URL,
    },
  ],
});
