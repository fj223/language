ALTER TABLE `Course`
  ADD COLUMN `translations` JSON NULL;

ALTER TABLE `VideoResource`
  ADD COLUMN `translations` JSON NULL;
