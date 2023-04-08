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

    const reverseRecords = new Array<HistoryResponse>(data.length);
    data.forEach((record, index) => {
      reverseRecords[data.length - index - 1] = record;
    });
    for await (const record of reverseRecords) {
      try {
        const apiAlertRecord = apiAlertRepo.create(record);
        await apiAlertRepo.save({
          alert: apiAlertRecord.alert,
          date: apiAlertRecord.date,
          state_id: apiAlertRecord.state_id,
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

    sse.addEventListener("open", () => {
      console.log(`~~~~~~~ SERVER SIDE EVENT LISTENER OPENED ~~~~~~~`);
      seedAlerts();
    });

    sse.addEventListener("error", (data) => {
      console.log("AN ERROR OCCURED: ", data);
    });

    sse.addEventListener("update", async (data) => {
      const { state }: DataResponse = JSON.parse(data.data);
      const record = apiAlertRepo.create({
        state_id: state.id,
        alert: state.alert,
        date: state.changed,
      });
      try {
        await apiAlertRepo.save(record);
      } catch (error) {
        console.log("~~~Update error: ", error);
        return;
      }
    });
  });
};

bootstrap();
