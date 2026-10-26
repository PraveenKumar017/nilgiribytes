-- Nilgiribytes — drop Phase 1 storefront tables
-- Order avoids foreign-key conflicts. Use only when intentionally resetting data.

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `ComboItem`;
DROP TABLE IF EXISTS `ProductSize`;
DROP TABLE IF EXISTS `Product`;
DROP TABLE IF EXISTS `Combo`;
DROP TABLE IF EXISTS `Category`;
DROP TABLE IF EXISTS `BlogPost`;

SET FOREIGN_KEY_CHECKS = 1;
