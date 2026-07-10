-- Municipality trail length metrics by facility type and status.
--
-- Totals:
--   existing_* / paved_footway / natural_surface_footway -> total_existing
--   planned_*                                            -> total_planned
--   proposed_*                                           -> total_proposed
--
-- Classification rules (fac_stat: 1 = existing, 2/3 = non-existing):
--   bike_facilities_publish, walking_trails_publish, shared_use_paths_publish
--


CREATE OR REPLACE VIEW mapc.municipality_trail_metrics AS
WITH classified_segments AS (
  -- bike_facilities_publish
  SELECT muni_id, 'existing_protected_bike_lanes'::text AS trail_type, COALESCE(length_ft, 0)::double precision AS length_ft
  FROM mapc.bike_facilities_publish
  WHERE fac_stat = 1 AND fac_type = 2 AND muni_id IS NOT NULL

  UNION ALL
  SELECT muni_id, 'planned_protected_bike_lanes', COALESCE(length_ft, 0)::double precision
  FROM mapc.bike_facilities_publish
  WHERE fac_stat IN (2, 3) AND fac_type = 2 AND muni_id IS NOT NULL

  UNION ALL
  SELECT muni_id, 'existing_bike_lanes', COALESCE(length_ft, 0)::double precision
  FROM mapc.bike_facilities_publish
  WHERE fac_stat = 1 AND fac_type = 1 AND muni_id IS NOT NULL

  UNION ALL
  SELECT muni_id, 'proposed_bike_lanes', COALESCE(length_ft, 0)::double precision
  FROM mapc.bike_facilities_publish
  WHERE fac_stat IN (2, 3) AND fac_type = 1 AND muni_id IS NOT NULL

  UNION ALL

  -- walking_trails_publish (footways)
  SELECT muni_id, 'paved_footway', COALESCE(length_ft, 0)::double precision
  FROM mapc.walking_trails_publish
  WHERE fac_stat = 1 AND fac_type = 1 AND acc_status = 'Public' AND muni_id IS NOT NULL

  UNION ALL
  SELECT muni_id, 'proposed_paved_footway', COALESCE(length_ft, 0)::double precision
  FROM mapc.walking_trails_publish
  WHERE fac_stat IN (2, 3) AND fac_type = 1 AND acc_status = 'Public' AND muni_id IS NOT NULL

  UNION ALL
  SELECT muni_id, 'natural_surface_footway', COALESCE(length_ft, 0)::double precision
  FROM mapc.walking_trails_publish
  WHERE fac_stat = 1 AND fac_type = 2 AND acc_status = 'Public' AND muni_id IS NOT NULL

  UNION ALL
  SELECT muni_id, 'proposed_natural_surface_footway', COALESCE(length_ft, 0)::double precision
  FROM mapc.walking_trails_publish
  WHERE fac_stat IN (2, 3) AND fac_type = 2 AND acc_status = 'Public' AND muni_id IS NOT NULL

  UNION ALL

  -- walking_trails_publish (paved shared-use paths)
  SELECT muni_id, 'existing_paved_shared_use_paths', COALESCE(length_ft, 0)::double precision
  FROM mapc.walking_trails_publish
  WHERE fac_stat = 1 AND fac_type IN (1, 2) AND muni_id IS NOT NULL

  UNION ALL
  SELECT muni_id, 'proposed_paved_shared_use_paths', COALESCE(length_ft, 0)::double precision
  FROM mapc.walking_trails_publish
  WHERE fac_stat IN (2, 3) AND fac_type IN (1, 2) AND muni_id IS NOT NULL

  UNION ALL

  -- shared_use_paths_publish (unimproved shared-use paths)
  SELECT muni_id, 'existing_unimproved_shared_use_paths', COALESCE(length_ft, 0)::double precision
  FROM mapc.shared_use_paths_publish
  WHERE fac_stat = 1 AND fac_type = 3 AND muni_id IS NOT NULL

  UNION ALL
  SELECT muni_id, 'proposed_unimproved_shared_use_paths', COALESCE(length_ft, 0)::double precision
  FROM mapc.shared_use_paths_publish
  WHERE fac_stat IN (2, 3) AND fac_type = 3 AND muni_id IS NOT NULL
),
aggregated AS (
  SELECT
    muni_id,

    SUM(length_ft) FILTER (WHERE trail_type = 'existing_protected_bike_lanes')
      AS existing_protected_bike_lanes_length_ft,
    SUM(length_ft) FILTER (WHERE trail_type = 'planned_protected_bike_lanes')
      AS planned_protected_bike_lanes_length_ft,

    SUM(length_ft) FILTER (WHERE trail_type = 'existing_bike_lanes')
      AS existing_bike_lanes_length_ft,
    SUM(length_ft) FILTER (WHERE trail_type = 'proposed_bike_lanes')
      AS proposed_bike_lanes_length_ft,

    SUM(length_ft) FILTER (WHERE trail_type = 'paved_footway')
      AS paved_footway_length_ft,
    SUM(length_ft) FILTER (WHERE trail_type = 'proposed_paved_footway')
      AS proposed_paved_footway_length_ft,

    SUM(length_ft) FILTER (WHERE trail_type = 'natural_surface_footway')
      AS natural_surface_footway_length_ft,
    SUM(length_ft) FILTER (WHERE trail_type = 'proposed_natural_surface_footway')
      AS proposed_natural_surface_footway_length_ft,

    SUM(length_ft) FILTER (WHERE trail_type = 'existing_paved_shared_use_paths')
      AS existing_paved_shared_use_paths_length_ft,
    SUM(length_ft) FILTER (WHERE trail_type = 'proposed_paved_shared_use_paths')
      AS proposed_paved_shared_use_paths_length_ft,

    SUM(length_ft) FILTER (WHERE trail_type = 'existing_unimproved_shared_use_paths')
      AS existing_unimproved_shared_use_paths_length_ft,
    SUM(length_ft) FILTER (WHERE trail_type = 'proposed_unimproved_shared_use_paths')
      AS proposed_unimproved_shared_use_paths_length_ft,

    SUM(length_ft) FILTER (WHERE starts_with(trail_type, 'planned_'))
      AS total_planned_length_ft,
    SUM(length_ft) FILTER (WHERE starts_with(trail_type, 'proposed_'))
      AS total_proposed_length_ft,
    SUM(length_ft) FILTER (
      WHERE NOT starts_with(trail_type, 'planned_')
        AND NOT starts_with(trail_type, 'proposed_')
    ) AS total_existing_length_ft

  FROM classified_segments
  GROUP BY muni_id
)
SELECT
  muni_id,

  existing_protected_bike_lanes_length_ft,
  ROUND(existing_protected_bike_lanes_length_ft::numeric / 5280, 2)
    AS existing_protected_bike_lanes_length_mi,
  planned_protected_bike_lanes_length_ft,
  ROUND(planned_protected_bike_lanes_length_ft::numeric / 5280, 2)
    AS planned_protected_bike_lanes_length_mi,

  existing_bike_lanes_length_ft,
  ROUND(existing_bike_lanes_length_ft::numeric / 5280, 2)
    AS existing_bike_lanes_length_mi,
  proposed_bike_lanes_length_ft,
  ROUND(proposed_bike_lanes_length_ft::numeric / 5280, 2)
    AS proposed_bike_lanes_length_mi,

  paved_footway_length_ft,
  ROUND(paved_footway_length_ft::numeric / 5280, 2)
    AS paved_footway_length_mi,
  proposed_paved_footway_length_ft,
  ROUND(proposed_paved_footway_length_ft::numeric / 5280, 2)
    AS proposed_paved_footway_length_mi,

  natural_surface_footway_length_ft,
  ROUND(natural_surface_footway_length_ft::numeric / 5280, 2)
    AS natural_surface_footway_length_mi,
  proposed_natural_surface_footway_length_ft,
  ROUND(proposed_natural_surface_footway_length_ft::numeric / 5280, 2)
    AS proposed_natural_surface_footway_length_mi,

  existing_paved_shared_use_paths_length_ft,
  ROUND(existing_paved_shared_use_paths_length_ft::numeric / 5280, 2)
    AS existing_paved_shared_use_paths_length_mi,
  proposed_paved_shared_use_paths_length_ft,
  ROUND(proposed_paved_shared_use_paths_length_ft::numeric / 5280, 2)
    AS proposed_paved_shared_use_paths_length_mi,

  existing_unimproved_shared_use_paths_length_ft,
  ROUND(existing_unimproved_shared_use_paths_length_ft::numeric / 5280, 2)
    AS existing_unimproved_shared_use_paths_length_mi,
  proposed_unimproved_shared_use_paths_length_ft,
  ROUND(proposed_unimproved_shared_use_paths_length_ft::numeric / 5280, 2)
    AS proposed_unimproved_shared_use_paths_length_mi,

  total_existing_length_ft,
  ROUND(total_existing_length_ft::numeric / 5280, 2) AS total_existing_length_mi,

  total_planned_length_ft,
  ROUND(total_planned_length_ft::numeric / 5280, 2) AS total_planned_length_mi,

  total_proposed_length_ft,
  ROUND(total_proposed_length_ft::numeric / 5280, 2) AS total_proposed_length_mi
FROM aggregated;

DROP VIEW IF EXISTS mapc.municipality_trail_metrics_classified;
DROP VIEW IF EXISTS mapc.municipality_trail_metrics_long;
