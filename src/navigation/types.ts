// src/navigation/types.ts
export interface P2HDetail {
  fid_p2h: string;
  unit: string;
  driver: string;
  tanggal: string;
}
export interface JCMItem {
  id: number | string;
  unitno: string;
  wono: string;
  fid_wotask: string;
  wo_task_no: string;
  task_desc: string;
  jde_mekanik: string;
  nama_mekanik: string;
  tanggal_mulai: string; // format: 'dd-mm-yyyy'
  waktu_mulai: string; // format: 'HH:MM:SS'
  tanggal_selesai: string; // sebenarnya waktu (dari `date_finish` -> format waktu)
  waktu_selesai: string; // dari `time_finish`
  durasi: string;
  remark: string;
  status: string;
  validate_status: string;
  jde_pengawas: string;
  nama_pengawas: string;
  unit_grp_id: string;
  parrend_wo_task: string;
  fid_hdr: string;
}

export interface MentoringData {
  id: number;
  trainer_name: string;
  operator_name: string;
  class_name: string;
  site: string;
  area: string;
  unit_number: string;
  unit_type: string;
  date_mentoring: string;
  start_time: string;
  end_time: string;
  average_point_observation: string;
  average_point_mentoring: string;
}

export interface DailyActivity {
  id: number;
  jde_no: string;
  employee_name: string;
  site: string;
  date_activity: string; // format: "YYYY-MM-DD HH:mm:ss"
  kpi_type: string;
  kpi_name: string;
  activity_name: string;
  activity: string;
  unit_model: string;
  total_participant: number;
  total_hour: number;
  created_at: string | null;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

export interface TrainHours {
  id: number;
  jde_no: number;
  employee_name: string;
  position: string;
  training_type: string; // format: "YYYY-MM-DD HH:mm:ss"
  unit_class: number;
  unit_type: string;
  code: number;
  batch: string;
  plan_total_hm: number;
  hm_start: number;
  hm_end: number;
  total_hm: number;
  progres: number;
  site: string;
  date_activity: string;
  created_at: string | null;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

export interface MopData {
  id: number;
  jde_no: string;
  employee_name: string;
  equipment_type1: string | null;
  equipment_type2: string | null;
  equipment_type3: string | null;
  equipment_type4: string | null;
  equipment_type5: string | null;
  equipment_type6: string | null;
  input_date: string | null;
  month: string;
  year: string;
  a_attendance_ratio: string;
  b_discipline: string;
  c_safety_awareness: string;
  d_wh_waste_equiptype1: string | null;
  d_wh_waste_equiptype2: string | null;
  d_wh_waste_equiptype3: string | null;
  d_wh_waste_equiptype4: string | null;
  d_wh_waste_equiptype5: string | null;
  d_wh_waste_equiptype6: string | null;
  e_pty_equiptype1: string | null;
  e_pty_equiptype2: string | null;
  e_pty_equiptype3: string | null;
  e_pty_equiptype4: string | null;
  e_pty_equiptype5: string | null;
  e_pty_equiptype6: string | null;
  point_eligibilitas: string;
  point_produksi: string;
  total_point: string;
  mop_bulanan_grade: string;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
  site: string;
  mop_type: string;
  target_avg_hm: string;
  point_a: string;
  point_b: string;
  point_c: string;
  point_d: string;
  point_e: string;
}

export type RootStackParamList = {
  AuthLoading: undefined;
  Login: undefined;
  MainApp: undefined;
  //Data Mentoring
  Data: undefined;
  EditDataMentoring: {data: any};
  FormDigger: {unitType: string};
  FormHauler: {unitType: string};
  FormBuldozer: {unitType: string};
  FormGrader: {unitType: string};
  //Daily
  DailyActivity: undefined;
  AddDailyActivity: undefined;
  EditDailyActivity: {data: any};
  //TrainHours
  TrainHours: undefined;
  AddTrainHours: undefined;
  EditTrainHours: {data: any};
  //MOP
  Mop: undefined;
  AddMop: undefined;
};
