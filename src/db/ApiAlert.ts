import { Entity, Column,  Unique, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "api_alerts" })
@Unique("unique_alert", ["date", "alert", "state_id"])
class ApiAlert {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column("timestamptz", { nullable: false })
  date: Date;

  @Column("boolean", { nullable: false })
  alert: boolean;

  @Column("int", { nullable: false })
  state_id: number;
}

export default ApiAlert;
