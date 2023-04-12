import EventSource from "eventsource";
import { createServer } from "http";
import config from "./config";
import getDB, { ApiAlert } from "./db";
import { seedAlerts } from "./actions/seedAlerts";
import { mergeAlerts } from "./actions/mergeAlerts";

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
        await mergeAlerts();
      } catch (error) {
        console.log("~~~Update error: ", error);
        return;
      }
    });
  });
};

bootstrap();
