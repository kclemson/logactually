
ALTER TABLE feedback ADD COLUMN feedback_id integer;
ALTER TABLE feedback ADD COLUMN resolved_reason text;

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) + 999 AS num
  FROM feedback
)
UPDATE feedback SET feedback_id = numbered.num FROM numbered WHERE feedback.id = numbered.id;

CREATE SEQUENCE feedback_id_seq START WITH 1019;
ALTER TABLE feedback ALTER COLUMN feedback_id SET DEFAULT nextval('feedback_id_seq');
ALTER TABLE feedback ALTER COLUMN feedback_id SET NOT NULL;
