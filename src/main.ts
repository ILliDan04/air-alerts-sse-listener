import EventSource from "eventsource";
import { createServer } from "http";
import config from "./config";
import getDB, { ApiAlert } from "./db";
import { AirAlertAPI } from "./config/AirAlertAPI";

type DataResponse = {
  state: {
    id: number;
    name: string;
    name_en: string;
    alert: boolean;
    changed: string;
  };
  notification_id: string;
};

type HistoryResponse = {
  id: number;
  date: string;
  state_id: number;
  alert: boolean;
};

const seedAlerts = async () => {
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

const bootstrap = async () => {
  const db = await getDB();
  const apiAlertRepo = db.getRepository(ApiAlert);

  createServer().listen(config.PORT, () => {
    console.log(`~~~~~~~ SERVER STARTED ON PORT ${config.PORT} ~~~~~~~`);

    const sse = new EventSource(`${process.env.AIR_ALERT_API_URL}states/live`, {
      headers: {
        "X-API-Key": process.env.AIR_ALERT_API_ACCESS_KEY,
      },
    });

    sse.addEventListener("open", async () => {
      console.log(`~~~~~~~ SERVER SIDE EVENT LISTENER OPENED ~~~~~~~`);
      await seedAlerts();
    });

    sse.addEventListener("error", (data) => {
      console.log("AN ERROR OCCURED: ", data);
    });

    sse.addEventListener("update", async (data) => {
      const { state }: DataResponse = JSON.parse(data.data);
      try {
        await apiAlertRepo.save({
          alert: state.alert,
          date: state.changed,
          state_id: state.id,
        });
      } catch (error) {
        console.log("~~~Update error: ", error);
        return;
      }
    });
  });
};

bootstrap();
