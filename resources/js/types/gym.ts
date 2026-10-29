export type Option = {
    value: string;
    label: string;
};

export type TrackingType = 'weight_reps' | 'reps' | 'time' | 'distance_time';

export type BodyZone = 'superior' | 'inferior' | 'core' | 'cuerpo_completo';

export type MuscleGroup = {
    id: number;
    name: string;
    slug: string;
    body_zone: BodyZone;
    body_zone_label: string;
};

export type MuscleRef = {
    id: number;
    name: string;
};

export type Exercise = {
    id: number;
    name: string;
    slug: string;
    category: string;
    category_label: string;
    equipment: string | null;
    equipment_label: string | null;
    level_label: string | null;
    mechanic_label: string | null;
    tracking_type: TrackingType;
    image_url: string | null;
    image_alt_url: string | null;
    is_custom: boolean;
    is_hyrox: boolean;
    can_edit: boolean;
    body_zone: BodyZone | null;
    body_zone_label: string | null;
    primary_muscles?: MuscleRef[];
    secondary_muscles?: MuscleRef[];
    instructions?: string[];
};

export type SuggestionReason =
    | 'first_time'
    | 'increase_weight'
    | 'increase_reps'
    | 'add_load'
    | 'increase_time'
    | 'decrease_time'
    | 'deload';

export type Suggestion = {
    reason: SuggestionReason;
    reason_label: string;
    message: string;
    has_history: boolean;
    sets: number;
    reps: number | null;
    reps_min: number | null;
    reps_max: number | null;
    weight_kg: number | null;
    duration_seconds: number | null;
    distance_m: number | null;
    last_performance: string | null;
    last_performed_at: string | null;
};

export type RoutineExercise = {
    id: number;
    position: number;
    target_sets: number;
    target_reps_min: number | null;
    target_reps_max: number | null;
    target_weight_kg: number | null;
    target_seconds: number | null;
    target_distance_m: number | null;
    rest_seconds: number | null;
    notes: string | null;
    exercise: Exercise;
};

export type Routine = {
    id: number;
    name: string;
    description: string | null;
    is_public: boolean;
    share_url: string | null;
    exercises_count?: number;
    exercises?: RoutineExercise[];
    updated_at: string | null;
};

export type WorkoutSet = {
    id: number;
    exercise_id: number;
    set_number: number;
    reps: number | null;
    weight_kg: number | null;
    duration_seconds: number | null;
    distance_m: number | null;
    rpe: number | null;
    is_warmup: boolean;
};

export type WorkoutSession = {
    id: number;
    name: string;
    routine_id: number | null;
    started_at: string;
    finished_at: string | null;
    duration_minutes: number | null;
    notes: string | null;
    share_url: string | null;
    sets_count?: number;
    exercises_count?: number;
    volume_kg?: number;
    sets?: WorkoutSet[];
};

export type WorkoutEntry = {
    exercise: Exercise;
    target: RoutineExercise | null;
    suggestion: Suggestion;
};

export type ActivitySplit = {
    id: number;
    position: number;
    label: string;
    distance_m: number | null;
    duration_seconds: number;
    duration_label: string;
    pace_seconds_per_km: number | null;
};

export type Activity = {
    id: number;
    type: string;
    type_label: string;
    name: string;
    started_at: string;
    distance_m: number;
    distance_km: number;
    duration_seconds: number;
    duration_label: string;
    moving_seconds: number | null;
    pace_seconds_per_km: number | null;
    pace_label: string | null;
    elevation_gain_m: number | null;
    avg_hr: number | null;
    max_hr: number | null;
    calories: number | null;
    source: 'manual' | 'strava' | 'shortcut';
    source_label: string;
    share_url: string | null;
    splits?: ActivitySplit[];
};

export type RunningRecord = {
    label: string;
    distance_m: number;
    activity_id: number | null;
    duration_seconds: number | null;
    duration_label: string | null;
    pace_label: string | null;
    date: string | null;
};

export type PersonalRecord = {
    exercise_id: number;
    exercise: string;
    weight_kg: number;
    reps: number;
    estimated_1rm: number;
    max_weight_kg: number;
    date: string;
};

export type WeeklyVolume = {
    week: string;
    label: string;
} & Record<BodyZone, number>;

export type MuscleDistribution = {
    muscle: string;
    zone: BodyZone;
    sets: number;
    volume_kg: number;
};

export type WeeklyRunning = {
    week: string;
    label: string;
    km: number;
    runs: number;
    pace_seconds_per_km: number | null;
};

export type ExerciseProgressPoint = {
    date: string;
    max_weight_kg: number | null;
    max_reps: number | null;
    total_reps: number;
    volume_kg: number;
    estimated_1rm: number | null;
    best_duration_seconds: number | null;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    next_page_url: string | null;
    prev_page_url: string | null;
    links: { url: string | null; label: string; active: boolean }[];
};
