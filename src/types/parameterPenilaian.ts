import type { ApiResponse } from "./common";

export type ParameterJson = string | number | boolean | null | ParameterJson[] | { [key: string]: ParameterJson };
export type ParameterContainer = ParameterJson[] | { [key: string]: ParameterJson };
export const QUESTION_TYPES = ["text", "textarea", "number", "decimal", "date", "datetime", "single_choice", "multiple_choice", "boolean", "rating", "scale", "file", "dropdown", "email", "time", "matrix", "description"] as const;
export type QuestionType = typeof QUESTION_TYPES[number];
export type ScoringType = "sum" | "average" | "weighted_average" | "formula";
interface Entity { id: number; created_at?: string | null; updated_at?: string | null; deleted_at?: string | null }
export interface SurveyContext extends Entity { code: string; title: string; module_id: number; template_module_id: number | null; status: string }
export interface ParameterSection extends Entity {
  survey_module_id: number; code: string; name: string; description: string | null;
  sort_order: number; is_active: boolean; visible_if: ParameterContainer | null;
  survey_module?: Pick<SurveyContext, "id" | "title" | "code"> | null;
  questions_count?: number; questions?: ParameterQuestion[]; configurations?: SectionConfiguration[];
}
export interface AssessmentPeriod extends Entity { year: number; quarter: number; start_date: string; end_date: string; status: "draft" | "active" | "closed" }
export interface SectionConfiguration extends Entity {
  parameter_section_id: number; assessment_period_id: number; weight: string;
  target_score: string | null; minimum_score: string | null; maximum_score: string | null; is_active: boolean;
  assessment_period?: AssessmentPeriod | null; parameter_section?: Pick<ParameterSection, "id" | "name" | "code"> | null;
}
export interface ParameterQuestion extends Entity {
  survey_module_id: number; parameter_section_id: number | null; code: string; type: QuestionType;
  question_text: string; help_text: string | null; placeholder: string | null; default_value: string | null;
  error_message: string | null; settings: ParameterContainer | null; validation_rules: ParameterContainer | null;
  visible_if: ParameterContainer | null; required_if: ParameterContainer | null;
  weight: string; sort_order: number; is_active: boolean; is_required: boolean; is_dynamic: boolean;
  options?: ParameterOption[]; options_count?: number; parameter_section?: Pick<ParameterSection, "id" | "name" | "code"> | null;
}
export interface ParameterOption extends Entity { question_id: number; code: string | null; label: string; value: string | null; score: string; sort_order: number; is_active: boolean }
export interface ScoringMethod extends Entity { survey_module_id: number; code: string; name: string; method_type: ScoringType; formula: string | null; configuration: ParameterContainer | null; is_default: boolean; is_active: boolean; sort_order: number; ranges_count?: number; ranges?: ScoringRange[] }
export interface ScoringRange extends Entity { scoring_method_id: number; code: string; label: string; min_score: string; max_score: string; color: string | null; sort_order: number }
export interface SectionRequest { survey_module_id: number; code: string; name: string; description: string | null; sort_order: number; is_active: boolean; visible_if: ParameterContainer | null }
export interface ConfigurationRequest { assessment_period_id: number; weight: string; target_score: string | null; minimum_score: string | null; maximum_score: string | null; is_active: boolean }
export interface PeriodRequest { year: number; quarter: number; start_date: string; end_date: string; status: AssessmentPeriod["status"] }
export interface QuestionRequest { survey_module_id: number; parameter_section_id: number; code: string; type: QuestionType; question_text: string; help_text: string | null; placeholder: string | null; default_value: string | null; error_message: string | null; settings: ParameterContainer | null; validation_rules: ParameterContainer | null; visible_if: ParameterContainer | null; required_if: ParameterContainer | null; weight: string; sort_order: number; is_active: boolean; is_required: boolean; is_dynamic: boolean }
export interface OptionRequest { code: string | null; label: string; value: string | null; score: string; sort_order: number; is_active: boolean }
export interface MethodRequest { survey_module_id: number; code: string; name: string; method_type: ScoringType; is_default: boolean; is_active: boolean; sort_order: number }
export interface RangeRequest { code: string; label: string; min_score: string; max_score: string; color: string | null; sort_order: number }
export interface ParameterEntities { sections: ParameterSection; configurations: SectionConfiguration; periods: AssessmentPeriod; questions: ParameterQuestion; options: ParameterOption; methods: ScoringMethod; ranges: ScoringRange }
export interface ParameterRequests { sections: SectionRequest; configurations: ConfigurationRequest; periods: PeriodRequest; questions: QuestionRequest; options: OptionRequest; methods: MethodRequest; ranges: RangeRequest }
export type ParameterResource = keyof ParameterEntities;
export type ParameterFilters = { survey_module_id?: number; parameter_section_id?: number; parentId?: number };
export type ParameterList<K extends ParameterResource> = ApiResponse<ParameterEntities[K][]>;
export type ParameterWrite<K extends ParameterResource> = ApiResponse<Pick<ParameterEntities[K], "id"> & Partial<ParameterEntities[K]>>;

