-- PostgreSQL schema for recipes (normalized ingredients and steps).
--
-- Run against a database you own, for example:
--   createdb recipes
--   psql -v ON_ERROR_STOP=1 -d recipes -f database/db.sql
--
-- Requires PostgreSQL 13+ (uses gen_random_uuid() without an extension).

BEGIN;

CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT recipes_name_nonempty CHECK (length(trim(name)) > 0)
);

CREATE TABLE ingredients (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    CONSTRAINT ingredients_name_unique UNIQUE (name),
    CONSTRAINT ingredients_name_nonempty CHECK (length(trim(name)) > 0)
);

-- Links a recipe to catalog ingredients with amount per line.
CREATE TABLE recipes_ingredients (
    id BIGSERIAL PRIMARY KEY,
    recipe_id UUID NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
    ingredient_id BIGINT NOT NULL REFERENCES ingredients (id) ON DELETE RESTRICT,
    quantity NUMERIC(14, 4) NOT NULL,
    unit TEXT NOT NULL,
    CONSTRAINT recipes_ingredients_unit_nonempty CHECK (length(trim(unit)) > 0),
    CONSTRAINT recipes_ingredients_quantity_nonnegative CHECK (quantity >= 0),
    CONSTRAINT recipes_ingredients_recipe_ingredient_unique UNIQUE (recipe_id, ingredient_id)
);

CREATE TABLE steps (
    id BIGSERIAL PRIMARY KEY,
    recipe_id UUID NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
    sort_order INT NOT NULL,
    instruction TEXT NOT NULL,
    CONSTRAINT steps_instruction_nonempty CHECK (length(trim(instruction)) > 0),
    CONSTRAINT steps_sort_positive CHECK (sort_order > 0),
    CONSTRAINT steps_recipe_order_unique UNIQUE (recipe_id, sort_order)
);

CREATE INDEX recipes_ingredients_recipe_id_idx ON recipes_ingredients (recipe_id);
CREATE INDEX recipes_ingredients_ingredient_id_idx ON recipes_ingredients (ingredient_id);
CREATE INDEX steps_recipe_id_idx ON steps (recipe_id);

CREATE OR REPLACE FUNCTION recipes_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER recipes_updated_at
    BEFORE UPDATE ON recipes
    FOR EACH ROW
    EXECUTE PROCEDURE recipes_set_updated_at();

COMMIT;
