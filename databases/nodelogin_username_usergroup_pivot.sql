-- MySQL dump 10.13  Distrib 8.0.33, for Win64 (x86_64)
--
-- Host: localhost    Database: nodelogin
-- ------------------------------------------------------
-- Server version	8.0.33

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `username_usergroup_pivot`
--

LOCK TABLES `username_usergroup_pivot` WRITE;
/*!40000 ALTER TABLE `username_usergroup_pivot` DISABLE KEYS */;
INSERT INTO `username_usergroup_pivot` VALUES ('admin','admin'),('admin','devTeam'),('admin','projectLead'),('admin','projectManager'),('admin2','admin'),('allRoleUser','devTeam'),('allRoleUser','projectLead'),('allRoleUser','projectManager'),('dev1','devops'),('dev2','sqa'),('dev2','super'),('dev2','user'),('dev3','devTeam'),('devteam2','devTeam'),('james1','group1'),('james1','group2'),('james1','mygroup'),('james1','user'),('james123','user'),('pl1','projectLead'),('pl1','super'),('pl2','projectLead'),('pl2_2','projectLead'),('pm1','projectManager'),('pm2','projectManager'),('st1','group1'),('st1','user'),('superUser','projectManager'),('superUser','sqa'),('superUser','user'),('testDevops1','testDevops'),('testPl1','projectLead'),('testPm1','testPm');
/*!40000 ALTER TABLE `username_usergroup_pivot` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-07-20 15:21:40
