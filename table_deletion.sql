-- Nilgiribytes — drop all tables
-- Use only when intentionally resetting the database.

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `OrderItem`;
DROP TABLE IF EXISTS `Order`;
DROP TABLE IF EXISTS `AdminUser`;
DROP TABLE IF EXISTS `Product`;
DROP TABLE IF EXISTS `Combo`;
DROP TABLE IF EXISTS `Category`;
DROP TABLE IF EXISTS `BlogPost`;
DROP TABLE IF EXISTS `Settings`;

SET FOREIGN_KEY_CHECKS = 1;
