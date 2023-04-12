import getDB, { ApiAlert } from "../db";
import Alert from "../db/Alert";

type RecordToDelete = {
  date_start: string;
  date_end: string;
  region_id: number;
  id1: number;
  id2: number;
};

export const mergeAlerts = async () => {
  const db = await getDB();

  await db.transaction("SERIALIZABLE", async (em) => {
    // SELECT ALL RECORDS THAT WOULD BE DELETED
    const response: RecordToDelete[] = await em.query(`
			WITH READY_TO_MERGE AS (
				SELECT *, row_number() OVER (PARTITION BY ALERT ORDER BY STATE_ID ASC, DATE ASC) AS GROUP_INDEX
				FROM (
					WITH CORE_DATA AS
						(SELECT ID, date, ALERT,
								STATE_ID,
								COUNT(*) OVER (PARTITION BY STATE_ID) AS TOTAL_RECORDS,
								ROW_NUMBER() OVER (PARTITION BY STATE_ID ORDER BY date) AS ROW_INDEX
							FROM API_ALERTS)
					SELECT *, 
						CASE
							WHEN ROW_INDEX=1 AND ALERT = FALSE THEN 0
							WHEN ROW_INDEX=TOTAL_RECORDS AND ALERT = TRUE THEN 0
							ELSE 1
						END AS is_taken
					FROM CORE_DATA
				) AS DATA_TO_TAKE
				WHERE IS_TAKEN=1
			)
			SELECT 
				MIN(date) as date_start,
				MAX(date) as date_end,
				MIN(state_id) as region_id,
				MIN(id) as id1,
				MAX(id) as id2
			FROM READY_TO_MERGE
			GROUP BY GROUP_INDEX
			ORDER BY date_start
		`);

    // MERGE THE API_ALERTS TO ALERTS
    for await (const record of response) {
      try {
        await em.insert(Alert, {
          region_id: record.region_id,
          date_start: record.date_start,
          date_end: record.date_end,
        });
      } catch (error) {
        continue;
      }
    }

    // DELETE ALL OF API_ALERTS THE ARE ALREADY MERGED
    for await (const record of response) {
      try {
        await em.delete(ApiAlert, [record.id1, record.id2]);
      } catch (error) {
        continue;
      }
    }
  });
};
