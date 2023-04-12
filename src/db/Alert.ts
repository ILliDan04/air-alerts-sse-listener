import { Entity, Column, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity({ name: "alerts" })
@Unique("unique_date_start_for_region", ["region_id", "date_start"])
@Unique("unique_date_end_for_region", ["region_id", "date_end"])
class Alert {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column("timestamptz", { nullable: false })
  date_start: Date;

  @Column("timestamptz", { nullable: false })
  date_end: Date;

  @Column("int", { nullable: false })
  region_id: number;
}

export default Alert;
