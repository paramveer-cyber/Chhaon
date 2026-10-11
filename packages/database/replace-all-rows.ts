import { PgTable } from "drizzle-orm/pg-core";
import { db } from "./index";

const maximumRowsPerInsert = 5000;

export const replaceAllRows = <Table extends PgTable>(table: Table, rows: Table["$inferInsert"][]) =>
  db.transaction(async (transaction) => {
    await transaction.delete(table);
    for (let startIndex = 0; startIndex < rows.length; startIndex += maximumRowsPerInsert) {
      await transaction.insert(table).values(rows.slice(startIndex, startIndex + maximumRowsPerInsert));
    }
  });
