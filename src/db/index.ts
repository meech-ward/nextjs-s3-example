import { neon, neonConfig } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { Logger } from "drizzle-orm"
import { prettyPrintSQL } from "@/utils/sql-logger"


// neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL!)
// export const db = drizzle(sql);

class MyLogger implements Logger {
  async logQuery(query: string, params: unknown[]) {
    if (query.toLowerCase().trim().startsWith(`select "session`)) {
      return
    }
    await prettyPrintSQL(query, params)
    // console.log({ params })
  }
}

// export const db = drizzle(sql, { logger: true });
export const db = drizzle(sql, { logger: new MyLogger() })

export * from "drizzle-orm"
