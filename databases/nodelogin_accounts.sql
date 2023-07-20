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
-- Dumping data for table `accounts`
--

LOCK TABLES `accounts` WRITE;
/*!40000 ALTER TABLE `accounts` DISABLE KEYS */;
INSERT INTO `accounts` VALUES ('admin','$2a$10$HyWrNnc0.Fq./toEoNvBbOQln5r4bhYIm8qZgFjGEXi07lKTbEU2G','hithere11@email.com',1),('admin2','$2a$10$m1SUKF4ZKXGb17eNHd6zm.3JoImKKtn0VHG5ez.VMEyIm1dQodMWe','',1),('allRoleUser','$2a$10$HPwIcTxCnihvIQbbXLD48eQJBf0kfD9yzqu4a79rgt7SZASoOJ1Ga',NULL,1),('dev1','$2a$10$xCJ8C/yNhL57Z84oWun.JehGqIiy0MRsC61SoNKGqQ33bhn3Mw/Sy','dev1@email.com',1),('dev2','$2a$10$c9vrckp2WUxlitYkUROu.ehitr.mE8T3BOObH74jUx58/uX26CkZu','',1),('dev3','$2a$10$nygQCYZggG1nYC6GspnMB.jvJjakBFJzvHpe8MjGMH9WKa37dwPf2',NULL,1),('devteam2','$2a$10$cIJbYRjJIXXkYWadYA1wtO8k2CrIqAFrO926qdN4GCN8r2C7qRTmu','devteam2@email.com',1),('james1','$2a$10$6TOus1B9ZeSulqV1pvL71eT8/enxaxPQIUALIntCgMakH1xH2FuwO','james@email.com',1),('james123','$2a$10$OZYUdgqSxSCVIhwQocj7.ub1FEGkB5vDupyVYUmKWE/We3JsDHBdi','myEmail@email.com',1),('pl1','$2a$10$pOhDhDNCwLBWhiKLMsig6.xbZuws2kZOB.IN.rVgj.lzAI9fbxX8G','pl1@email.com',1),('pl2','$2a$10$3SxHcEfaKVeGSpaC1pzhLusYrUOYqz/7pacO8vdb/yzlV1r2Inddq','pl2@email.com',1),('pl2_2','$2a$10$/TLVj8b1m4ca3pB7BlwUeOttApgIA.SIE6JfM/m0XwScQ4rF1Czf6','pl2_2@email.com',1),('pm1','$2a$10$CWaCU7jzGHGqCfq6w31ABOQFDzR4ZzJkP6xo66Lv/0YhGxur1txxq','pm1@email.com',1),('pm2','$2a$10$KVoHWD4szePhJrVlqiGPp.tLwqMMeXbIX2AbDVqgfdwCrvTg64yOq','pm2@email.com',1),('st1','$2a$10$I.fTZzOQITyl3v.Ek8idWOv5AKI5HMSJhy/J7DziYcheBp/F7I32W','st1@email11.com',0),('superUser','$2a$10$iqSHyJk6llMuxweNp/fNYOZn88.PMrNzHAbbEkwnZfSz92gOCKcFW',NULL,1),('testDevops1','$2a$10$CSNlUZVPmfUzFPS5049CZeXsgjzBEP1llnotryKbrNgiIDX6VaQfq',NULL,1),('testPl1','$2a$10$y.tUMhbnKj9cpxPClFQyO.8EZuVd.T/4UxS1gv/lghH3opEC13i5u','testpl1@email.com',1),('testPm1','$2a$10$RRwKipNcCo3Utqt2vnbVtefTNj9CcxG60wyMvKq0IoeggZIGLI0sy','testpm1@email.com',1);
/*!40000 ALTER TABLE `accounts` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-07-20 15:21:41
