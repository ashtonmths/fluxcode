import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as {
	prisma?: PrismaClient;
	pool?: Pool;
};

const createPrismaClient = () => {
	// Reuse existing pool or create new one with connection limits
	globalForPrisma.pool ??= new Pool({
			connectionString: process.env.DATABASE_URL,
			max: 10, // Maximum number of connections in the pool
			idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
			connectionTimeoutMillis: 10000, // Connection timeout 10 seconds
		});

	const adapter = new PrismaPg(globalForPrisma.pool);

	return new PrismaClient({
		adapter,
		log:
			process.env.NODE_ENV === "development"
				? ["query", "error", "warn"]
				: ["error"],
	});
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;