import { PrismaClient } from "@/generated/prisma";
import { sanitizeJsonForDatabase } from "./utils";

const globalForPrisma = global as unknown as { 
    prisma: PrismaClient
}

const createPrismaClient = () => {
  const client = new PrismaClient();

  client.$use(async (params, next) => {
    if (params.action === 'create' || params.action === 'update' || params.action === 'upsert') {
      if (params.args.data) {
        params.args.data = sanitizeJsonForDatabase(params.args.data);
      }
    }

    if (params.action === 'createMany' || params.action === 'updateMany') {
      if (params.args.data) {
        if (Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map(item => sanitizeJsonForDatabase(item));
        } else {
          params.args.data = sanitizeJsonForDatabase(params.args.data);
        }
      }
    }

    return next(params);
  });

  return client;
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
