-- Remove the generated column and recreate it with the correct expression (without operations_ fields)
ALTER TABLE public.daily_checklists DROP COLUMN IF EXISTS is_perfect;

ALTER TABLE public.daily_checklists ADD COLUMN is_perfect boolean GENERATED ALWAYS AS (
  punctuality_on_time = true AND
  punctuality_uniforms = true AND
  punctuality_hair = true AND
  punctuality_makeup = true AND
  cleaning_reception = true AND
  cleaning_rooms = true AND
  cleaning_equipment = true AND
  cleaning_towels = true AND
  cleaning_bathrooms = true AND
  cleaning_common_areas = true AND
  cleaning_trash = true AND
  service_cordial = true AND
  service_on_time = true AND
  service_room_ready = true AND
  service_post_cleaning = true AND
  service_explanations = true AND
  service_satisfied = true AND
  behavior_quiet_environment = true AND
  behavior_clear_communication = true AND
  behavior_no_conflicts = true AND
  behavior_proactivity = true AND
  behavior_positive_climate = true
) STORED;