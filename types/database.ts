export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type BoardRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  color: string;
  visibility: "private" | "public";
  created_at: string;
  updated_at: string;
};

export type ColumnRow = {
  id: string;
  board_id: string;
  title: string;
  color: string;
  position: string;
  created_at: string;
  updated_at: string;
};

export type TaskRow = {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  position: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type LabelRow = {
  id: string;
  board_id: string;
  name: string;
  color: string;
};

export type TaskLabelRow = {
  task_id: string;
  label_id: string;
};

export type TaskWithLabels = TaskRow & { labels: LabelRow[] };

export type Database = {
  public: {
    Tables: {
      boards: Table<
        BoardRow,
        {
          title: string;
          id?: string;
          owner_id?: string;
          description?: string | null;
          color?: string;
          visibility?: BoardRow["visibility"];
          created_at?: string;
          updated_at?: string;
        },
        Partial<Omit<BoardRow, "id" | "created_at" | "updated_at">> & {
          updated_at?: string;
        }
      >;
      columns: Table<
        ColumnRow,
        {
          board_id: string;
          title: string;
          position: string;
          id?: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Omit<ColumnRow, "id" | "created_at" | "updated_at">> & {
          updated_at?: string;
        }
      >;
      tasks: Table<
        TaskRow,
        {
          board_id: string;
          column_id: string;
          title: string;
          position: string;
          id?: string;
          description?: string | null;
          priority?: TaskRow["priority"];
          due_date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Omit<TaskRow, "id" | "created_at" | "updated_at">> & {
          updated_at?: string;
        }
      >;
      labels: Table<
        LabelRow,
        Omit<LabelRow, "id"> & { id?: string },
        Partial<Omit<LabelRow, "id">>
      >;
      task_labels: Table<
        TaskLabelRow,
        TaskLabelRow,
        Partial<TaskLabelRow>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
