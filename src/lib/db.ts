import { PrismaClient } from "@/generated/prisma";
import { sanitizeJsonForDatabase } from "./utils";

const globalForPrisma = global as unknown as { 
    prisma: PrismaClient
}

const createPrismaClient = () => {
  const client = new PrismaClient().$extends({
    query: {
      $allModels: {
        async create({ args, query }) {
          if (args.data) {
            args.data = sanitizeJsonForDatabase(args.data);
          }
          return query(args);
        },
        async update({ args, query }) {
          if (args.data) {
            args.data = sanitizeJsonForDatabase(args.data);
          }
          return query(args);
        },
        async upsert({ args, query }) {
          if (args.create) {
            args.create = sanitizeJsonForDatabase(args.create);
          }
          if (args.update) {
            args.update = sanitizeJsonForDatabase(args.update);
          }
          return query(args);
        },
        async createMany({ args, query }) {
          if (args.data) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map(item => sanitizeJsonForDatabase(item));
            } else {
              args.data = sanitizeJsonForDatabase(args.data);
            }
          }
          return query(args);
        },
        async updateMany({ args, query }) {
          if (args.data) {
            args.data = sanitizeJsonForDatabase(args.data);
          }
          return query(args);
        },
      },
    },
  });

  return client;
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
