-- 删除 StudyRecord 上 userId 的外键约束
ALTER TABLE `study_records` DROP FOREIGN KEY IF EXISTS `StudyRecord_userId_fkey`;
-- 删除 User 表
DROP TABLE IF EXISTS `users`;
