-- Add category column to Budget table
-- Stores comma-separated list of expense categories this budget tracks
ALTER TABLE "Budget" ADD COLUMN "category" TEXT NOT NULL DEFAULT '';
