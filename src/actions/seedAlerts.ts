import { AirAlertAPI } from "../config/AirAlertAPI";
import getDB, { ApiAlert } from "../db";

type HistoryResponse = {
  id: number;
  date: string;
  state_id: number;
  alert: boolean;
};

export const seedAlerts = async () => {
  const db = await getDB();
  const apiAlertRepo = db.getRepository(ApiAlert);

  try {
    const { data } = await AirAlertAPI.get<HistoryResponse[]>("history");
    const uniqueRecords: ApiAlert[] = [
      ...new Set(
        data.map((value) =>
          JSON.stringify({
            alert: value.alert,
            state_id: value.state_id,
            date: value.date,
          })
        )
      ),
    ].map((value) => {
      const data = JSON.parse(value) as HistoryResponse;
      return {
        ...data,
        date: new Date(data.date),
      };
    });

    const reverseRecords = new Array<ApiAlert>(uniqueRecords.length);
    uniqueRecords.forEach((record, index) => {
      reverseRecords[uniqueRecords.length - index - 1] = record;
    });

    for await (const record of reverseRecords) {
      try {
        const exist = await apiAlertRepo.exist({
          where: {
            alert: record.alert,
            state_id: record.state_id,
            date: record.date,
          },
        });
        if (exist) {
          break;
        }
        await apiAlertRepo.save({
          alert: record.alert,
          state_id: record.state_id,
          date: record.date,
        });
      } catch (error) {
        continue;
      }
    }
    console.log("~~~Seed is just done or had been done before~~~");
  } catch (error) {
    console.log("~~~Request error: ", error);
    return;
  }
};
