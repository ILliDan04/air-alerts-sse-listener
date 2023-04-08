import axios from "axios";
import config from ".";

export const AirAlertAPI = axios.create({
  headers: {
    "X-API-Key": config.AIR_ALERT_API_ACCESS_KEY,
  },

  baseURL: config.AIR_ALERT_API_URL,
});
