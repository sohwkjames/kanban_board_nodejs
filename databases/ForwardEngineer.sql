-- MySQL Workbench Forward Engineering
USE `laile`;
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema nodelogin
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema nodelogin
-- -----------------------------------------------------
-- CREATE SCHEMA IF NOT EXISTS `nodelogin` DEFAULT CHARACTER SET utf8mb3 ;
-- USE `nodelogin` ; 

-----------------------------------------------------
-- Table `nodelogin`.`accounts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `accounts` (
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(100) NULL DEFAULT NULL,
  `isActive` INT NULL DEFAULT NULL,
  PRIMARY KEY (`username`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `nodelogin`.`application`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `application` (
  `App_Acronym` VARCHAR(45) NOT NULL,
  `App_description` LONGTEXT NULL DEFAULT NULL,
  `App_rnumber` INT NOT NULL,
  `App_startdate` DATETIME NOT NULL,
  `App_enddate` DATETIME NOT NULL,
  `App_permit_open` VARCHAR(100) NULL DEFAULT NULL,
  `App_permit_todolist` VARCHAR(100) NULL DEFAULT NULL,
  `App_permit_doing` VARCHAR(100) NULL DEFAULT NULL,
  `App_permit_done` VARCHAR(100) NULL DEFAULT NULL,
  `App_permit_create` VARCHAR(100) NULL DEFAULT NULL,
  `App_permit_plan` VARCHAR(100) NULL DEFAULT NULL,
  PRIMARY KEY (`App_Acronym`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `nodelogin`.`plan`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `plan` (
  `Plan_mvp_name` VARCHAR(100) NOT NULL,
  `Plan_startdate` DATETIME NULL DEFAULT NULL,
  `Plan_enddate` DATETIME NULL DEFAULT NULL,
  `Plan_app_acronym` VARCHAR(45) NOT NULL,
  `Plan_colour` VARCHAR(45) NULL DEFAULT '#ffffff',
  PRIMARY KEY (`Plan_mvp_name`, `Plan_app_acronym`),
  INDEX `App_Acronym` (`Plan_app_acronym` ASC) VISIBLE,
  CONSTRAINT `App_Acronym`
    FOREIGN KEY (`Plan_app_acronym`)
    REFERENCES `application` (`App_Acronym`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `nodelogin`.`sample`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sample` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NULL DEFAULT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `nodelogin`.`task`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS  `task` (
  `Task_id` VARCHAR(1000) NOT NULL,
  `Task_name` LONGTEXT NULL DEFAULT NULL,
  `Task_description` LONGTEXT NULL DEFAULT NULL,
  `Task_notes` LONGTEXT NULL DEFAULT NULL,
  `Task_plan` VARCHAR(100) NULL DEFAULT NULL,
  `Task_app_acronym` VARCHAR(45) NULL DEFAULT NULL,
  `Task_state` VARCHAR(45) NULL DEFAULT NULL,
  `Task_creator` VARCHAR(45) NULL DEFAULT NULL,
  `Task_owner` VARCHAR(45) NULL DEFAULT NULL,
  `Task_createDate` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`Task_id`),
  INDEX `Task_creator_idx` (`Task_creator` ASC) VISIBLE,
  INDEX `Task_app_acronym_idx` (`Task_app_acronym` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `nodelogin`.`usergroups`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS  `usergroups` (
  `groupname` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`groupname`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb3;


-- -----------------------------------------------------
-- Table `nodelogin`.`username_usergroup_pivot`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS  `username_usergroup_pivot` (
  `username` VARCHAR(200) NOT NULL,
  `usergroup` VARCHAR(200) NOT NULL,
  PRIMARY KEY (`username`, `usergroup`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb3;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
