import { DataSource } from "typeorm";
import ApiAlert from "./ApiAlert";
import config from "../config";

let AppDataSource: DataSource | null = null;

const getDB = async () => {
  if (!AppDataSource) {
    AppDataSource = new DataSource({
      type: "postgres",
      url: config.DATABASE_URL,
      logging: ["info"],
      synchronize: false,
      entities: [ApiAlert],
    });
  }
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
};

export default getDB;
export { ApiAlert };
